import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Gallery, SiteContentConfig, DownloadLog, FavoriteLog, BookingInquiry } from '../types';
import { INITIAL_GALLERIES, DEFAULT_SITE_CONTENT } from './storage';

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
          // Auto-seed initial galleries to Firestore on very first launch
          console.log('Seeding initial galleries into Firestore...');
          for (const g of INITIAL_GALLERIES) {
            await setDoc(doc(db, 'galleries', g.id), g);
          }
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
    await setDoc(doc(db, 'galleries', gallery.id), {
      ...gallery,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteGalleryFromCloud(galleryId: string): Promise<void> {
  if (!db) return;
  const path = `galleries/${galleryId}`;
  try {
    await deleteDoc(doc(db, 'galleries', galleryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
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
          await setDoc(docRef, { ...DEFAULT_SITE_CONTENT, id: 'main' });
        } catch {}
        onUpdate(DEFAULT_SITE_CONTENT);
        return;
      }
      const data = docSnap.data() as SiteContentConfig;
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
    await setDoc(doc(db, 'siteConfig', 'main'), {
      ...content,
      id: 'main',
      updatedAt: new Date().toISOString(),
    });
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
    await setDoc(doc(db, 'downloadLogs', log.id), log);
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
    await setDoc(doc(db, 'favoriteLogs', log.id), log);
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

export async function saveInquiryToCloud(inquiry: BookingInquiry): Promise<void> {
  if (!db) return;
  const path = `inquiries/${inquiry.id}`;
  try {
    await setDoc(doc(db, 'inquiries', inquiry.id), inquiry);
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

export async function saveUserToCloud(user: any): Promise<void> {
  if (!db) return;
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      updatedAt: new Date().toISOString(),
    });
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

export function subscribeToUsers(
  onUpdate: (users: any[]) => void
) {
  if (!db) return () => {};

  const collRef = collection(db, 'users');
  return onSnapshot(
    collRef,
    (snapshot) => {
      if (snapshot.empty) return;
      const users: any[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data());
      });
      onUpdate(users);
    },
    (err) => {
      console.warn('Users cloud subscription error:', err);
    }
  );
}

