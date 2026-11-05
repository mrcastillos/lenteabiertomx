import { Gallery, BookingInquiry, SiteContentConfig, InstagramPost, DownloadLog, FavoriteLog } from '../types';

const STORAGE_KEY_GALLERIES = 'lente_abierto_galleries_v2';
const STORAGE_KEY_INQUIRIES = 'lente_abierto_inquiries_v2';
const STORAGE_KEY_FAVORITES = 'lente_abierto_favorites_v2';
const STORAGE_KEY_DOWNLOAD_LOGS = 'lente_abierto_download_logs_v1';
const STORAGE_KEY_FAVORITE_LOGS = 'lente_abierto_favorite_logs_v1';
const STORAGE_KEY_CLIENT_SESSION = 'lente_abierto_client_session_v1';

export const INITIAL_GALLERIES: Gallery[] = [
  {
    id: 'gal-boda-oaxaca',
    title: 'Boda de Destino en Oaxaca: Sofía & Mateo',
    slug: 'sofia-y-mateo-oaxaca',
    clientName: 'Sofía & Mateo',
    clientEmail: 'sofia.mateo@gmail.com',
    eventDate: '24 de Octubre, 2025',
    location: 'Jardín Etnobotánico, Oaxaca de Juárez',
    category: 'Bodas',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85',
    description: 'Celebración íntima envuelta en la luz cálida oaxaqueña, cantera verde, textiles artesanales y una emoción pura e irrepetible.',
    accessPin: 'OAXACA2026',
    downloadPin: '2026',
    isPrivate: false,
    watermark: {
      enabled: true,
      text: 'LENTE ABIERTO MX',
      subtext: 'MUESTRA DE CLIENTE · PROHIBIDA REPRODUCCIÓN',
      opacity: 0.35,
      style: 'diagonal-pattern',
    },
    viewsCount: 428,
    createdAt: '2025-10-25T12:00:00Z',
    photos: [
      {
        id: 'p1-1',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        title: 'Primer Encuentro bajo el Laurel',
        caption: 'La emoción espontánea al verse por primera vez antes de la ceremonia civil.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 50mm F1.2 GM',
          aperture: 'f/1.4',
          shutterSpeed: '1/1250s',
          iso: 'ISO 100',
        },
        dateAdded: '2025-10-25T12:00:00Z',
      },
      {
        id: 'p1-2',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
        title: 'Votos Matrimoniales en Cantera',
        caption: 'Miradas cómplices durante el intercambio de votos al atardecer.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 85mm F1.4 GM',
          aperture: 'f/1.8',
          shutterSpeed: '1/800s',
          iso: 'ISO 200',
        },
        dateAdded: '2025-10-25T12:05:00Z',
      },
      {
        id: 'p1-3',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
        title: 'Detalles del Velo & Texturas',
        caption: 'Bordado artesanal y juego de sombras en el claustro colonial.',
        width: 1280,
        height: 1920,
        aspectRatio: 'portrait',
        exif: {
          camera: 'Sony α7 IV',
          lens: 'FE 90mm F2.8 Macro G OSS',
          aperture: 'f/2.8',
          shutterSpeed: '1/640s',
          iso: 'ISO 160',
        },
        dateAdded: '2025-10-25T12:10:00Z',
      },
      {
        id: 'p1-4',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
        title: 'El Brindis de Mezcal Artesanal',
        caption: 'Primer brindis con mezcal tobalá silvestre de Miahuatlán.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 35mm F1.4 GM',
          aperture: 'f/2.0',
          shutterSpeed: '1/400s',
          iso: 'ISO 400',
        },
        dateAdded: '2025-10-25T12:15:00Z',
      },
      {
        id: 'p1-5',
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
        title: 'Caminata Nupcial por las Calles de Santo Domingo',
        caption: 'Tradicional calenda nupcial con música de viento y marmotas.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 24-70mm F2.8 GM II',
          aperture: 'f/2.8',
          shutterSpeed: '1/1000s',
          iso: 'ISO 100',
        },
        dateAdded: '2025-10-25T12:20:00Z',
      },
      {
        id: 'p1-6',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
        title: 'Primer Baile bajo Velas y Candelabros',
        caption: 'Atmósfera íntima al compás de sones oaxaqueños.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony FX3',
          lens: 'FE 50mm F1.2 GM',
          aperture: 'f/1.2',
          shutterSpeed: '1/250s',
          iso: 'ISO 1250',
        },
        dateAdded: '2025-10-25T12:25:00Z',
      },
    ],
  },
  {
    id: 'gal-retratos-condesa',
    title: 'Retratos Editoriales & Sombras: Valeria León',
    slug: 'valeria-leon-editorial-condesa',
    clientName: 'Valeria León',
    eventDate: '15 de Enero, 2026',
    location: 'La Condesa & Roma Norte, CDMX',
    category: 'Retratos',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=85',
    description: 'Serie de retratos íntimos en luz natural y claroscuros, explorando la identidad y la arquitectura Art Déco de la capital mexicana.',
    downloadPin: '1234',
    isPrivate: false,
    watermark: {
      enabled: true,
      text: 'LENTE ABIERTO MX',
      subtext: 'PREVIA DIGITAL · LENTEABIERTO.MX',
      opacity: 0.3,
      style: 'center-stamp',
    },
    viewsCount: 312,
    createdAt: '2026-01-16T10:00:00Z',
    photos: [
      {
        id: 'p2-1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        title: 'Claroscuro en la Ventana',
        caption: 'Retrato con luz natural lateral a las 4:30 PM en departamento de la Condesa.',
        width: 1280,
        height: 1920,
        aspectRatio: 'portrait',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 85mm F1.4 GM',
          aperture: 'f/1.6',
          shutterSpeed: '1/500s',
          iso: 'ISO 100',
        },
        dateAdded: '2026-01-16T10:00:00Z',
      },
      {
        id: 'p2-2',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        title: 'Geometría Urbana en Parque México',
        caption: 'Juego de diagonales y vegetación tropical en el corazón de la Condesa.',
        width: 1280,
        height: 1920,
        aspectRatio: 'portrait',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 50mm F1.2 GM',
          aperture: 'f/2.0',
          shutterSpeed: '1/800s',
          iso: 'ISO 100',
        },
        dateAdded: '2026-01-16T10:05:00Z',
      },
      {
        id: 'p2-3',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        title: 'Perfil Editorial Blanco y Negro',
        caption: 'Contraste duro inspirado en el cine negro de los años 50.',
        width: 1280,
        height: 1920,
        aspectRatio: 'portrait',
        exif: {
          camera: 'Sony α7 IV',
          lens: 'FE 35mm F1.4 GM',
          aperture: 'f/1.4',
          shutterSpeed: '1/1600s',
          iso: 'ISO 50',
        },
        dateAdded: '2026-01-16T10:10:00Z',
      },
      {
        id: 'p2-4',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        title: 'Mirada en Movimiento',
        caption: 'Toma continua con ligero paneo que transmite la energía de la metrópoli.',
        width: 1280,
        height: 1920,
        aspectRatio: 'portrait',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 50mm F1.2 GM',
          aperture: 'f/1.8',
          shutterSpeed: '1/60s',
          iso: 'ISO 200',
        },
        dateAdded: '2026-01-16T10:15:00Z',
      },
    ],
  },
  {
    id: 'gal-arquitectura-barragan',
    title: 'Arquitectura Silenciosa: Ecos de Luis Barragán',
    slug: 'arquitectura-silenciosa-mexico',
    clientName: 'Studio Arquitectura Contemporánea',
    eventDate: '5 de Febrero, 2026',
    location: 'Pedregal de San Ángel & Cuadra San Cristóbal',
    category: 'Arquitectura',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1800&q=85',
    description: 'Estudio visual de planos, luz cenital, espejos de agua y los emblemáticos muros de rosa mexicano y terracota.',
    downloadPin: '7788',
    isPrivate: false,
    watermark: {
      enabled: true,
      text: 'LENTE ABIERTO MX',
      subtext: 'EDITORIAL ARQUITECTURA',
      opacity: 0.25,
      style: 'diagonal-pattern',
    },
    viewsCount: 560,
    createdAt: '2026-02-06T14:00:00Z',
    photos: [
      {
        id: 'p3-1',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        title: 'Geometría Rosa & Luz Cenital',
        caption: 'Muro portante reflejado en la alberca interior al mediodía.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 16-35mm F2.8 GM II',
          aperture: 'f/8.0',
          shutterSpeed: '1/200s',
          iso: 'ISO 100',
        },
        dateAdded: '2026-02-06T14:00:00Z',
      },
      {
        id: 'p3-2',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        title: 'Patio Central y Concreto Aparente',
        caption: 'Transición entre el interior y la naturaleza volcánica del Pedregal.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 24mm F1.4 GM',
          aperture: 'f/5.6',
          shutterSpeed: '1/320s',
          iso: 'ISO 100',
        },
        dateAdded: '2026-02-06T14:05:00Z',
      },
      {
        id: 'p3-3',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        title: 'Escalinata Flotante de Madera',
        caption: 'Diseño minimalista con remate visual hacia el jardín zen.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 35mm F1.4 GM',
          aperture: 'f/4.0',
          shutterSpeed: '1/160s',
          iso: 'ISO 200',
        },
        dateAdded: '2026-02-06T14:10:00Z',
      },
    ],
  },
  {
    id: 'gal-boda-san-miguel',
    title: 'Hacienda Sunset: Mariana & Rodrigo',
    slug: 'mariana-y-rodrigo-san-miguel',
    clientName: 'Mariana & Rodrigo',
    eventDate: '12 de Noviembre, 2025',
    location: 'Hacienda San José Lavista, San Miguel de Allende',
    category: 'Bodas',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1800&q=85',
    description: 'Viñedos dorados, arquitectura toscana mexicana y una fiesta bajo un cielo estrellado del Bajío.',
    downloadPin: '4321',
    isPrivate: false,
    watermark: {
      enabled: true,
      text: 'LENTE ABIERTO MX',
      subtext: 'GALERÍA PRIVADA',
      opacity: 0.35,
      style: 'diagonal-pattern',
    },
    viewsCount: 389,
    createdAt: '2025-11-14T09:00:00Z',
    photos: [
      {
        id: 'p4-1',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
        title: 'Golden Hour entre los Viñedos',
        caption: 'La luz dorada de las 6:00 PM iluminando el velo de novia en San Miguel.',
        width: 1280,
        height: 1920,
        aspectRatio: 'portrait',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 85mm F1.4 GM',
          aperture: 'f/1.4',
          shutterSpeed: '1/2000s',
          iso: 'ISO 100',
        },
        dateAdded: '2025-11-14T09:00:00Z',
      },
      {
        id: 'p4-2',
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        title: 'Montaje de Mesas con Flores Silvestres',
        caption: 'Diseño floral orgánico en tonos terracota, mostaza y verde olivo.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7 IV',
          lens: 'FE 35mm F1.4 GM',
          aperture: 'f/2.2',
          shutterSpeed: '1/500s',
          iso: 'ISO 125',
        },
        dateAdded: '2025-11-14T09:05:00Z',
      },
      {
        id: 'p4-3',
        url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1920&q=90',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=800&q=80',
        title: 'Risas durante los Discursos',
        caption: 'Lágrimas y carcajadas de los novios al escuchar a sus mejores amigos.',
        width: 1920,
        height: 1280,
        aspectRatio: 'landscape',
        exif: {
          camera: 'Sony α7R V',
          lens: 'FE 70-200mm F2.8 GM OSS II',
          aperture: 'f/2.8',
          shutterSpeed: '1/400s',
          iso: 'ISO 800',
        },
        dateAdded: '2025-11-14T09:10:00Z',
      },
    ],
  },
];

export function getStoredGalleries(): Gallery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GALLERIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GALLERIES, JSON.stringify(INITIAL_GALLERIES));
      return INITIAL_GALLERIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_GALLERIES;
  } catch (e) {
    console.error('Error reading galleries from storage', e);
    return INITIAL_GALLERIES;
  }
}

export function saveGalleries(galleries: Gallery[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_GALLERIES, JSON.stringify(galleries));
  } catch (e) {
    console.error('Error saving galleries', e);
  }
}

export function getStoredInquiries(): BookingInquiry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INQUIRIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveInquiry(inquiry: BookingInquiry): void {
  try {
    const current = getStoredInquiries();
    localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify([inquiry, ...current]));
  } catch (e) {
    console.error('Error saving inquiry', e);
  }
}

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(photoId: string): string[] {
  try {
    const favs = getFavorites();
    const updated = favs.includes(photoId)
      ? favs.filter((id) => id !== photoId)
      : [...favs, photoId];
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// DYNAMIC CATEGORY MANAGEMENT
// -------------------------------------------------------------
const STORAGE_KEY_CATEGORIES = 'lente_abierto_categories_v3';

export const DEFAULT_CATEGORIES: string[] = [
  'Bodas',
  'Retratos',
  'Editorial',
  'Arquitectura',
  'Eventos',
  'XV Años',
  'Maternidad & Familias',
];

export function getStoredCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories', e);
  }
}

export function addCategory(categoryName: string): string[] {
  const current = getStoredCategories();
  const trimmed = categoryName.trim();
  if (!trimmed || current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }
  const updated = [...current, trimmed];
  saveCategories(updated);
  return updated;
}

export function deleteCategory(categoryName: string): string[] {
  const current = getStoredCategories();
  const updated = current.filter((c) => c.toLowerCase() !== categoryName.toLowerCase());
  saveCategories(updated);
  return updated;
}

export function renameCategory(oldName: string, newName: string): string[] {
  const current = getStoredCategories();
  const updated = current.map((c) => (c.toLowerCase() === oldName.toLowerCase() ? newName.trim() : c));
  saveCategories(updated);
  return updated;
}

// -------------------------------------------------------------
// INSTAGRAM FEED (@lente.abierto.mx)
// -------------------------------------------------------------
export const DEFAULT_INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'ig-1',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    caption: 'Luz dorada en la cantera oaxaqueña. Sofía & Mateo caminando hacia el porvenir. Documental en 35mm f/1.4. #LenteAbiertoMX #BodasMexico #DestinationWedding',
    likes: 542,
    comments: 38,
    postUrl: 'https://instagram.com/lente.abierto.mx',
    date: 'Hace 2 días',
  },
  {
    id: 'ig-2',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    caption: 'Claroscuro en la Roma Norte. Sesión editorial con luz natural filtrada y tonalidades atemporales. #PortraitPhotography #Editorial #CDMX #LenteAbiertoMX',
    likes: 689,
    comments: 54,
    postUrl: 'https://instagram.com/lente.abierto.mx',
    date: 'Hace 4 días',
  },
  {
    id: 'ig-3',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    caption: 'El viento y el velo al atardecer en los viñedos de San Miguel de Allende. Momentos espontáneos que perduran. #SanMiguelDeAllende #FineArtWedding',
    likes: 612,
    comments: 37,
    postUrl: 'https://instagram.com/lente.abierto.mx',
    date: 'Hace 6 días',
  },
  {
    id: 'ig-4',
    imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    caption: 'El instante íntimo de los votos en la capilla de la hacienda. Cuando la técnica se vuelve invisible y solo vibra la emoción. @lente.abierto.mx',
    likes: 890,
    comments: 72,
    postUrl: 'https://instagram.com/lente.abierto.mx',
    date: 'Hace 1 semana',
  },
  {
    id: 'ig-5',
    imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80',
    caption: 'Detalles que componen una memoria: alianzas en oro blanco, votos en papel de algodón artesanal y flores silvestres mexicanas. #FineArtDetails',
    likes: 478,
    comments: 26,
    postUrl: 'https://instagram.com/lente.abierto.mx',
    date: 'Hace 1 semana',
  },
  {
    id: 'ig-6',
    imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
    caption: 'Calenda nupcial por las calles empedradas de Oaxaca al ritmo de banda. Pura alegría que contagia a toda una comunidad. #OaxacaMágica #LenteAbiertoMX',
    likes: 765,
    comments: 49,
    postUrl: 'https://instagram.com/lente.abierto.mx',
    date: 'Hace 2 semanas',
  },
];

const STORAGE_KEY_INSTAGRAM_POSTS = 'lente_abierto_ig_posts_v3';

export function getStoredInstagramPosts(): InstagramPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSTAGRAM_POSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INSTAGRAM_POSTS, JSON.stringify(DEFAULT_INSTAGRAM_POSTS));
      return DEFAULT_INSTAGRAM_POSTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INSTAGRAM_POSTS;
  } catch (e) {
    console.error('Error reading instagram posts from storage', e);
    return DEFAULT_INSTAGRAM_POSTS;
  }
}

export function saveInstagramPosts(posts: InstagramPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INSTAGRAM_POSTS, JSON.stringify(posts));
  } catch (e) {
    console.error('Error saving instagram posts to storage', e);
  }
}

export function resetInstagramPosts(): InstagramPost[] {
  try {
    localStorage.setItem(STORAGE_KEY_INSTAGRAM_POSTS, JSON.stringify(DEFAULT_INSTAGRAM_POSTS));
  } catch (e) {
    console.error('Error resetting instagram posts', e);
  }
  return DEFAULT_INSTAGRAM_POSTS;
}

// -------------------------------------------------------------
// SITE CONTENT CONFIGURATION (CMS EDITABLE FROM BACKEND)
// -------------------------------------------------------------
const STORAGE_KEY_SITE_CONTENT = 'lente_abierto_site_content_v1';

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  hero: {
    badge: 'Colecciones & Galerías Privadas',
    title: 'Historias Capturadas en Luz Natural',
    subtitle:
      'Explora los álbumes y entregas exclusivas de Lente Abierto MX. Entregas estilo Pixieset protegidas con marcas de agua, descargas en alta resolución y sincronización con Google Drive.',
    clientPortalCta: '¿Eres cliente? Accede a tu galería privada con tu PIN',
  },
  announcement: {
    enabled: true,
    badgeText: 'Agenda Abierta 2026 / 2027',
    text: 'Disponibilidad limitada para bodas de destino en Oaxaca, San Miguel de Allende y Riviera Maya.',
  },
  biography: {
    photographerName: 'Martín Castillo',
    tagline: 'Fundador & Director de Fotografía',
    quote: 'La luz mexicana no se imita: se contempla, se respeta y se preserva.',
    portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
    introParagraph:
      'Lente Abierto MX nació de una convicción inquebrantable: las imágenes más poderosas no surgen de poses impostadas ni de filtros efímeros, sino de la verdad silenciosa de los momentos irrepetibles.',
    detailedBio:
      'Con base en la Ciudad de México y presencia habitual en Oaxaca, San Miguel de Allende, Mérida y la Riviera Maya, he dedicado más de una década a documentar bodas de destino, retratos editoriales de alta costura y arquitectura contemporánea. Mi lenguaje visual bebe de la pintura novohispana, el claroscuro del cine de oro y las geometrías limpias del modernismo mexicano.',
    experienceYears: '12+ Años de Carrera',
    experienceSubtitle: 'Bodas de Destino & Retrato',
    locationText: 'CDMX & Destinos Internacionales',
    badges: ['Sony Alpha Artisan', 'Capture One Certified Professional', 'Miembro Fearless Photographers'],
    principles: [
      {
        number: '01',
        title: 'Luz Natural Soberana',
        description:
          'Priorizamos la luz ambiental de las horas doradas y los claroscuros arquitectónicos. Si empleamos iluminación artificial, es siempre sutil, simulando la suavidad de un ventanal o la intimidad de las velas.',
      },
      {
        number: '02',
        title: 'Emoción Espontánea',
        description:
          'No interrumpimos el curso natural de una ceremonia o festejo. Observamos desde una distancia respetuosa para captar miradas inadvertidas, lágrimas genuinas y risas sin libreto.',
      },
      {
        number: '03',
        title: 'Edición Atemporal',
        description:
          'Rechazamos modas cromáticas pasajeras o tonos artificiales. Nuestro revelado digital respeta los tonos de piel naturales y los colores vivos de las flores, las canteras y los cielos mexicanos para que tu álbum luzca vigente en 30 años.',
      },
    ],
    gear: [
      {
        title: 'Cuerpos de Cámara',
        items: ['Sony α7R V (61 MP)', 'Sony Cinema FX3 (Dual ISO)', 'Sistema de respaldo dual simultáneo'],
      },
      {
        title: 'Óptica Prime GM',
        items: ['FE 35mm F1.4 G Master', 'FE 50mm F1.2 G Master', 'FE 85mm F1.4 G Master', 'FE 70-200mm F2.8 GM II'],
      },
      {
        title: 'Iluminación & Modificadores',
        items: ['Profoto A10 AirX', 'Modificadores Octa OCF', 'Luz continua bi-color CRI 98+'],
      },
      {
        title: 'Entrega Pixieset & Resguardo',
        items: ['Galerías privadas con PIN de apertura', 'Descargas limpias individuales y en ZIP', 'Sincronización con Google Drive'],
      },
    ],
    publications: ['Vogue México', 'Bodas & Tradición', 'Architectural Digest', 'Fearless Photographers'],
  },
  contact: {
    title: 'Escribamos Juntos tu Próximo Capítulo',
    subtitle:
      'Aceptamos un número limitado de bodas y proyectos editoriales por temporada para brindar una atención personalizada y entregas impecables. Cuéntanos sobre tu fecha.',
    email: 'casm830903@gmail.com',
    phone: '+52 777 374 3420',
    whatsapp: '527773743420',
    locationTitle: 'Cuernavaca, Morelos / CDMX / Oaxaca',
    locationDetails: 'Base de Operaciones central con movilidad a toda la República.',
    coverageDetails:
      'Cobertura completa en todo México (San Miguel de Allende, Oaxaca de Juárez, Riviera Maya, Los Cabos, Valle de Bravo, Puebla) y bodas de destino internacionales.',
    instagramHandle: '@lente.abierto.mx',
    pricingTitle: 'Colecciones & Guía de Inversión',
    pricingNotice:
      'Todas las colecciones incluyen galería en línea Pixieset de alta resolución, descargas sin marcas de agua con PIN personalizado y resguardo digital en nube privada.',
    pricingPackages: [
      {
        id: 'pkg-1',
        name: 'Retrato Editorial & Sesión de Pareja',
        price: 'Desde $8,500 MXN',
        description: 'Sesión de 2 horas en locación, 35 fotos seleccionadas con retoque de piel de alta gama y galería online.',
      },
      {
        id: 'pkg-2',
        name: 'Boda Civil & Celebración Íntima',
        price: 'Desde $22,000 MXN',
        description: 'Hasta 5 horas de cobertura continua, 250+ imágenes entregadas en alta resolución con PIN de descarga.',
      },
      {
        id: 'pkg-3',
        name: 'Boda de Destino Completa (Full Day)',
        price: 'Desde $48,000 MXN',
        description: 'Cobertura ilimitada de 10 a 12 horas, dos fotógrafos, preboda de cortesía, galería Pixieset completa y descarga ZIP.',
      },
    ],
  },
};

export function getStoredSiteContent(): SiteContentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITE_CONTENT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SITE_CONTENT, JSON.stringify(DEFAULT_SITE_CONTENT));
      return DEFAULT_SITE_CONTENT;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...(parsed.hero || {}) },
      announcement: { ...DEFAULT_SITE_CONTENT.announcement, ...(parsed.announcement || {}) },
      biography: { ...DEFAULT_SITE_CONTENT.biography, ...(parsed.biography || {}) },
      contact: {
        ...DEFAULT_SITE_CONTENT.contact,
        ...(parsed.contact || {}),
        pricingPackages: Array.isArray(parsed.contact?.pricingPackages)
          ? parsed.contact.pricingPackages
          : DEFAULT_SITE_CONTENT.contact.pricingPackages,
      },
    };
  } catch (e) {
    console.error('Error reading site content from storage', e);
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveSiteContent(content: SiteContentConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SITE_CONTENT, JSON.stringify(content));
  } catch (e) {
    console.error('Error saving site content', e);
  }
}

export function resetSiteContent(): SiteContentConfig {
  try {
    localStorage.setItem(STORAGE_KEY_SITE_CONTENT, JSON.stringify(DEFAULT_SITE_CONTENT));
  } catch (e) {
    console.error('Error resetting site content', e);
  }
  return DEFAULT_SITE_CONTENT;
}

export function getStoredDownloadLogs(): DownloadLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOWNLOAD_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading download logs', e);
    return [];
  }
}

export function recordDownloadLog(
  logData: Omit<DownloadLog, 'id' | 'timestamp'>
): DownloadLog {
  const current = getStoredDownloadLogs();
  const newLog: DownloadLog = {
    ...logData,
    id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [newLog, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_DOWNLOAD_LOGS, JSON.stringify(updated.slice(0, 500)));
  } catch (e) {
    console.error('Error saving download log', e);
  }
  return newLog;
}

export function clearDownloadLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DOWNLOAD_LOGS);
  } catch (e) {
    console.error('Error clearing download logs', e);
  }
}

export function getClientSessionInfo(): { name: string; email: string; phone?: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CLIENT_SESSION) || localStorage.getItem(STORAGE_KEY_CLIENT_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setClientSessionInfo(info: { name: string; email: string; phone?: string }): void {
  try {
    const json = JSON.stringify(info);
    sessionStorage.setItem(STORAGE_KEY_CLIENT_SESSION, json);
    localStorage.setItem(STORAGE_KEY_CLIENT_SESSION, json);
  } catch (e) {
    console.error('Error saving client session info', e);
  }
}

export function getStoredFavoriteLogs(): FavoriteLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITE_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading favorite logs', e);
    return [];
  }
}

export function recordFavoriteLog(
  logData: Omit<FavoriteLog, 'id' | 'timestamp'>
): FavoriteLog {
  const current = getStoredFavoriteLogs();
  // Avoid duplicate favorite from same email and photoId
  const exists = current.find(
    (f) => f.photoId === logData.photoId && f.userEmail.toLowerCase() === logData.userEmail.toLowerCase()
  );
  if (exists) return exists;

  const newLog: FavoriteLog = {
    ...logData,
    id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [newLog, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITE_LOGS, JSON.stringify(updated.slice(0, 1000)));
  } catch (e) {
    console.error('Error saving favorite log', e);
  }
  return newLog;
}

export function removeFavoriteLog(photoId: string, userEmail?: string): void {
  try {
    const current = getStoredFavoriteLogs();
    const updated = userEmail
      ? current.filter((f) => !(f.photoId === photoId && f.userEmail.toLowerCase() === userEmail.toLowerCase()))
      : current.filter((f) => f.photoId !== photoId);
    localStorage.setItem(STORAGE_KEY_FAVORITE_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error removing favorite log', e);
  }
}

export function clearFavoriteLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FAVORITE_LOGS);
  } catch (e) {
    console.error('Error clearing favorite logs', e);
  }
}



