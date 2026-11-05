import { UserProfile } from '../types';

const STORAGE_KEY_USERS = 'lente_abierto_users_v2';
const STORAGE_KEY_CURRENT_USER = 'lente_abierto_current_user_v2';
const STORAGE_KEY_ADMIN_AUTH = 'lente_abierto_admin_session_v2';

export interface AdminCredentials {
  username: string;
  password: string;
  email: string;
  name?: string;
  updatedAt?: string;
}

const STORAGE_KEY_ADMIN_CREDS = 'lente_abierto_admin_creds_v2';

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: 'admi',
  password: 'Mar.830903',
  email: 'casm830903@gmail.com',
  name: 'Martín Castillo (Administrador Principal)',
};

// Backwards-compatible export
export const ADMIN_CREDENTIALS = DEFAULT_ADMIN_CREDENTIALS;

export function getStoredAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_CREDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADMIN_CREDS, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
      return DEFAULT_ADMIN_CREDENTIALS;
    }
    const parsed = JSON.parse(raw);
    return {
      username: parsed.username || DEFAULT_ADMIN_CREDENTIALS.username,
      password: parsed.password || DEFAULT_ADMIN_CREDENTIALS.password,
      email: parsed.email || DEFAULT_ADMIN_CREDENTIALS.email,
      name: parsed.name || DEFAULT_ADMIN_CREDENTIALS.name,
      updatedAt: parsed.updatedAt,
    };
  } catch (e) {
    console.error('Error reading admin credentials from storage', e);
    return DEFAULT_ADMIN_CREDENTIALS;
  }
}

export function saveAdminCredentials(creds: AdminCredentials): void {
  try {
    localStorage.setItem(
      STORAGE_KEY_ADMIN_CREDS,
      JSON.stringify({ ...creds, updatedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.error('Error saving admin credentials', e);
  }
}

export function updateAdminCredentials(
  currentPassword: string,
  newUsername: string,
  newPassword: string,
  newEmail?: string
): { success: boolean; message: string } {
  const current = getStoredAdminCredentials();

  if (currentPassword !== current.password) {
    return {
      success: false,
      message: 'La contraseña actual ingresada es incorrecta. No se realizaron cambios.',
    };
  }

  const cleanUser = newUsername.trim();
  if (!cleanUser || cleanUser.length < 3) {
    return {
      success: false,
      message: 'El nuevo nombre de usuario debe tener al menos 3 caracteres.',
    };
  }

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      message: 'La nueva contraseña debe tener al menos 6 caracteres.',
    };
  }

  const updated: AdminCredentials = {
    username: cleanUser,
    password: newPassword,
    email: newEmail?.trim() || current.email,
    name: current.name,
    updatedAt: new Date().toISOString(),
  };

  saveAdminCredentials(updated);
  return {
    success: true,
    message: 'Credenciales maestras de administrador actualizadas con éxito.',
  };
}

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
    }
  } catch (e) {
    console.error('Error setting admin session', e);
  }
}

export function authenticateUserForBackend(
  user: string,
  pass: string
): { success: boolean; user?: UserProfile; message?: string } {
  const cleanUser = user.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Check Master Admin Credentials (admi / Mar.830903)
  const masterCreds = getStoredAdminCredentials();
  const isMasterUser =
    cleanUser === masterCreds.username.trim().toLowerCase() ||
    cleanUser === masterCreds.email.trim().toLowerCase();
  const isMasterPass = cleanPass === masterCreds.password.trim();

  if (isMasterUser && isMasterPass) {
    const currentPhotographer = getCurrentUser() || DEFAULT_PHOTOGRAPHER_PROFILE;
    return { success: true, user: currentPhotographer };
  }

  // 2. Check all registered users in getStoredUsers()
  const users = getStoredUsers();
  const matched = users.find((u) => {
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
      (userPin && userPin === cleanPass) ||
      (userPass && userPass.toLowerCase() === cleanPass.toLowerCase());

    if (passwordMatches) {
      return { success: true, user: matched };
    }
  }

  // 3. Fallback for demo / demo user: auto-provision if requested
  if (cleanUser === 'demo' && cleanPass === 'demo') {
    const existingDemo = users.find(
      (u) =>
        u.email.toLowerCase() === 'demo@lenteabierto.mx' ||
        u.name.toLowerCase() === 'demo' ||
        u.email.toLowerCase() === 'demo'
    );
    if (existingDemo) {
      return { success: true, user: existingDemo };
    } else {
      const demoUser = addUser({
        name: 'Usuario Demo',
        email: 'demo@lenteabierto.mx',
        role: 'colaborador',
        password: 'demo',
        phone: '+52 777 374 3420',
        location: 'México',
        bio: 'Cuenta de colaboración y acceso técnico',
      });
      return { success: true, user: demoUser };
    }
  }

  return { success: false, message: 'Usuario o contraseña incorrectos.' };
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  return authenticateUserForBackend(user, pass).success;
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

Ha sido galardonado en certámenes internacionales de fotografía documental y su trabajo editorial ha aparecido en publicaciones como Vogue México, Bodas & Tradición y Architectural Digest Latinoamérica. Su flujo de trabajo digital combina sensores de ultra alta resolución Full Frame de 61 MP, óptica prime de máxima apertura y calibración cromática precisa para entregas editoriales impecables a través de galerías privadas estilo Pixieset.`,
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

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([DEFAULT_PHOTOGRAPHER_PROFILE]));
      return [DEFAULT_PHOTOGRAPHER_PROFILE];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_PHOTOGRAPHER_PROFILE];
  } catch {
    return [DEFAULT_PHOTOGRAPHER_PROFILE];
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) {
      // Default to photographer logged in so the portfolio is immediately editable and functional!
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(DEFAULT_PHOTOGRAPHER_PROFILE));
      return DEFAULT_PHOTOGRAPHER_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PHOTOGRAPHER_PROFILE;
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
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
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
  const users = getStoredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
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

export function loginUser(email: string): UserProfile {
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!found) {
    // If not found and logging into demo, create a client profile
    const client: UserProfile = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email: email.trim(),
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

  setCurrentUser(found);
  return found;
}

export function updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('Usuario no encontrado');
  }

  const updated = { ...users[index], ...updates };
  users[index] = updated;
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

  return updated;
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } catch (e) {
    console.error('Error logging out user', e);
  }
}

