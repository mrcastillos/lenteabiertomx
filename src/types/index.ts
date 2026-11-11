export interface Photo {
  id: string;
  url: string; // High-resolution clean URL
  thumbnailUrl?: string;
  title: string;
  caption?: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
  };
  driveFileId?: string;
  dateAdded: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  subtext?: string;
  opacity: number; // 0.1 to 1.0
  style: 'diagonal-pattern' | 'center-stamp' | 'bottom-right';
}

export interface Gallery {
  id: string;
  title: string;
  slug: string;
  clientName?: string;
  clientEmail?: string;
  eventDate?: string;
  location?: string;
  category: string; // Dynamic categories editable by admin
  coverPhotoUrl: string;
  description: string;
  accessPin?: string; // PIN de apertura para entrar a la galería privada en el portal
  downloadPin?: string; // PIN para descargar fotos limpias o ZIP
  watermark: WatermarkConfig;
  photos: Photo[];
  isPrivate: boolean; // Si es privada, solo se abre mediante el Portal de Clientes con su PIN de apertura
  driveFolderId?: string;
  createdAt: string;
  viewsCount?: number;
}

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  postUrl: string;
  date?: string;
}

export interface BookingInquiry {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  serviceType: string;
  eventDate?: string;
  location?: string;
  budgetRange?: string;
  message: string;
  createdAt: string;
  status: 'nuevo' | 'contactado' | 'confirmado';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'fotografo' | 'cliente' | 'admin' | 'colaborador' | 'asistente' | 'editor';
  password?: string;
  pin?: string;
  avatarUrl?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  location?: string;
  bio?: string;
  detailedBio?: string;
  specialties?: string[];
  equipmentList?: string[];
  website?: string;
  assignedGalleries?: string[]; // Gallery IDs accessible by this client
  createdAt: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  mimeType: string;
  hasThumbnail?: boolean;
  thumbnailLink?: string;
}

export interface DriveApiImageItem {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  price: string;
  description: string;
}

export interface SitePrinciple {
  number: string;
  title: string;
  description: string;
}

export interface GearSection {
  title: string;
  items: string[];
}

export interface SiteContentConfig {
  general?: {
    pageTitle: string;
    pageDescription: string;
    brandName: string;
    brandTagline: string;
    faviconUrl?: string;
    logoIconUrl?: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    clientPortalCta: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    badgeText?: string;
  };
  biography: {
    photographerName: string;
    tagline: string;
    quote: string;
    portraitUrl: string;
    introParagraph: string;
    detailedBio: string;
    experienceYears: string;
    experienceSubtitle: string;
    locationText: string;
    badges: string[];
    principles: SitePrinciple[];
    gear: GearSection[];
    publications: string[];
  };
  contact: {
    title: string;
    subtitle: string;
    email: string;
    phone: string;
    whatsapp: string;
    locationTitle: string;
    locationDetails: string;
    coverageDetails: string;
    instagramHandle: string;
    pricingTitle: string;
    pricingNotice: string;
    pricingPackages: PricingPackage[];
  };
}

export interface DownloadLog {
  id: string;
  galleryId: string;
  galleryTitle: string;
  photoId?: string;
  photoTitle?: string;
  type: 'single' | 'zip';
  userName: string;
  userEmail: string;
  userPhone?: string;
  timestamp: string;
}

export interface FavoriteLog {
  id: string;
  galleryId: string;
  galleryTitle: string;
  photoId: string;
  photoTitle: string;
  photoUrl: string;
  photoThumbnailUrl?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  timestamp: string;
}


