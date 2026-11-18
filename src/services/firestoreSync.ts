import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Gallery, SiteContentConfig, DownloadLog, FavoriteLog, BookingInquiry, UserProfile } from '../types';
import { INITIAL_GALLERIES, DEFAULT_SITE_CONTENT } from './storage';
import { DEFAULT_PHOTOGRAPHER_PROFILE } from './userService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((p: any) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strips all undefined fields from objects before sending to Firestore.
 * Firestore strictly throws errors when fields are undefined.
 */
export function sanitizePayload<T>(obj: T): any {
  if (!obj) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

// ----------------------------------------------------------------------
// GALLERIES CLOUD SYNC
// ----------------------------------------------------------------------

export function subscribeToGalleries(
  onUpdate: (galleries: Gallery[]) => void,
  onError?: (err: any) => void
) {
  if (!db) {
    console.warn('Firestore not initialized, skipping live galleries subscription');
    return () => {};
  }

  const collRef = collection(db, 'galleries');
  const unsubscribe = onSnapshot(
    collRef,
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          // Check whether galleries were already initialized/wiped so deleting the last gallery
          // actually keeps Firestore empty and freed instead of re-seeding demo galleries.
          const siteSnap = await getDoc(doc(db, 'siteConfig', 'main')).catch(() => null);
          const alreadyInitialized = Boolean(siteSnap?.exists() && siteSnap.data()?.galleriesInitialized);

          if (alreadyInitialized) {
            try {
              localStorage.setItem('lente_abierto_galleries_v2', JSON.stringify([]));
            } catch {}
            onUpdate([]);
            return;
          }

          console.log('Seeding initial galleries into Firestore...');
          for (const g of INITIAL_GALLERIES) {
            await setDoc(doc(db, 'galleries', g.id), sanitizePayload(g));
          }
          await setDoc(
            doc(db, 'siteConfig', 'main'),
            { galleriesInitialized: true },
            { merge: true }
          ).catch(() => {});
          onUpdate(INITIAL_GALLERIES);
          return;
        }

        const galleries: Gallery[] = [];
        snapshot.forEach((docSnap) => {
          galleries.push(docSnap.data() as Gallery);
        });

        // Sort by creation date descending
        galleries.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        // Cache locally for offline availability
        try {
          localStorage.setItem('lente_abierto_galleries_v2', JSON.stringify(galleries));
        } catch {}

        onUpdate(galleries);
      } catch (err) {
        console.error('Error processing galleries snapshot:', err);
        if (onError) onError(err);
      }
    },
    (error) => {
      console.warn('Firestore subscription error (falling back to local):', error);
      handleFirestoreError(error, OperationType.LIST, 'galleries');
    }
  );

  return unsubscribe;
}

export async function saveGalleryToCloud(gallery: Gallery): Promise<void> {
  if (!db) return;
  const path = `galleries/${gallery.id}`;
  try {
    const payload = sanitizePayload({
      ...gallery,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'galleries', gallery.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteGalleryFromCloud(galleryId: string): Promise<void> {
  if (!db) return;
  const path = `galleries/${galleryId}`;
  try {
    await deleteDoc(doc(db, 'galleries', galleryId));
    // Ensure galleriesInitialized stays true so deleting the last gallery won't auto-reseed demos
    await setDoc(
      doc(db, 'siteConfig', 'main'),
      { galleriesInitialized: true },
      { merge: true }
    ).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function incrementGalleryViewsInCloud(galleryId: string): Promise<void> {
  if (!db || !galleryId) return;
  try {
    await updateDoc(doc(db, 'galleries', galleryId), {
      viewsCount: increment(1),
    });
  } catch (err) {
    console.warn('Error incrementing gallery views in cloud:', err);
  }
}

// ----------------------------------------------------------------------
// SITE CONFIG (CMS) CLOUD SYNC
// ----------------------------------------------------------------------

export function subscribeToSiteContent(
  onUpdate: (content: SiteContentConfig) => void
) {
  if (!db) return () => {};

  const docRef = doc(db, 'siteConfig', 'main');
  return onSnapshot(
    docRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          const initial = sanitizePayload({ ...DEFAULT_SITE_CONTENT, id: 'main' });
          await setDoc(docRef, initial);
        } catch (e) {
          console.warn('Error auto-seeding siteConfig:', e);
        }
        onUpdate(DEFAULT_SITE_CONTENT);
        return;
      }
      const rawData = docSnap.data() as SiteContentConfig;
      const data: SiteContentConfig = {
        ...DEFAULT_SITE_CONTENT,
        ...rawData,
        appearance: { ...DEFAULT_SITE_CONTENT.appearance!, ...(rawData.appearance || {}) },
        general: { ...DEFAULT_SITE_CONTENT.general!, ...(rawData.general || {}) },
        hero: { ...DEFAULT_SITE_CONTENT.hero, ...(rawData.hero || {}) },
        announcement: { ...DEFAULT_SITE_CONTENT.announcement, ...(rawData.announcement || {}) },
        biography: {
          ...DEFAULT_SITE_CONTENT.biography,
          ...(rawData.biography || {}),
          principles: Array.isArray(rawData.biography?.principles)
            ? rawData.biography.principles
            : DEFAULT_SITE_CONTENT.biography.principles,
          gear: Array.isArray(rawData.biography?.gear)
            ? rawData.biography.gear
            : DEFAULT_SITE_CONTENT.biography.gear,
        },
        contact: {
          ...DEFAULT_SITE_CONTENT.contact,
          ...(rawData.contact || {}),
          pricingPackages: Array.isArray(rawData.contact?.pricingPackages)
            ? rawData.contact.pricingPackages
            : DEFAULT_SITE_CONTENT.contact.pricingPackages,
        },
      };
      // Sync local cache so other tabs/reloads on this device stay in sync
      try {
        localStorage.setItem('lente_abierto_site_content_v2', JSON.stringify(data));
      } catch {}
      onUpdate(data);
    },
    (err) => {
      console.warn('Site config sync error:', err);
    }
  );
}

export async function saveSiteContentToCloud(content: SiteContentConfig): Promise<void> {
  if (!db) return;
  const path = 'siteConfig/main';
  try {
    const payload = sanitizePayload({
      ...content,
      id: 'main',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'siteConfig', 'main'), payload);
    try {
      localStorage.setItem('lente_abierto_site_content_v2', JSON.stringify(content));
    } catch {}
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------------------------
// DOWNLOAD LOGS & FAVORITES AUDIT CLOUD LOGS
// ----------------------------------------------------------------------

export async function saveDownloadLogToCloud(log: DownloadLog): Promise<void> {
  if (!db) return;
  const path = `downloadLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'downloadLogs', log.id), sanitizePayload(log));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchDownloadLogsFromCloud(): Promise<DownloadLog[]> {
  if (!db) return [];
  const path = 'downloadLogs';
  try {
    const snap = await getDocs(collection(db, 'downloadLogs'));
    const logs: DownloadLog[] = [];
    snap.forEach((d) => logs.push(d.data() as DownloadLog));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function saveFavoriteLogToCloud(log: FavoriteLog): Promise<void> {
  if (!db) return;
  const path = `favoriteLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'favoriteLogs', log.id), sanitizePayload(log));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchFavoriteLogsFromCloud(): Promise<FavoriteLog[]> {
  if (!db) return [];
  const path = 'favoriteLogs';
  try {
    const snap = await getDocs(collection(db, 'favoriteLogs'));
    const logs: FavoriteLog[] = [];
    snap.forEach((d) => logs.push(d.data() as FavoriteLog));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function deleteFavoriteLogFromCloud(logId: string): Promise<void> {
  if (!db || !logId) return;
  try {
    await deleteDoc(doc(db, 'favoriteLogs', logId));
  } catch (err) {
    console.warn('Error deleting favorite log from cloud:', err);
  }
}

export function subscribeToFavoriteLogs(
  onUpdate: (logs: FavoriteLog[]) => void
) {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'favoriteLogs'),
    (snapshot) => {
      const logs: FavoriteLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as FavoriteLog);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      try {
        localStorage.setItem('lente_abierto_favorite_logs_v1', JSON.stringify(logs.slice(0, 1000)));
      } catch {}
      onUpdate(logs);
    },
    (err) => {
      console.warn('Favorite logs cloud sync error:', err);
    }
  );
}

export async function saveInquiryToCloud(inquiry: BookingInquiry): Promise<void> {
  if (!db) return;
  const path = `inquiries/${inquiry.id}`;
  try {
    await setDoc(doc(db, 'inquiries', inquiry.id), sanitizePayload(inquiry));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchInquiriesFromCloud(): Promise<BookingInquiry[]> {
  if (!db) return [];
  const path = 'inquiries';
  try {
    const snap = await getDocs(collection(db, 'inquiries'));
    const list: BookingInquiry[] = [];
    snap.forEach((d) => list.push(d.data() as BookingInquiry));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ----------------------------------------------------------------------
// USER PROFILES CLOUD SYNC
// ----------------------------------------------------------------------

export async function saveUserToCloud(user: UserProfile): Promise<void> {
  if (!db) return;
  const path = `users/${user.id}`;
  try {
    const payload = sanitizePayload({
      ...user,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', user.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  if (!db) return;
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncAllUsersToCloud(users: UserProfile[]): Promise<void> {
  if (!db || !users || users.length === 0) return;
  for (const u of users) {
    try {
      await saveUserToCloud(u);
    } catch (e) {
      console.warn(`Could not sync user ${u.id} to cloud:`, e);
    }
  }
}

function isLegacyVisibleAdminUser(u: Partial<UserProfile>): boolean {
  const uname = (u.name || '').trim().toLowerCase();
  const uemail = (u.email || '').trim().toLowerCase();
  const uid = (u.id || '').trim().toLowerCase();
  return (
    uname === 'admin' ||
    uname === 'admi' ||
    uemail === 'admin' ||
    uemail === 'admi' ||
    uemail.startsWith('admin@') ||
    uid === 'usr-admin' ||
    uid === 'admin' ||
    uid === 'admi'
  );
}

export function subscribeToUsers(
  onUpdate: (users: UserProfile[]) => void
) {
  if (!db) return () => {};

  const collRef = collection(db, 'users');
  return onSnapshot(
    collRef,
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          console.log('Seeding default photographer profile to Firestore...');
          const initialUser = sanitizePayload(DEFAULT_PHOTOGRAPHER_PROFILE);
          await setDoc(doc(db, 'users', initialUser.id), initialUser);
          onUpdate([DEFAULT_PHOTOGRAPHER_PROFILE]);
          return;
        }

        const users: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const userData = docSnap.data() as UserProfile;
          if (isLegacyVisibleAdminUser(userData)) {
            // Auto-purge legacy visible 'admin'/'admi' doc from Firestore
            deleteDoc(doc(db, 'users', docSnap.id)).catch(() => {});
            return;
          }
          users.push(userData);
        });

        try {
          localStorage.setItem('lente_abierto_users_v2', JSON.stringify(users));
        } catch {}

        onUpdate(users);
      } catch (err) {
        console.warn('Error in users snapshot processing:', err);
      }
    },
    (err) => {
      console.warn('Users cloud subscription error:', err);
    }
  );
}

// ----------------------------------------------------------------------
// SUPER ADMIN DATABASE STATS, WIPE & FACTORY RESET
// ----------------------------------------------------------------------

export interface DatabaseCollectionStat {
  collection: string;
  count: number;
  bytes: number;
}

export async function getDatabaseStatsFromCloud(): Promise<{
  collections: DatabaseCollectionStat[];
  totalDocs: number;
  totalBytes: number;
}> {
  if (!db) {
    return { collections: [], totalDocs: 0, totalBytes: 0 };
  }
  const names = ['galleries', 'users', 'siteConfig', 'inquiries', 'downloadLogs', 'favoriteLogs'];
  const collections: DatabaseCollectionStat[] = [];
  let totalDocs = 0;
  let totalBytes = 0;

  for (const name of names) {
    try {
      const snap = await getDocs(collection(db, name));
      let colBytes = 0;
      snap.forEach((d) => {
        const json = JSON.stringify(d.data());
        colBytes += new TextEncoder().encode(json).length;
      });
      collections.push({
        collection: name,
        count: snap.size,
        bytes: colBytes,
      });
      totalDocs += snap.size;
      totalBytes += colBytes;
    } catch (err) {
      console.warn(`Error reading stats for ${name}:`, err);
      collections.push({ collection: name, count: 0, bytes: 0 });
    }
  }

  return { collections, totalDocs, totalBytes };
}

async function clearCollectionDocs(collectionName: string): Promise<number> {
  if (!db) return 0;
  const snap = await getDocs(collection(db, collectionName));
  let deleted = 0;
  for (const d of snap.docs) {
    try {
      await deleteDoc(doc(db, collectionName, d.id));
      deleted++;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${d.id}`);
    }
  }
  return deleted;
}

export async function wipeAllDatabaseCollectionsFromCloud(): Promise<void> {
  if (!db) return;
  const targetCollections = ['galleries', 'inquiries', 'downloadLogs', 'favoriteLogs', 'users'];
  for (const col of targetCollections) {
    await clearCollectionDocs(col);
  }
  // Keep siteConfig/main initialized so empty galleries do NOT auto-reseed demos
  await setDoc(
    doc(db, 'siteConfig', 'main'),
    sanitizePayload({
      ...DEFAULT_SITE_CONTENT,
      id: 'main',
      galleriesInitialized: true,
      updatedAt: new Date().toISOString(),
    })
  );
  // Restore only the primary photographer profile in users so the app has a valid profile base
  await setDoc(
    doc(db, 'users', DEFAULT_PHOTOGRAPHER_PROFILE.id),
    sanitizePayload(DEFAULT_PHOTOGRAPHER_PROFILE)
  );
}

export async function factoryResetSiteInCloud(reseedDemoGalleries = false): Promise<void> {
  if (!db) return;
  const targetCollections = ['galleries', 'inquiries', 'downloadLogs', 'favoriteLogs', 'users'];
  for (const col of targetCollections) {
    await clearCollectionDocs(col);
  }

  const resetConfig = sanitizePayload({
    ...DEFAULT_SITE_CONTENT,
    id: 'main',
    galleriesInitialized: true,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(doc(db, 'siteConfig', 'main'), resetConfig);

  await setDoc(
    doc(db, 'users', DEFAULT_PHOTOGRAPHER_PROFILE.id),
    sanitizePayload(DEFAULT_PHOTOGRAPHER_PROFILE)
  );

  if (reseedDemoGalleries) {
    for (const g of INITIAL_GALLERIES) {
      await setDoc(doc(db, 'galleries', g.id), sanitizePayload(g));
    }
  }
}
