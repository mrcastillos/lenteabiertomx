import { UserProfile } from '../types';
import { saveUserToCloud, deleteUserFromCloud } from './firestoreSync';
import { emitCloudStatus, formatFirestoreErrorReason } from './cloudFeedback';

const STORAGE_KEY_USERS = 'lente_abierto_users_v2';
const STORAGE_KEY_CURRENT_USER = 'lente_abierto_current_user_v3';
const LEGACY_STORAGE_KEY_CURRENT_USER = 'lente_abierto_current_user_v2';
const STORAGE_KEY_ADMIN_AUTH = 'lente_abierto_admin_session_v2';

const STORAGE_KEY_SUPER_ADMIN_AUTH = 'lente_abierto_super_admin_session_v1';
const LEGACY_STORAGE_KEY_ADMIN_CREDS = 'lente_abierto_admin_creds_v2';

// Purge legacy exposed admin credentials and legacy auto-logged v2 user sessions
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LEGACY_STORAGE_KEY_ADMIN_CREDS);
    localStorage.removeItem(LEGACY_STORAGE_KEY_CURRENT_USER);
  }
} catch {}

// Hidden Super Admin credentials (never listed in UI, backend users list, or Firestore)
const HIDDEN_SUPER_ADMIN_USER = 'admin';
const HIDDEN_SUPER_ADMIN_PASS = '#M@r.830903!';

export function isAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(status: boolean): void {
  try {
    if (status) {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      sessionStorage.removeItem(STORAGE_KEY_SUPER_ADMIN_AUTH);
    }
  } catch (e) {
    console.error('Error setting admin session', e);
  }
}

export function isSuperAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY_SUPER_ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setSuperAdminLoggedIn(status: boolean): void {
  try {
    if (status) {
      sessionStorage.setItem(STORAGE_KEY_SUPER_ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SUPER_ADMIN_AUTH);
    }
  } catch (e) {
    console.error('Error setting super admin session', e);
  }
}

export function authenticateHiddenSuperAdmin(user: string, pass: string): boolean {
  return user.trim().toLowerCase() === HIDDEN_SUPER_ADMIN_USER && pass.trim() === HIDDEN_SUPER_ADMIN_PASS;
}

export function authenticateUserForBackend(
  user: string,
  pass: string
): { success: boolean; user?: UserProfile; isSuperAdmin?: boolean; message?: string } {
  const cleanUser = user.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Check Hidden Super Administrator (never listed in backend or frontend)
  if (authenticateHiddenSuperAdmin(user, pass)) {
    return { success: true, isSuperAdmin: true };
  }

  // 2. Check registered team/photographer users in getStoredUsers()
  const users = getStoredUsers();
  const matched = users.find((u) => {
    if (u.role === 'cliente') return false;
    const emailMatch = u.email && u.email.trim().toLowerCase() === cleanUser;
    const nameMatch = u.name && u.name.trim().toLowerCase() === cleanUser;
    const prefixMatch =
      u.email && u.email.split('@')[0].trim().toLowerCase() === cleanUser;
    const idMatch = u.id && u.id.trim().toLowerCase() === cleanUser;
    return emailMatch || nameMatch || prefixMatch || idMatch;
  });

  if (matched) {
    const userPass = (matched.password || '').trim();
    const userPin = (matched.pin || '').trim();

    const passwordMatches =
      (userPass && userPass === cleanPass) ||
      (userPin && userPin === cleanPass);

    if (passwordMatches) {
      return { success: true, user: matched, isSuperAdmin: false };
    }
  }

  return { success: false, message: 'Usuario o contraseña incorrectos.' };
}

export const DEFAULT_PHOTOGRAPHER_PROFILE: UserProfile = {
  id: 'usr-martin-castillo',
  name: 'Martín Castillo',
  email: 'casm830903@gmail.com',
  role: 'fotografo',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  phone: '+52 777 374 3420',
  whatsapp: '+527773743420',
  instagram: '@lente.abierto.mx',
  location: 'Ciudad de México, Morelos & Oaxaca, México',
  website: 'https://instagram.com/lente.abierto.mx',
  bio: 'Director y fotógrafo principal en Lente Abierto MX. Especializado en bodas de destino, retratos editoriales y arquitectura en luz natural.',
  detailedBio: `Fundador y director creativo de Lente Abierto MX. Con más de 12 años de trayectoria profesional documentando bodas de destino, retratos de alta costura y arquitectura contemporánea en todo México e Iberoamérica.

Su filosofía visual se aleja de las poses rígidas para buscar la emoción genuina, el claroscuro orgánico y la riqueza textural de la arquitectura mexicana (desde la cantera verde oaxaqueña hasta el minimalismo cálido de Barragán y las haciendas coloniales del Bajío).

Ha sido galardonado en certámenes internacionales de fotografía documental y su trabajo editorial ha aparecido en publicaciones como Vogue México, Bodas & Tradición y Architectural Digest Latinoamérica. Su flujo de trabajo digital combina sensores de ultra alta resolución Full Frame de 61 MP, óptica prime de máxima apertura y calibración cromática precisa para entregas editoriales impecables a través de galerías privadas en línea.`,
  specialties: [
    'Bodas de Destino (Destination Weddings)',
    'Retratos Editoriales & Fine Art',
    'Arquitectura Contemporánea & Espacios',
    'Cobertura Documental de Alta Gama',
  ],
  equipmentList: [
    'Sony α7R V (61 Megapíxeles, Rango Dinámico Ampliado)',
    'Sony Cinema FX3 (Grabación Dual y Enfoque al Ojo)',
    'Sony FE 35mm F1.4 G Master',
    'Sony FE 50mm F1.2 G Master',
    'Sony FE 85mm F1.4 G Master',
    'Sony FE 70-200mm F2.8 GM OSS II',
    'Iluminación Profoto A10 & Modificadores OCF',
    'Calibración de color X-Rite i1 & Flujo Capture One Pro',
  ],
  assignedGalleries: ['gal-boda-oaxaca', 'gal-retratos-condesa', 'gal-arquitectura-barragan', 'gal-boda-san-miguel'],
  createdAt: '2023-01-15T00:00:00Z',
};

function filterOutHiddenAdmin(list: UserProfile[]): UserProfile[] {
  return list.filter((u) => {
    const uname = (u.name || '').trim().toLowerCase();
    const uemail = (u.email || '').trim().toLowerCase();
    const uid = (u.id || '').trim().toLowerCase();
    return (
      uname !== 'admin' &&
      uname !== 'admi' &&
      uemail !== 'admin' &&
      uemail !== 'admi' &&
      !uemail.startsWith('admin@') &&
      uid !== 'usr-admin' &&
      uid !== 'admin' &&
      uid !== 'admi'
    );
  });
}

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([DEFAULT_PHOTOGRAPHER_PROFILE]));
      return [DEFAULT_PHOTOGRAPHER_PROFILE];
    }
    const parsed = JSON.parse(raw);
    const cleaned = Array.isArray(parsed) ? filterOutHiddenAdmin(parsed) : [];
    return cleaned.length > 0 ? cleaned : [DEFAULT_PHOTOGRAPHER_PROFILE];
  } catch {
    return [DEFAULT_PHOTOGRAPHER_PROFILE];
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) {
      return null;
    }
    const current = JSON.parse(raw);
    if (!current || !current.id) {
      return null;
    }
    const users = getStoredUsers();
    const fresh = users.find(
      (u) => u.id === current.id || (u.email && current.email && u.email.toLowerCase() === current.email.toLowerCase())
    );
    return fresh || current;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Error saving current user', e);
  }
}

export function saveStoredUsers(users: UserProfile[]): void {
  try {
    const cleaned = filterOutHiddenAdmin(users);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Error saving users to storage', e);
  }
}

export function addUser(data: {
  name: string;
  email: string;
  role: UserProfile['role'];
  password?: string;
  pin?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  location?: string;
  bio?: string;
  detailedBio?: string;
  avatarUrl?: string;
  assignedGalleries?: string[];
}): UserProfile {
  const cleanNameLower = data.name.trim().toLowerCase();
  const cleanEmailLower = data.email.trim().toLowerCase();
  if (cleanNameLower === 'admin' || cleanNameLower === 'admi' || cleanEmailLower === 'admin' || cleanEmailLower.startsWith('admin@')) {
    throw new Error('Ese nombre de usuario está reservado por el sistema.');
  }

  const users = getStoredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmailLower);
  if (existing) {
    throw new Error('Ya existe un usuario registrado con este correo electrónico.');
  }

  const defaultAvatar =
    data.role === 'colaborador' || data.role === 'asistente' || data.role === 'editor'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

  const newUser: UserProfile = {
    id: `usr-${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim(),
    role: data.role,
    password: data.password || '',
    pin: data.pin || '',
    avatarUrl: data.avatarUrl || defaultAvatar,
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    instagram: data.instagram || '',
    location: data.location || 'México',
    bio: data.bio || (data.role === 'colaborador' ? 'Colaborador técnico en Lente Abierto MX' : 'Miembro de Lente Abierto MX'),
    detailedBio: data.detailedBio || '',
    assignedGalleries: data.assignedGalleries || [],
    createdAt: new Date().toISOString(),
  };

  const updated = [...users, newUser];
  saveStoredUsers(updated);
  saveUserToCloud(newUser)
    .then(() => {
      emitCloudStatus({
        type: 'success',
        title: 'Usuario guardado en Firestore',
        message: `El perfil de ${newUser.name} se sincronizó correctamente.`,
      });
    })
    .catch((err) => {
      emitCloudStatus({
        type: 'error',
        title: 'No se guardó el usuario en Firestore',
        message: formatFirestoreErrorReason(err),
      });
    });
  return newUser;
}

export function deleteUser(id: string): { success: boolean; message: string } {
  if (id === DEFAULT_PHOTOGRAPHER_PROFILE.id) {
    return {
      success: false,
      message: 'No es posible eliminar la cuenta principal del fotógrafo titular.',
    };
  }

  const users = getStoredUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) {
    return {
      success: false,
      message: 'Usuario no encontrado.',
    };
  }

  saveStoredUsers(filtered);
  deleteUserFromCloud(id)
    .then(() => {
      emitCloudStatus({
        type: 'success',
        title: 'Usuario eliminado en Firestore',
        message: 'El perfil se eliminó correctamente de la base de datos.',
      });
    })
    .catch((err) => {
      emitCloudStatus({
        type: 'error',
        title: 'No se pudo eliminar el usuario en Firestore',
        message: formatFirestoreErrorReason(err),
      });
    });

  // If deleting currently logged in user, logout
  const current = getCurrentUser();
  if (current?.id === id) {
    logoutUser();
  }

  return {
    success: true,
    message: 'Usuario eliminado exitosamente.',
  };
}

export function registerUser(data: {
  name: string;
  email: string;
  role: UserProfile['role'];
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  location?: string;
  bio?: string;
  detailedBio?: string;
}): UserProfile {
  return addUser({
    ...data,
  });
}

export function loginUser(emailOrUser: string, password?: string): UserProfile {
  const clean = emailOrUser.trim().toLowerCase();
  if (clean === 'admin' || clean === 'admi' || clean.startsWith('admin@')) {
    throw new Error('Acceso reservado.');
  }
  const users = getStoredUsers();
  const found = users.find((u) => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uName = (u.name || '').trim().toLowerCase();
    const uPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
    const uId = (u.id || '').trim().toLowerCase();
    return uEmail === clean || uName === clean || (uPrefix && uPrefix === clean) || uId === clean;
  });

  if (!found) {
    if (!clean.includes('@')) {
      throw new Error('Usuario no encontrado. Verifica el nombre de usuario o correo.');
    }
    // If email not found, create a client profile
    const client: UserProfile = {
      id: `usr-${Date.now()}`,
      name: emailOrUser.split('@')[0],
      email: emailOrUser.trim(),
      role: 'cliente',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80`,
      phone: '+52 55 1234 5678',
      whatsapp: '+525512345678',
      instagram: '',
      location: 'México',
      bio: 'Cliente de Lente Abierto MX',
      detailedBio: 'Cliente exclusivo con acceso a galerías y selección de fotografías.',
      assignedGalleries: [],
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([...users, client]));
    setCurrentUser(client);
    return client;
  }

  if (password !== undefined) {
    const storedPass = (found.password || '').trim();
    const storedPin = (found.pin || '').trim();
    const cleanPass = password.trim();
    if (storedPass && cleanPass !== storedPass && cleanPass !== storedPin) {
      throw new Error('Contraseña incorrecta.');
    }
  }

  setCurrentUser(found);
  return found;
}

export function updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('Usuario no encontrado');
  }

  const nextName = (updates.name || '').trim().toLowerCase();
  const nextEmail = (updates.email || '').trim().toLowerCase();
  if (nextName === 'admin' || nextName === 'admi' || nextEmail === 'admin' || nextEmail.startsWith('admin@')) {
    throw new Error('Ese nombre o correo está reservado por el sistema.');
  }

  const updated: UserProfile = { ...users[index], ...updates };
  users[index] = updated;
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

  // If this user is currently active or has matching email, update current session too
  const current = getCurrentUser();
  if (current && (current.id === id || (current.email && updated.email && current.email.toLowerCase() === updated.email.toLowerCase()))) {
    setCurrentUser(updated);
  }

  // Sync to Cloud Firestore
  saveUserToCloud(updated)
    .then(() => {
      emitCloudStatus({
        type: 'success',
        title: 'Perfil actualizado en Firestore',
        message: `Los cambios de ${updated.name} se guardaron en la nube.`,
      });
    })
    .catch((err) => {
      emitCloudStatus({
        type: 'error',
        title: 'No se guardaron los cambios del perfil en Firestore',
        message: formatFirestoreErrorReason(err),
      });
    });

  return updated;
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(LEGACY_STORAGE_KEY_CURRENT_USER);
  } catch (e) {
    console.error('Error logging out user', e);
  }
}

