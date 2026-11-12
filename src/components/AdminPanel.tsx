import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  RefreshCw,
  FolderSync,
  Lock,
  Trash2,
  Edit2,
  Eye,
  Check,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  KeyRound,
  Shield,
  Sparkles,
  Inbox,
  Calendar,
  Phone,
  Mail,
  Tag,
  Copy,
  HelpCircle,
  ExternalLink,
  Users,
  ShieldCheck,
  Globe,
  Share2,
  FileText,
  DollarSign,
  BookOpen,
  UserCheck,
  Bell,
  Instagram,
  UserPlus,
  EyeOff,
  Upload,
  Search,
  Download,
  Heart,
} from 'lucide-react';
import {
  Gallery,
  Photo,
  WatermarkConfig,
  BookingInquiry,
  DriveFolderItem,
  SiteContentConfig,
  PricingPackage,
  UserProfile,
  InstagramPost,
  DownloadLog,
  FavoriteLog,
} from '../types';
import {
  fetchPhotosFromScriptApi,
  extractFolderId,
  APPS_SCRIPT_DRIVE_API_URL,
  listDriveFolders,
  createDriveFolder,
  listPhotosInDriveFolder,
} from '../services/googleDrive';
import {
  getStoredInquiries,
  getStoredCategories,
  addCategory,
  deleteCategory,
  renameCategory,
  getStoredSiteContent,
  saveSiteContent,
  resetSiteContent,
  getStoredInstagramPosts,
  saveInstagramPosts,
  resetInstagramPosts,
  getStoredDownloadLogs,
  clearDownloadLogs,
  getStoredFavoriteLogs,
  clearFavoriteLogs,
  removeFavoriteLog,
} from '../services/storage';
import {
  deleteGalleryFromCloud,
  saveGalleryToCloud,
  subscribeToUsers,
  syncAllUsersToCloud,
} from '../services/firestoreSync';
import { resizeImageToDataUrl } from '../utils/imageCompressor';
import {
  getStoredAdminCredentials,
  saveAdminCredentials,
  updateAdminCredentials,
  getStoredUsers,
  addUser,
  deleteUser,
  updateUserProfile,
  AdminCredentials,
  DEFAULT_PHOTOGRAPHER_PROFILE,
} from '../services/userService';
import { googleSignIn, getAccessToken } from '../services/firebase';

interface AdminPanelProps {
  galleries: Gallery[];
  onSaveGalleries: (galleries: Gallery[]) => void;
  onPreviewGallery: (gallery: Gallery) => void;
  onLockAdmin?: () => void;
  siteContent?: SiteContentConfig;
  onSaveSiteContent?: (content: SiteContentConfig) => Promise<void> | void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  galleries,
  onSaveGalleries,
  onPreviewGallery,
  onLockAdmin,
  siteContent,
  onSaveSiteContent,
}) => {
  const [activeTab, setActiveTab] = useState<
    'galleries' | 'portalConfig' | 'categories' | 'driveSync' | 'newGallery' | 'inquiries' | 'downloads' | 'favorites' | 'siteCms' | 'users'
  >('galleries');

  const [cmsContent, setCmsContent] = useState<SiteContentConfig>(siteContent || getStoredSiteContent());
  const [cmsSaveSuccess, setCmsSaveSuccess] = useState(false);
  const [isSavingCms, setIsSavingCms] = useState(false);
  const [cmsSaveError, setCmsSaveError] = useState<string | null>(null);
  const [isSyncingUsersCloud, setIsSyncingUsersCloud] = useState(false);
  const [usersSyncFeedback, setUsersSyncFeedback] = useState<string | null>(null);
  const [cmsSubTab, setCmsSubTab] = useState<'general' | 'bio' | 'hero' | 'contact' | 'pricing' | 'announcement' | 'instagram'>('general');

  // Download Logs State
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [downloadSearch, setDownloadSearch] = useState('');
  const [downloadFilterType, setDownloadFilterType] = useState<'todos' | 'zip' | 'single'>('todos');

  // Favorites Logs State
  const [favoriteLogs, setFavoriteLogs] = useState<FavoriteLog[]>([]);
  const [favoriteSearch, setFavoriteSearch] = useState('');
  const [selectedClientForFavs, setSelectedClientForFavs] = useState<string | null>(null);

  // Admin Credentials Management State
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>(getStoredAdminCredentials());
  const [adminUserForm, setAdminUserForm] = useState(adminCreds.username);
  const [adminEmailForm, setAdminEmailForm] = useState(adminCreds.email);
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [adminCredsFeedback, setAdminCredsFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  // Users & Collaborators State
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'todos' | 'colaborador' | 'fotografo' | 'asistente' | 'editor' | 'cliente'>('todos');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userFeedback, setUserFeedback] = useState<{ isError: boolean; message: string } | null>(null);
  const [newUserForm, setNewUserData] = useState<{
    name: string;
    email: string;
    role: UserProfile['role'];
    password: string;
    pin: string;
    phone: string;
    location: string;
    bio: string;
    assignedGalleries: string[];
    avatarUrl: string;
  }>({
    name: '',
    email: '',
    role: 'colaborador',
    password: '',
    pin: '',
    phone: '',
    location: 'México',
    bio: '',
    assignedGalleries: [],
    avatarUrl: '',
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserForm, setEditUserData] = useState<{
    name: string;
    email: string;
    role: UserProfile['role'];
    password: string;
    pin: string;
    phone: string;
    location: string;
    bio: string;
    assignedGalleries: string[];
    avatarUrl: string;
  }>({
    name: '',
    email: '',
    role: 'colaborador',
    password: '',
    pin: '',
    phone: '',
    location: '',
    bio: '',
    assignedGalleries: [],
    avatarUrl: '',
  });

  // Google Photos Album & Batch Importer State
  const [googlePhotosInput, setGooglePhotosInput] = useState('');
  const [googlePhotosAlbumTitle, setGooglePhotosAlbumTitle] = useState('');
  const [googlePhotosCategory, setGooglePhotosCategory] = useState('Bodas');
  const [googlePhotosLocation, setGooglePhotosLocation] = useState('México');
  const [googlePhotosPin, setGooglePhotosPin] = useState('2026');
  const [googlePhotosDownloadPin, setGooglePhotosDownloadPin] = useState('8309');
  const [googlePhotosFeedback, setGooglePhotosFeedback] = useState<{ isError: boolean; message: string } | null>(null);
  const [googlePhotosParsedList, setGooglePhotosParsedList] = useState<Photo[]>([]);

  // Instagram CMS State
  const [instagramPostsList, setInstagramPostsList] = useState<InstagramPost[]>(getStoredInstagramPosts());
  const [editingIgPost, setEditingIgPost] = useState<InstagramPost | null>(null);
  const [igFeedback, setIgFeedback] = useState<string | null>(null);
  const igImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserList(getStoredUsers());
    setAdminCreds(getStoredAdminCredentials());
    setDownloadLogs(getStoredDownloadLogs());
    setFavoriteLogs(getStoredFavoriteLogs());

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUserList(cloudUsers);
      }
    });

    return () => {
      unsubUsers();
    };
  }, []);

  useEffect(() => {
    if (siteContent) {
      setCmsContent(siteContent);
    }
  }, [siteContent]);

  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatOld, setEditingCatOld] = useState<string | null>(null);
  const [editingCatNew, setEditingCatNew] = useState('');
  const [copiedLinkForGallery, setCopiedLinkForGallery] = useState<string | null>(null);

  // Editing gallery state
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);

  // Form for new/editing gallery
  const [galleryForm, setGalleryForm] = useState<{
    title: string;
    clientName: string;
    clientEmail: string;
    eventDate: string;
    location: string;
    category: string;
    coverPhotoUrl: string;
    description: string;
    accessPin: string;
    downloadPin: string;
    isPrivate: boolean;
    watermarkEnabled: boolean;
    watermarkText: string;
    watermarkSubtext: string;
    watermarkOpacity: number;
    watermarkStyle: 'diagonal-pattern' | 'center-stamp' | 'bottom-right';
    photos: Photo[];
  }>({
    title: '',
    clientName: '',
    clientEmail: '',
    eventDate: '',
    location: '',
    category: 'Bodas',
    coverPhotoUrl: '',
    description: '',
    accessPin: '',
    downloadPin: '2026',
    isPrivate: false,
    watermarkEnabled: true,
    watermarkText: 'LENTE ABIERTO MX',
    watermarkSubtext: 'MUESTRA DE CLIENTE · COPIA NO AUTORIZADA',
    watermarkOpacity: 0.35,
    watermarkStyle: 'diagonal-pattern',
    photos: [],
  });

  // Google Drive Sync state
  const [driveFolderInput, setDriveFolderInput] = useState('root');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveSyncSuccess, setDriveSyncSuccess] = useState<string | null>(null);
  const [driveSyncError, setDriveSyncError] = useState<string | null>(null);
  const [previewedDrivePhotos, setPreviewedDrivePhotos] = useState<Photo[]>([]);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [googleDriveFolders, setGoogleDriveFolders] = useState<DriveFolderItem[]>([]);
  const [isFetchingDirectFolders, setIsFetchingDirectFolders] = useState(false);

  // Load inquiries and categories
  useEffect(() => {
    setInquiries(getStoredInquiries());
    setCategories(getStoredCategories());
  }, []);

  // Category management handlers
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    const updated = addCategory(newCatInput);
    setCategories(updated);
    setNewCatInput('');
  };

  const handleDeleteCategoryClick = (cat: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat}"?`)) {
      const updated = deleteCategory(cat);
      setCategories(updated);
    }
  };

  const handleRenameCategorySubmit = (oldName: string) => {
    if (!editingCatNew.trim()) return;
    const updated = renameCategory(oldName, editingCatNew);
    setCategories(updated);
    // Update any galleries that used this category
    const updatedGals = galleries.map((g) =>
      g.category === oldName ? { ...g, category: editingCatNew.trim() } : g
    );
    onSaveGalleries(updatedGals);
    setEditingCatOld(null);
    setEditingCatNew('');
  };

  // Quick helper to populate edit form
  const handleEditGallery = (g: Gallery) => {
    setEditingGalleryId(g.id);
    setGalleryForm({
      title: g.title,
      clientName: g.clientName || '',
      clientEmail: g.clientEmail || '',
      eventDate: g.eventDate || '',
      location: g.location || '',
      category: g.category || 'Bodas',
      coverPhotoUrl: g.coverPhotoUrl,
      description: g.description,
      accessPin: g.accessPin || '',
      downloadPin: g.downloadPin || '',
      isPrivate: g.isPrivate ?? false,
      watermarkEnabled: g.watermark.enabled,
      watermarkText: g.watermark.text,
      watermarkSubtext: g.watermark.subtext || '',
      watermarkOpacity: g.watermark.opacity,
      watermarkStyle: g.watermark.style,
      photos: [...g.photos],
    });
    setActiveTab('newGallery');
  };

  const handleDeleteGallery = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta galería de tu portafolio?')) {
      const updated = galleries.filter((g) => g.id !== id);
      onSaveGalleries(updated);
      deleteGalleryFromCloud(id).catch((err) => console.error('Cloud delete error:', err));
    }
  };

  const handleUpdateGalleryQuickPortal = (
    galleryId: string,
    field: 'accessPin' | 'downloadPin' | 'isPrivate' | 'clientName' | 'clientEmail',
    value: any
  ) => {
    const updated = galleries.map((g) => (g.id === galleryId ? { ...g, [field]: value } : g));
    onSaveGalleries(updated);
  };

  const handleCopyClientInvitation = (gallery: Gallery) => {
    const portalUrl = `${window.location.origin}`;
    const text = `Hola ${gallery.clientName || 'Cliente'}, tu galería fotográfica en Lente Abierto MX ya está lista.\n\nPuedes ingresar desde el Portal de Clientes con:\n🔑 PIN de Apertura: ${gallery.accessPin || gallery.downloadPin || 'Sin PIN'}\n📥 PIN de Descarga: ${gallery.downloadPin || 'Libre'}\n\nEnlace: ${portalUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedLinkForGallery(gallery.id);
    setTimeout(() => setCopiedLinkForGallery(null), 3500);
  };

  // Sync from user's Google Apps Script API endpoint
  const handleFetchDriveFromScript = async () => {
    setIsSyncingDrive(true);
    setDriveSyncError(null);
    setDriveSyncSuccess(null);

    try {
      const photos = await fetchPhotosFromScriptApi(driveFolderInput);
      if (photos.length === 0) {
        setDriveSyncError(
          'No se encontraron fotografías en esa carpeta de Google Drive. Asegúrate de que la carpeta contenga imágenes y los permisos sean accesibles.'
        );
      } else {
        setPreviewedDrivePhotos(photos);
        setDriveSyncSuccess(
          `¡Éxito! Se obtuvieron ${photos.length} imágenes de Google Drive listas para convertirse en galería.`
        );
      }
    } catch (err: any) {
      console.error('Drive Sync Error', err);
      setDriveSyncError(err.message || 'Error al conectar con la API de Google Drive.');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Convert fetched Drive photos into a live Gallery in 1-click
  const handleCreateGalleryFromDrivePhotos = () => {
    if (previewedDrivePhotos.length === 0) return;

    const cover = previewedDrivePhotos[0]?.url || '';
    const newGallery: Gallery = {
      id: `gal-drive-${Date.now()}`,
      title: `Colección Google Drive: ${driveFolderInput === 'root' ? 'Principal' : driveFolderInput}`,
      slug: `drive-${Date.now()}`,
      category: categories[0] || 'Bodas',
      clientName: 'Cliente Privado Drive',
      clientEmail: '',
      eventDate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
      location: 'México',
      coverPhotoUrl: cover,
      description: 'Galería sincronizada automáticamente desde Google Drive. Fotografías con entrega de alta resolución y protección con marca de agua.',
      accessPin: 'DRIVE2026',
      downloadPin: '2026',
      isPrivate: false,
      watermark: {
        enabled: true,
        text: 'LENTE ABIERTO MX',
        subtext: 'PREVIA DIGITAL · PROTEGIDO',
        opacity: 0.35,
        style: 'diagonal-pattern',
      },
      photos: previewedDrivePhotos,
      createdAt: new Date().toISOString(),
    };

    onSaveGalleries([newGallery, ...galleries]);
    setPreviewedDrivePhotos([]);
    setDriveSyncSuccess('¡Galería creada exitosamente con miniatura principal asignada!');
    setActiveTab('galleries');
  };

  // Google Photos parsing & gallery creation handlers
  const handleProcessGooglePhotos = () => {
    setGooglePhotosFeedback(null);
    if (!googlePhotosInput.trim()) {
      setGooglePhotosFeedback({
        isError: true,
        message: 'Por favor pega al menos un enlace de fotografía o álbum de Google Fotos.',
      });
      return;
    }

    const urlMatches = googlePhotosInput.match(/(https?:\/\/[^\s"'<>]+)/g) || [];
    if (urlMatches.length === 0) {
      setGooglePhotosFeedback({
        isError: true,
        message: 'No se encontraron enlaces válidos (deben comenzar con http:// o https://).',
      });
      return;
    }

    const cleanedUrls: string[] = [];
    let isAlbumLink = false;

    for (let u of urlMatches) {
      u = u.replace(/[),.;]+$/, '').trim();
      if (u.includes('photos.app.goo.gl') || (u.includes('photos.google.com') && u.includes('/share/'))) {
        isAlbumLink = true;
      }
      cleanedUrls.push(u);
    }

    const validImageUrls = cleanedUrls.filter(
      (u) => !u.includes('photos.app.goo.gl') && !u.includes('/share/')
    );

    if (validImageUrls.length > 0) {
      const generatedPhotos: Photo[] = validImageUrls.map((rawUrl, idx) => {
        let highResUrl = rawUrl;
        let thumbUrl = rawUrl;

        if (rawUrl.includes('googleusercontent.com') || rawUrl.includes('ggpht.com')) {
          const baseUrl = rawUrl.replace(/=[wsh0-9-]+$/i, '');
          highResUrl = `${baseUrl}=s2048`;
          thumbUrl = `${baseUrl}=s800`;
        }

        return {
          id: `gphoto-${Date.now()}-${idx}`,
          title: `Fotografía ${String(idx + 1).padStart(2, '0')}`,
          url: highResUrl,
          thumbnailUrl: thumbUrl,
          aspectRatio: 'landscape',
          dateAdded: new Date().toISOString(),
        };
      });

      setGooglePhotosParsedList(generatedPhotos);
      setGooglePhotosFeedback({
        isError: false,
        message: `¡Se procesaron ${generatedPhotos.length} fotografía(s) con éxito en alta resolución! Revisa la vista previa y haz clic en "Crear Colección".`,
      });
    } else if (isAlbumLink) {
      setGooglePhotosFeedback({
        isError: false,
        message: '🔗 Enlace de Álbum de Google Fotos recibido. Como Google protege los álbumes compartidos con sesión web privada, abre el álbum en tu navegador, haz clic derecho sobre las fotos ("Copiar dirección de la imagen") y pega esos enlaces aquí para crear la galería en alta resolución.',
      });
    } else {
      setGooglePhotosFeedback({
        isError: true,
        message: 'No se detectaron URLs de imágenes directas. Asegúrate de pegar los enlaces a las fotos.',
      });
    }
  };

  const handleCreateGalleryFromGooglePhotos = async () => {
    if (googlePhotosParsedList.length === 0) {
      setGooglePhotosFeedback({
        isError: true,
        message: 'Debes escanear y tener al menos una foto para crear la galería.',
      });
      return;
    }

    const title = googlePhotosAlbumTitle.trim() || 'Colección Google Fotos';
    const cover = googlePhotosParsedList[0]?.url || '';
    const newGallery: Gallery = {
      id: `gal-gphotos-${Date.now()}`,
      title,
      slug: `gphotos-${Date.now()}`,
      category: googlePhotosCategory || categories[0] || 'Bodas',
      clientName: 'Cliente Álbum Google Fotos',
      clientEmail: '',
      eventDate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
      location: googlePhotosLocation.trim() || 'México',
      coverPhotoUrl: cover,
      description: `Galería fotográfica importada desde Google Fotos. ${googlePhotosParsedList.length} capturas en alta definición para visualización y descarga.`,
      accessPin: googlePhotosPin.trim() || '2026',
      downloadPin: googlePhotosDownloadPin.trim() || '8309',
      isPrivate: false,
      watermark: {
        enabled: true,
        text: 'LENTE ABIERTO MX',
        subtext: 'PREVIA DIGITAL · PROTEGIDO',
        opacity: 0.35,
        style: 'diagonal-pattern',
      },
      photos: googlePhotosParsedList,
      createdAt: new Date().toISOString(),
    };

    const updatedGalleries = [newGallery, ...galleries];
    onSaveGalleries(updatedGalleries);

    try {
      await saveGalleryToCloud(newGallery);
    } catch (e) {
      console.warn('Could not save to Cloud Firestore immediately:', e);
    }

    setGooglePhotosFeedback({
      isError: false,
      message: `🎉 ¡Galería "${title}" creada con éxito con ${googlePhotosParsedList.length} fotos y sincronizada en la nube!`,
    });

    setGooglePhotosInput('');
    setGooglePhotosParsedList([]);
    setGooglePhotosAlbumTitle('');
    setActiveTab('galleries');
  };

  // Connect Google Account for direct Drive listing
  const handleConnectGoogleDriveDirect = async () => {
    setIsFetchingDirectFolders(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setDriveAccessToken(res.accessToken);
        const folders = await listDriveFolders(res.accessToken);
        setGoogleDriveFolders(folders);
      }
    } catch (err) {
      console.error('Google Drive Auth Error', err);
    } finally {
      setIsFetchingDirectFolders(false);
    }
  };

  // Save or Update custom gallery
  const handleSaveGalleryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.title) return;

    const cover =
      galleryForm.coverPhotoUrl ||
      galleryForm.photos[0]?.url ||
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85';

    const watermarkConfig: WatermarkConfig = {
      enabled: galleryForm.watermarkEnabled,
      text: galleryForm.watermarkText || 'LENTE ABIERTO MX',
      subtext: galleryForm.watermarkSubtext,
      opacity: galleryForm.watermarkOpacity,
      style: galleryForm.watermarkStyle,
    };

    if (editingGalleryId) {
      const updated = galleries.map((g) => {
        if (g.id === editingGalleryId) {
          return {
            ...g,
            title: galleryForm.title,
            clientName: galleryForm.clientName,
            clientEmail: galleryForm.clientEmail,
            eventDate: galleryForm.eventDate,
            location: galleryForm.location,
            category: galleryForm.category,
            coverPhotoUrl: cover,
            description: galleryForm.description,
            accessPin: galleryForm.accessPin,
            downloadPin: galleryForm.downloadPin,
            isPrivate: galleryForm.isPrivate,
            watermark: watermarkConfig,
            photos: galleryForm.photos,
          };
        }
        return g;
      });
      onSaveGalleries(updated);
    } else {
      const newGal: Gallery = {
        id: `gal-${Date.now()}`,
        title: galleryForm.title,
        slug: galleryForm.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        clientName: galleryForm.clientName,
        clientEmail: galleryForm.clientEmail,
        eventDate: galleryForm.eventDate,
        location: galleryForm.location,
        category: galleryForm.category || categories[0] || 'Bodas',
        coverPhotoUrl: cover,
        description: galleryForm.description,
        accessPin: galleryForm.accessPin,
        downloadPin: galleryForm.downloadPin,
        watermark: watermarkConfig,
        photos: galleryForm.photos,
        isPrivate: galleryForm.isPrivate,
        createdAt: new Date().toISOString(),
      };
      onSaveGalleries([newGal, ...galleries]);
    }

    setEditingGalleryId(null);
    setActiveTab('galleries');
  };

  // Add photo to form
  const handleAddPhotoToForm = () => {
    const url = prompt(
      'Ingresa la URL de la imagen en alta resolución:',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1920&q=90'
    );
    if (!url) return;

    const newPhoto: Photo = {
      id: `p-${Date.now()}`,
      url: url.trim(),
      thumbnailUrl: url.trim(),
      title: `Fotografía #${galleryForm.photos.length + 1}`,
      caption: 'Toma en luz natural',
      aspectRatio: 'landscape',
      dateAdded: new Date().toISOString(),
      exif: undefined,
    };

    setGalleryForm((prev) => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
      coverPhotoUrl: prev.coverPhotoUrl || url.trim(),
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 text-zinc-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-white/5 mb-8">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-amber-400 text-xs uppercase tracking-widest font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Panel de Administración · Pixieset Core</span>
            </span>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
              Autenticado como: {adminCreds.username}
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-white font-normal">
            Gestión de Galerías, Portal de Clientes & Google Drive
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Crea colecciones, asigna PIN de apertura para clientes y PIN de descarga, edita categorías y sincroniza con tu unidad de Google Drive.
          </p>
        </div>

        {onLockAdmin && (
          <button
            onClick={onLockAdmin}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/30 text-xs tracking-wider uppercase transition-colors"
            title="Bloquear backend y salir del modo administrador"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear Backend</span>
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-[#141518] p-1.5 rounded-2xl border border-white/5 text-xs uppercase font-mono tracking-wider mb-8">
        <button
          onClick={() => {
            setActiveTab('galleries');
            setEditingGalleryId(null);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'galleries' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Colecciones ({galleries.length})
        </button>

        <button
          onClick={() => setActiveTab('portalConfig')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'portalConfig' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Portal Clientes & PINs</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'categories' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Categorías ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('driveSync')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'driveSync' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FolderSync className="w-3.5 h-3.5" />
          <span>Google Drive</span>
        </button>

        <button
          onClick={() => {
            setEditingGalleryId(null);
            setGalleryForm({
              title: '',
              clientName: '',
              clientEmail: '',
              eventDate: '',
              location: '',
              category: categories[0] || 'Bodas',
              coverPhotoUrl: '',
              description: '',
              accessPin: '',
              downloadPin: '2026',
              isPrivate: false,
              watermarkEnabled: true,
              watermarkText: 'LENTE ABIERTO MX',
              watermarkSubtext: 'MUESTRA DE CLIENTE · COPIA NO AUTORIZADA',
              watermarkOpacity: 0.35,
              watermarkStyle: 'diagonal-pattern',
              photos: [],
            });
            setActiveTab('newGallery');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'newGallery' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Crear Colección</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'inquiries' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Cotizaciones ({inquiries.length})</span>
        </button>

        <button
          onClick={() => {
            setDownloadLogs(getStoredDownloadLogs());
            setActiveTab('downloads');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'downloads'
              ? 'bg-amber-500 text-black font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Descargas ({downloadLogs.length})</span>
        </button>

        <button
          onClick={() => {
            setFavoriteLogs(getStoredFavoriteLogs());
            setActiveTab('favorites');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'favorites'
              ? 'bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Favoritos ({favoriteLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siteCms')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'siteCms'
              ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
              : 'text-amber-400/90 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Personalizar Sitio (CMS)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white bg-white/5 border border-white/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Usuarios & Seguridad ({userList.length})</span>
        </button>
      </div>

      {/* TAB 1: GALLERIES LIST */}
      {activeTab === 'galleries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <div>
              <h3 className="font-editorial text-2xl text-white">Colecciones & Galerías Registradas</h3>
              <p className="text-xs text-zinc-400">
                Cada tarjeta muestra la miniatura/ícono principal asignado a esa carpeta.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('portalConfig')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs uppercase tracking-wider border border-amber-500/30"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Configurar PINs de Clientes</span>
              </button>
              <button
                onClick={() => {
                  setEditingGalleryId(null);
                  setActiveTab('newGallery');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs uppercase tracking-wider border border-white/10"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Crear Colección</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                className="rounded-2xl bg-[#121316] border border-white/5 overflow-hidden flex flex-col justify-between shadow-xl group"
              >
                <div>
                  {/* Cover image & icon */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    <img
                      src={gallery.coverPhotoUrl}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121316] to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                        {gallery.category}
                      </span>
                      {gallery.isPrivate ? (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300">
                          Privada (Solo Portal)
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                          Pública
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                      <ImageIcon className="w-3 h-3 text-amber-400" />
                      <span>{gallery.photos.length} fotos</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="font-editorial text-xl text-white font-medium line-clamp-1">
                      {gallery.title}
                    </h4>

                    <div className="space-y-1.5 text-xs text-zinc-400">
                      {gallery.clientName && (
                        <p className="text-zinc-200 font-medium">Cliente: {gallery.clientName}</p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PIN Apertura (Portal):</span>
                        <span className="font-mono text-emerald-300 font-bold bg-emerald-500/10 px-1.5 rounded">
                          {gallery.accessPin || 'Sin PIN'}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>PIN Descarga (ZIP):</span>
                        <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-1.5 rounded">
                          {gallery.downloadPin || 'Libre'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="p-4 bg-black/30 border-t border-white/5 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onPreviewGallery(gallery)}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                    title="Ver como cliente"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyClientInvitation(gallery)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                      title="Copiar invitación y PIN para el cliente"
                    >
                      {copiedLinkForGallery === gallery.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditGallery(gallery)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                      title="Editar configuración y fotos"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGallery(gallery.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar galería"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT PORTAL & PIN CONFIGURATION */}
      {activeTab === 'portalConfig' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-editorial text-2xl text-white font-medium">
                  Configuración del Portal de Clientes & Claves de Acceso
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Asigna y gestiona aquí el <strong>PIN de Apertura</strong> (para desbloquear y visualizar la galería en el portal) y el <strong>PIN de Descarga</strong> (para bajar las fotos limpias o el ZIP).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-black/50 text-zinc-400 font-mono uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Galería / Colección</th>
                    <th className="py-3 px-4">Cliente Asignado</th>
                    <th className="py-3 px-4">PIN de Apertura (Portal)</th>
                    <th className="py-3 px-4">PIN de Descarga (ZIP)</th>
                    <th className="py-3 px-4">Privacidad</th>
                    <th className="py-3 px-4 text-right">Compartir con Cliente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {galleries.map((g) => (
                    <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img
                          src={g.coverPhotoUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-editorial text-base text-white">{g.title}</p>
                          <span className="text-[10px] font-mono text-zinc-500">{g.category} · {g.photos.length} fotos</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={g.clientName || ''}
                          onChange={(e) => handleUpdateGalleryQuickPortal(g.id, 'clientName', e.target.value)}
                          placeholder="Nombre del cliente"
                          className="bg-[#181a1f] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-36"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={g.accessPin || ''}
                          onChange={(e) => handleUpdateGalleryQuickPortal(g.id, 'accessPin', e.target.value)}
                          placeholder="Ej. OAXACA2026"
                          className="bg-[#181a1f] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono tracking-wider focus:outline-none focus:border-emerald-400 w-32"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={g.downloadPin || ''}
                          onChange={(e) => handleUpdateGalleryQuickPortal(g.id, 'downloadPin', e.target.value)}
                          placeholder="Ej. 2026"
                          className="bg-[#181a1f] border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono tracking-wider focus:outline-none focus:border-amber-400 w-28"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleUpdateGalleryQuickPortal(g.id, 'isPrivate', !g.isPrivate)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all ${
                            g.isPrivate
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {g.isPrivate ? 'Privada (Solo Portal)' : 'Pública (Portafolio)'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleCopyClientInvitation(g)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                          title="Copiar mensaje de invitación con PIN"
                        >
                          {copiedLinkForGallery === g.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar PIN</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC CATEGORY MANAGER */}
      {activeTab === 'categories' && (
        <div className="space-y-8">
          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-editorial text-2xl text-white font-medium">
                  Gestor de Categorías de Galerías
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Crea, renombra o elimina categorías para organizar tus colecciones y los filtros del portafolio.
                </p>
              </div>
            </div>

            {/* Add category form */}
            <form onSubmit={handleAddCategorySubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                required
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Nombre de nueva categoría (ej. XV Años, Maternidad, Boudoir...)"
                className="flex-1 bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Categoría</span>
              </button>
            </form>

            {/* Categories list */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Categorías Activas ({categories.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const usageCount = galleries.filter(
                    (g) => g.category.toLowerCase() === cat.toLowerCase()
                  ).length;
                  const isEditing = editingCatOld === cat;

                  return (
                    <div
                      key={cat}
                      className="p-4 rounded-xl bg-[#181a1f] border border-white/5 flex items-center justify-between gap-3"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingCatNew}
                            onChange={(e) => setEditingCatNew(e.target.value)}
                            className="bg-black/40 border border-amber-500 text-xs text-white px-2 py-1 rounded w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameCategorySubmit(cat)}
                            className="p-1 bg-amber-500 text-black rounded hover:bg-amber-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-editorial text-white font-medium">{cat}</p>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {usageCount} {usageCount === 1 ? 'galería' : 'galerías'}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatOld(cat);
                              setEditingCatNew(cat);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5"
                            title="Renombrar categoría"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoryClick(cat)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-red-500/10"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE DRIVE INTEGRATION & SYNC */}
      {activeTab === 'driveSync' && (
        <div className="space-y-10">
          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FolderSync className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-editorial text-2xl text-white font-medium">
                  Sincronización Automática con Google Drive
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Convierte cualquier carpeta de tu unidad de Google Drive en una galería profesional de Lente Abierto MX.
                </p>
              </div>
            </div>

            {/* API Endpoint Notice */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 space-y-1 font-mono">
              <span className="text-[10px] text-zinc-500 uppercase block tracking-wider font-sans">
                API de Integración Google Drive Configurada:
              </span>
              <p className="text-amber-400 truncate text-[11px]">{APPS_SCRIPT_DRIVE_API_URL}</p>
            </div>

            {/* Folder ID input & Fetch */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-mono">
                  ID de Carpeta o Enlace de Google Drive
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={driveFolderInput}
                    onChange={(e) => setDriveFolderInput(e.target.value)}
                    placeholder="Ej. root, ó 18Fi-iTjoSRHzOSj7l5AJ0J3O8pywImbY, ó enlace completo de carpeta"
                    className="flex-1 bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleFetchDriveFromScript}
                    disabled={isSyncingDrive}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDrive ? 'Sincronizando...' : 'Escanear Carpeta'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Puedes ingresar <span className="font-mono text-zinc-300">root</span> para la carpeta raíz de tu Apps Script, o pegar el ID específico de la carpeta de bodas/retratos de tu unidad.
                </p>
              </div>

              {driveSyncSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{driveSyncSuccess}</span>
                </div>
              )}

              {driveSyncError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{driveSyncError}</span>
                </div>
              )}
            </div>

            {/* Drive Photos Preview Grid */}
            {previewedDrivePhotos.length > 0 && (
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-editorial text-xl text-white">
                      Fotografías Encontradas ({previewedDrivePhotos.length})
                    </h4>
                    <p className="text-xs text-zinc-400">
                      La primera fotografía se utilizará automáticamente como miniatura / ícono principal de la galería.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateGalleryFromDrivePhotos}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Galería a Partir de esta Carpeta</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {previewedDrivePhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group aspect-square"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[9px] uppercase font-bold shadow">
                          Ícono Portada
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] text-white line-clamp-2">{photo.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Option: Google Workspace Direct Access */}
          <div className="p-8 rounded-3xl bg-[#121316]/60 border border-white/5 space-y-4">
            <h4 className="font-editorial text-xl text-white">
              Navegador Directo de Google Drive (OAuth)
            </h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              También puedes conectar directamente tu cuenta de Google Drive autorizada mediante OAuth para explorar tus carpetas o crear nuevas carpetas directamente.
            </p>

            <button
              onClick={handleConnectGoogleDriveDirect}
              disabled={isFetchingDirectFolders}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs tracking-wider uppercase text-zinc-200 transition-colors flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>
                {isFetchingDirectFolders
                  ? 'Conectando...'
                  : driveAccessToken
                  ? 'Actualizar Carpetas de Drive'
                  : 'Explorar Carpetas de mi Google Drive'}
              </span>
            </button>

            {googleDriveFolders.length > 0 && (
              <div className="pt-4 space-y-2">
                <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-500 block">
                  Carpetas Encontradas en tu Unidad:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {googleDriveFolders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setDriveFolderInput(f.id);
                        handleFetchDriveFromScript();
                      }}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/40 text-left transition-colors flex items-center gap-3"
                    >
                      <FolderSync className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-200 font-medium truncate">{f.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">ID: {f.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: GOOGLE FOTOS & ENLACES DE ÁLBUMES */}
          <div className="p-8 rounded-3xl bg-[#121316] border border-amber-500/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] uppercase font-mono tracking-widest mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Google Fotos Integration</span>
                </div>
                <h3 className="font-editorial text-2xl text-white font-medium">
                  Importar Álbum o Enlaces de Google Fotos
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Importa colecciones completas pegando enlaces de Google Fotos o de un álbum compartido sin tener que descargar archivos pesados.
                </p>
              </div>
            </div>

            {/* Instruction helper */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 space-y-2">
              <span className="font-mono text-amber-400 font-semibold uppercase text-[11px] block">
                💡 ¿Cómo importar desde Google Fotos?
              </span>
              <p className="leading-relaxed font-light text-zinc-300">
                1. <strong>Lote de enlaces directos (Recomendado):</strong> Abre tu álbum en Google Fotos, abre cualquier foto, haz clic derecho y selecciona <em>"Copiar dirección de la imagen"</em>. Pega una o más URLs aquí (una por línea). La plataforma detecta automáticamente enlaces de Google (<code className="text-amber-300 font-mono">googleusercontent.com</code>) y los optimiza en alta resolución (2048px) y miniaturas rápidas.
              </p>
              <p className="leading-relaxed font-light text-zinc-400">
                2. <strong>Enlace compartido:</strong> Si pegas un enlace de álbum (<code className="text-amber-300 font-mono">photos.app.goo.gl/...</code> o <code className="text-amber-300 font-mono">photos.google.com/share/...</code>), te guiaremos paso a paso para procesar las imágenes.
              </p>
            </div>

            {/* Input textarea */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-mono">
                  Pega aquí los Enlaces de Google Fotos o de tu Álbum:
                </label>
                <textarea
                  rows={4}
                  value={googlePhotosInput}
                  onChange={(e) => setGooglePhotosInput(e.target.value)}
                  placeholder="https://lh3.googleusercontent.com/pw/...&#10;https://lh3.googleusercontent.com/pw/...&#10;o https://photos.app.goo.gl/..."
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono resize-y"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleProcessGooglePhotos}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Escanear y Preparar Fotos</span>
                </button>

                {googlePhotosParsedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setGooglePhotosParsedList([]);
                      setGooglePhotosFeedback(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-mono uppercase"
                  >
                    Limpiar Lista
                  </button>
                )}
              </div>

              {googlePhotosFeedback && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                    googlePhotosFeedback.isError
                      ? 'bg-red-950/50 border border-red-500/40 text-red-200'
                      : 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  {googlePhotosFeedback.isError ? (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="leading-relaxed">{googlePhotosFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Parsed Photos Preview & Gallery Builder */}
            {googlePhotosParsedList.length > 0 && (
              <div className="pt-6 border-t border-white/5 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-editorial text-xl text-white font-medium">
                      Fotografías Listas para Publicar ({googlePhotosParsedList.length})
                    </h4>
                    <p className="text-xs text-zinc-400">
                      La primera fotografía se utilizará como miniatura/portada oficial de la colección.
                    </p>
                  </div>
                </div>

                {/* Gallery Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-black/40 border border-white/5 text-xs">
                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                      Título de la Colección *
                    </label>
                    <input
                      type="text"
                      value={googlePhotosAlbumTitle}
                      onChange={(e) => setGooglePhotosAlbumTitle(e.target.value)}
                      placeholder="Ej. Boda en Oaxaca: Sofía & Mateo"
                      className="w-full bg-[#181a1f] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                      Categoría
                    </label>
                    <select
                      value={googlePhotosCategory}
                      onChange={(e) => setGooglePhotosCategory(e.target.value)}
                      className="w-full bg-[#181a1f] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={googlePhotosLocation}
                      onChange={(e) => setGooglePhotosLocation(e.target.value)}
                      placeholder="Ej. Oaxaca / CDMX"
                      className="w-full bg-[#181a1f] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                      PIN de Descarga
                    </label>
                    <input
                      type="text"
                      value={googlePhotosDownloadPin}
                      onChange={(e) => setGooglePhotosDownloadPin(e.target.value)}
                      placeholder="8309"
                      className="w-full bg-[#181a1f] border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Photos Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {googlePhotosParsedList.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group aspect-square"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[9px] uppercase font-bold shadow">
                          Portada
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] text-white line-clamp-2">{photo.title}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 1-Click Publish Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCreateGalleryFromGooglePhotos}
                    className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-xl shadow-amber-500/25 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear y Publicar Colección en Lente Abierto MX</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CREATE / EDIT GALLERY FORM */}
      {activeTab === 'newGallery' && (
        <form onSubmit={handleSaveGalleryForm} className="space-y-8">
          {/* Tutorial / Help Banner */}
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-zinc-300 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-mono uppercase tracking-wider font-semibold">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>¿Cómo se crean y configuran las colecciones en Lente Abierto MX?</span>
            </div>
            <p className="text-zinc-300 leading-relaxed font-light">
              Tienes 2 formas sencillas:
            </p>
            <ol className="list-decimal pl-5 space-y-1 font-light text-zinc-400">
              <li><strong>Método Automático con Google Drive:</strong> En la pestaña <em>"Google Drive"</em>, pega el ID de tu carpeta. Se importarán todas las fotos y se tomará la primera imagen como ícono/miniatura automáticamente.</li>
              <li><strong>Método Manual:</strong> Rellena los datos aquí abajo, define el <strong>PIN de Apertura</strong> para que tu cliente la abra en su portal, y el <strong>PIN de Descarga</strong> para entregar los archivos en alta resolución limpios de marcas de agua.</li>
            </ol>
          </div>

          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="font-editorial text-2xl text-white font-medium">
                {editingGalleryId ? 'Editar Galería Fotográfica' : 'Crear Nueva Colección'}
              </h3>
              <span className="text-xs text-amber-400 font-mono">
                {editingGalleryId ? 'Modificando galería existente' : 'Paso a Paso'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                  Título de la Colección *
                </label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  placeholder="Ej. Boda en Oaxaca: Sofía & Mateo"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-zinc-400 uppercase tracking-wider text-[10px] font-mono">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="text-[10px] text-amber-400 hover:underline uppercase font-mono"
                  >
                    + Editar Categorías
                  </button>
                </div>
                <select
                  value={galleryForm.category}
                  onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                  Nombre de los Clientes
                </label>
                <input
                  type="text"
                  value={galleryForm.clientName}
                  onChange={(e) => setGalleryForm({ ...galleryForm, clientName: e.target.value })}
                  placeholder="Ej. Sofía & Mateo"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                  Correo del Cliente
                </label>
                <input
                  type="email"
                  value={galleryForm.clientEmail}
                  onChange={(e) => setGalleryForm({ ...galleryForm, clientEmail: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                  Fecha del Evento
                </label>
                <input
                  type="text"
                  value={galleryForm.eventDate}
                  onChange={(e) => setGalleryForm({ ...galleryForm, eventDate: e.target.value })}
                  placeholder="Ej. 24 de Octubre, 2025"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={galleryForm.location}
                  onChange={(e) => setGalleryForm({ ...galleryForm, location: e.target.value })}
                  placeholder="Ej. Jardín Etnobotánico, Oaxaca"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* PIN Settings Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-black/40 border border-white/5">
              <div>
                <label className="block text-emerald-400 uppercase tracking-wider text-[10px] mb-1 font-mono font-semibold">
                  PIN de Apertura (Portal de Clientes)
                </label>
                <input
                  type="text"
                  value={galleryForm.accessPin}
                  onChange={(e) => setGalleryForm({ ...galleryForm, accessPin: e.target.value })}
                  placeholder="Ej. OAXACA2026 (clave para abrir el álbum)"
                  className="w-full bg-[#181a1f] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-emerald-300 focus:outline-none focus:border-emerald-400 font-mono tracking-widest text-xs"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  El cliente escribe este PIN en la pestaña <em>"Portal Clientes"</em> para desbloquear su álbum privado.
                </span>
              </div>

              <div>
                <label className="block text-amber-400 uppercase tracking-wider text-[10px] mb-1 font-mono font-semibold">
                  PIN de Descarga (ZIP y Fotos Originales)
                </label>
                <input
                  type="text"
                  value={galleryForm.downloadPin}
                  onChange={(e) => setGalleryForm({ ...galleryForm, downloadPin: e.target.value })}
                  placeholder="Ej. 2026 (clave para descargar)"
                  className="w-full bg-[#181a1f] border border-amber-500/40 rounded-xl px-4 py-2.5 text-amber-300 focus:outline-none focus:border-amber-400 font-mono tracking-widest text-xs"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Clave solicitada antes de descargar las fotos de alta resolución sin marcas de agua.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
              <div>
                <p className="text-xs text-white font-medium">¿Galería Privada de Cliente?</p>
                <p className="text-[11px] text-zinc-400">
                  Si la marcas como privada, estará oculta del catálogo general y solo se abrirá desde el Portal de Clientes con su PIN de apertura.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={galleryForm.isPrivate}
                  onChange={(e) => setGalleryForm({ ...galleryForm, isPrivate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                Descripción Editorial
              </label>
              <textarea
                rows={3}
                value={galleryForm.description}
                onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                placeholder="Breve reseña sobre la luz, atmósfera o historia de esta sesión..."
                className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-light text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                URL de Miniatura Principal (Ícono Portada de la Galería)
              </label>
              <input
                type="text"
                value={galleryForm.coverPhotoUrl}
                onChange={(e) => setGalleryForm({ ...galleryForm, coverPhotoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Watermark Config Section */}
          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-editorial text-xl text-white">
                    Protección con Marca de Agua (Anticaptura)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Solo se muestra en pantalla. Al descargar con PIN se entrega la foto limpia original.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={galleryForm.watermarkEnabled}
                  onChange={(e) => setGalleryForm({ ...galleryForm, watermarkEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {galleryForm.watermarkEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-white/5">
                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Texto Principal de la Marca
                  </label>
                  <input
                    type="text"
                    value={galleryForm.watermarkText}
                    onChange={(e) => setGalleryForm({ ...galleryForm, watermarkText: e.target.value })}
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Subtexto Protector
                  </label>
                  <input
                    type="text"
                    value={galleryForm.watermarkSubtext}
                    onChange={(e) => setGalleryForm({ ...galleryForm, watermarkSubtext: e.target.value })}
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Opacidad: {Math.round(galleryForm.watermarkOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={galleryForm.watermarkOpacity}
                    onChange={(e) =>
                      setGalleryForm({ ...galleryForm, watermarkOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Photos inside this gallery */}
          <div className="p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h4 className="font-editorial text-xl text-white">
                  Fotografías en la Galería ({galleryForm.photos.length})
                </h4>
                <p className="text-xs text-zinc-400">
                  Haz clic en cualquier imagen para fijarla como la miniatura / ícono principal de la carpeta.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPhotoToForm}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase tracking-wider border border-white/10"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Agregar Foto por URL</span>
              </button>
            </div>

            {galleryForm.photos.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl p-6">
                <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">
                  Esta galería aún no tiene fotos. Agrégalas manualmente o sincronízalas desde la pestaña de Google Drive.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {galleryForm.photos.map((photo, idx) => {
                  const isCover = galleryForm.coverPhotoUrl === photo.url;
                  return (
                    <div
                      key={photo.id}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border group ${
                        isCover ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/10'
                      }`}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {isCover && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-black font-mono text-[9px] uppercase font-bold shadow">
                          Ícono Portada
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <button
                          type="button"
                          onClick={() => setGalleryForm({ ...galleryForm, coverPhotoUrl: photo.url })}
                          className="text-[10px] uppercase font-mono text-amber-300 hover:underline"
                        >
                          Usar de portada
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = galleryForm.photos.filter((_, i) => i !== idx);
                            setGalleryForm({ ...galleryForm, photos: filtered });
                          }}
                          className="text-[10px] uppercase font-mono text-red-400 hover:underline self-end"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('galleries');
                setEditingGalleryId(null);
              }}
              className="px-6 py-3 rounded-xl text-xs uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-widest uppercase transition-all shadow-lg shadow-amber-500/20"
            >
              {editingGalleryId ? 'Guardar Cambios de Galería' : 'Publicar Galería'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: CLIENT INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="font-editorial text-2xl text-white">Solicitudes de Cotización</h3>
              <p className="text-xs text-zinc-400">Clientes que han completado el formulario de contacto</p>
            </div>
            <span className="text-xs font-mono text-amber-400">{inquiries.length} Solicitudes</span>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <Inbox className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-editorial text-zinc-300">No hay nuevas cotizaciones</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Las solicitudes enviadas desde la página de Contacto aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-editorial font-medium text-white">{inq.clientName}</span>
                      <span className="text-xs text-amber-400/90 font-mono ml-3 bg-amber-500/10 px-2 py-0.5 rounded">
                        {inq.serviceType}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(inq.createdAt).toLocaleDateString('es-MX')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      {inq.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {inq.phone}
                    </span>
                    {inq.location && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {inq.location}
                      </span>
                    )}
                  </div>

                  {inq.message && (
                    <p className="text-xs text-zinc-400 font-light bg-black/30 p-3 rounded-xl border border-white/5">
                      "{inq.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DOWNLOADS & CLIENT REGISTRATION LOG */}
      {activeTab === 'downloads' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
                <Download className="w-4 h-4" />
                <span>Control de Entregas Digitales</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-white">
                Registro de Descargas de Clientes
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Monitorea qué clientes han descargado tus galerías, sus correos válidos, teléfonos y fecha exacta de entrega.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const headers = 'Fecha,Cliente,Email,Telefono,Galeria,Tipo,Archivo\n';
                  const rows = downloadLogs
                    .map((d) =>
                      `"${new Date(d.timestamp).toLocaleString('es-MX')}","${d.userName}","${d.userEmail}","${d.userPhone || ''}","${d.galleryTitle}","${d.type === 'zip' ? 'Colección ZIP' : 'Foto Individual'}","${d.photoTitle || ''}"`
                    )
                    .join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `LenteAbiertoMX_RegistroDescargas_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={downloadLogs.length === 0}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas vaciar el historial de descargas?')) {
                    clearDownloadLogs();
                    setDownloadLogs([]);
                  }
                }}
                disabled={downloadLogs.length === 0}
                className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 disabled:opacity-40 text-red-300 border border-red-500/20 text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                Total Descargas
              </span>
              <div className="text-3xl font-editorial text-white">{downloadLogs.length}</div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Registros capturados</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400/90 block mb-1">
                Colecciones ZIP
              </span>
              <div className="text-3xl font-editorial text-amber-300">
                {downloadLogs.filter((d) => d.type === 'zip').length}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Galerías completas</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 block mb-1">
                Fotos Individuales
              </span>
              <div className="text-3xl font-editorial text-cyan-300">
                {downloadLogs.filter((d) => d.type === 'single').length}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Descargas directas JPG</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 block mb-1">
                Clientes Únicos
              </span>
              <div className="text-3xl font-editorial text-emerald-300">
                {new Set(downloadLogs.map((d) => d.userEmail.toLowerCase())).size}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Emails verificados</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#141518] rounded-2xl border border-white/5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={downloadSearch}
                onChange={(e) => setDownloadSearch(e.target.value)}
                placeholder="Buscar por nombre, correo, teléfono o nombre de galería..."
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              {(['todos', 'zip', 'single'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDownloadFilterType(filter)}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                    downloadFilterType === filter
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {filter === 'todos' ? 'Todos' : filter === 'zip' ? 'Solo ZIP' : 'Solo Fotos'}
                </button>
              ))}
            </div>
          </div>

          {/* Table / List */}
          {downloadLogs.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <Download className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-editorial text-zinc-300">No hay descargas registradas aún</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                Cada vez que un cliente descargue una fotografía o la galería completa en ZIP, su nombre, correo válido y teléfono quedarán registrados aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="bg-[#121316] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181a1f] text-zinc-400 font-mono uppercase tracking-wider text-[11px] border-b border-white/5">
                    <tr>
                      <th className="py-3 px-4">Fecha & Hora</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Correo Electrónico</th>
                      <th className="py-3 px-4">Teléfono / WhatsApp</th>
                      <th className="py-3 px-4">Galería</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {downloadLogs
                      .filter((log) => {
                        if (downloadFilterType !== 'todos' && log.type !== downloadFilterType) {
                          return false;
                        }
                        if (!downloadSearch.trim()) return true;
                        const q = downloadSearch.toLowerCase();
                        return (
                          log.userName.toLowerCase().includes(q) ||
                          log.userEmail.toLowerCase().includes(q) ||
                          (log.userPhone && log.userPhone.includes(q)) ||
                          log.galleryTitle.toLowerCase().includes(q) ||
                          (log.photoTitle && log.photoTitle.toLowerCase().includes(q))
                        );
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
                            {new Date(log.timestamp).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                            <span className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                                {log.userName.charAt(0).toUpperCase()}
                              </span>
                              {log.userName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                            <a
                              href={`mailto:${log.userEmail}?subject=Entrega de Fotografías Lente Abierto MX - ${encodeURIComponent(log.galleryTitle)}`}
                              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                              title="Enviar correo"
                            >
                              <Mail className="w-3.5 h-3.5 text-zinc-500 hover:text-amber-400" />
                              <span>{log.userEmail}</span>
                            </a>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                            {log.userPhone ? (
                              <a
                                href={`https://wa.me/${log.userPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                                title="Abrir chat en WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{log.userPhone}</span>
                              </a>
                            ) : (
                              <span className="text-zinc-600 italic">No registrado</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300 font-medium">
                            {log.galleryTitle}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {log.type === 'zip' ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase tracking-wider">
                                Colección ZIP
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] uppercase tracking-wider">
                                Foto JPG
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-400 text-[11px] truncate max-w-[200px]">
                            {log.photoTitle || 'Colección Completa'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: CLIENT FAVORITES TRACKING (SELECCIÓN PARA ÁLBUM Y VENTA) */}
      {activeTab === 'favorites' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase tracking-widest mb-1">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                <span>Selección para Álbum Físico & Edición</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-white">
                Favoritos Seleccionados por Clientes
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Conoce exactamente qué fotografías eligieron tus clientes con el corazón ❤️ para maquilar su álbum impreso, retoque de piel o ventas adicionales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const headers = 'Fecha,Cliente,Email,Telefono,Galeria,FotoTitulo,FotoUrl\n';
                  const rows = favoriteLogs
                    .map((f) =>
                      `"${new Date(f.timestamp).toLocaleString('es-MX')}","${f.userName}","${f.userEmail}","${f.userPhone || ''}","${f.galleryTitle}","${f.photoTitle}","${f.photoUrl}"`
                    )
                    .join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `LenteAbiertoMX_SeleccionFavoritos_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={favoriteLogs.length === 0}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas vaciar el historial de favoritos?')) {
                    clearFavoriteLogs();
                    setFavoriteLogs([]);
                  }
                }}
                disabled={favoriteLogs.length === 0}
                className="px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 disabled:opacity-40 text-red-300 border border-red-500/20 text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                Total Fotos Favoritas
              </span>
              <div className="text-3xl font-editorial text-white">{favoriteLogs.length}</div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Marcadas con ❤️ por clientes</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 block mb-1">
                Clientes con Selección
              </span>
              <div className="text-3xl font-editorial text-rose-400">
                {new Set(favoriteLogs.map((f) => f.userEmail.toLowerCase())).size}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Listas listas para entrega</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141518] border border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
                Promedio por Cliente
              </span>
              <div className="text-3xl font-editorial text-amber-300">
                {favoriteLogs.length > 0 && new Set(favoriteLogs.map((f) => f.userEmail.toLowerCase())).size > 0
                  ? Math.round(favoriteLogs.length / new Set(favoriteLogs.map((f) => f.userEmail.toLowerCase())).size)
                  : 0}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Fotos elegidas por sesión</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 bg-[#141518] rounded-2xl border border-white/5">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={favoriteSearch}
                onChange={(e) => setFavoriteSearch(e.target.value)}
                placeholder="Buscar por cliente, correo o nombre de galería..."
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Grouped by Client Lists */}
          {favoriteLogs.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-editorial text-zinc-300">No hay fotos favoritas registradas aún</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                Cuando tus clientes entren a sus galerías y presionen el corazón ❤️ en las fotos que más les gusten, aquí se creará automáticamente su lista para que prepares su álbum físico o impresiones.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group favorites by userEmail */}
              {Array.from(new Set(favoriteLogs.map((f) => f.userEmail.toLowerCase())))
                .filter((email) => {
                  if (!favoriteSearch.trim()) return true;
                  const q = favoriteSearch.toLowerCase();
                  const clientLogs = favoriteLogs.filter((f) => f.userEmail.toLowerCase() === email);
                  return (
                    email.includes(q) ||
                    clientLogs.some(
                      (l) =>
                        l.userName.toLowerCase().includes(q) ||
                        (l.userPhone && l.userPhone.includes(q)) ||
                        l.galleryTitle.toLowerCase().includes(q)
                    )
                  );
                })
                .map((clientEmail) => {
                  const clientFavs = favoriteLogs.filter(
                    (f) => f.userEmail.toLowerCase() === clientEmail
                  );
                  const firstLog = clientFavs[0];
                  const photoTitlesList = clientFavs.map((f, idx) => `${idx + 1}. ${f.photoTitle}`).join('\n');

                  return (
                    <div
                      key={clientEmail}
                      className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-5 shadow-xl"
                    >
                      {/* Client Header Card */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center justify-center text-lg">
                            {firstLog.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-editorial text-xl text-white font-medium">
                                {firstLog.userName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[10px]">
                                {clientFavs.length} fotos elegidas
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                              <span className="font-mono text-zinc-300 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-zinc-500" />
                                {clientEmail}
                              </span>
                              {firstLog.userPhone && (
                                <span className="font-mono text-emerald-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {firstLog.userPhone}
                                </span>
                              )}
                              <span className="text-zinc-500">·</span>
                              <span className="text-amber-400 font-medium">
                                Galería: {firstLog.galleryTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons for this client */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(photoTitlesList);
                              alert(`Se copiaron al portapapeles ${clientFavs.length} títulos de fotos para tu software de edición o laboratorio de impresión.`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
                            title="Copiar lista de fotos seleccionadas"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Copiar Lista ({clientFavs.length})</span>
                          </button>

                          {firstLog.userPhone && (
                            <a
                              href={`https://wa.me/${firstLog.userPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hola ${firstLog.userName}, te saluda Martín Castillo de Lente Abierto MX. Ya tengo registrada tu selección de ${clientFavs.length} fotografías favoritas de tu sesión "${firstLog.galleryTitle}" para la preparación de tu álbum. ¿Te gustaría coordinar la entrega o retoque?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Contactar WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Photo Grid Preview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {clientFavs.map((fav) => (
                          <div
                            key={fav.id}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-black/60 border border-white/5 hover:border-rose-500/50 shadow-md transition-all"
                          >
                            <img
                              src={fav.photoThumbnailUrl || fav.photoUrl}
                              alt={fav.photoTitle}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  removeFavoriteLog(fav.photoId, fav.userEmail);
                                  setFavoriteLogs(getStoredFavoriteLogs());
                                }}
                                className="self-end p-1 rounded-full bg-red-950/80 hover:bg-red-900 text-red-300 transition-colors"
                                title="Quitar de la lista"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <p className="text-[10px] text-white font-editorial truncate">
                                {fav.photoTitle}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SITE CMS / CUSTOMIZATION */}
      {activeTab === 'siteCms' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header & Save Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#141518] border border-amber-500/20">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Gestor de Contenido del Sitio (CMS)</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-white">
                Personalizar Textos, Biografía & Datos de Contacto
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Cualquier cambio guardado aquí se refleja de inmediato en el portafolio público, biografía, contacto, precios y pie de página sin tocar código.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              {cmsSaveError && (
                <div className="px-3.5 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{cmsSaveError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas restablecer todos los textos y datos del sitio a sus valores originales?')) {
                    const reset = resetSiteContent();
                    setCmsContent(reset);
                    if (onSaveSiteContent) onSaveSiteContent(reset);
                    setCmsSaveSuccess(true);
                    setTimeout(() => setCmsSaveSuccess(false), 2500);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Restablecer Predeterminados
              </button>

              <button
                type="button"
                disabled={isSavingCms}
                onClick={async () => {
                  setIsSavingCms(true);
                  setCmsSaveError(null);
                  try {
                    saveSiteContent(cmsContent);
                    if (onSaveSiteContent) {
                      await onSaveSiteContent(cmsContent);
                    }
                    setCmsSaveSuccess(true);
                    setTimeout(() => setCmsSaveSuccess(false), 3500);
                  } catch (err: any) {
                    console.error('Error saving CMS:', err);
                    setCmsSaveError(err?.message || 'Error al guardar en la nube.');
                  } finally {
                    setIsSavingCms(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingCms ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : cmsSaveSuccess ? (
                  <Check className="w-4 h-4 text-black" />
                ) : (
                  <Sparkles className="w-4 h-4 text-black" />
                )}
                <span>
                  {isSavingCms
                    ? 'Sincronizando con Firestore...'
                    : cmsSaveSuccess
                    ? '¡Guardado y Sincronizado en la Nube!'
                    : 'Guardar Cambios del Sitio'}
                </span>
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4 text-xs font-mono uppercase tracking-wider">
            <button
              onClick={() => setCmsSubTab('general')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'general'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Identidad, Título & Favicon</span>
            </button>

            <button
              onClick={() => setCmsSubTab('bio')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'bio'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Biografía Profesional</span>
            </button>

            <button
              onClick={() => setCmsSubTab('hero')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'hero'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Portafolio & Hero</span>
            </button>

            <button
              onClick={() => setCmsSubTab('contact')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'contact'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contacto & Cobertura</span>
            </button>

            <button
              onClick={() => setCmsSubTab('pricing')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'pricing'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Costos de Colecciones</span>
            </button>

            <button
              onClick={() => setCmsSubTab('announcement')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'announcement'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Novedades & Banner</span>
            </button>

            <button
              onClick={() => setCmsSubTab('instagram')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                cmsSubTab === 'instagram'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Instagram className="w-3.5 h-3.5 text-rose-400" />
              <span>Instagram (@lente.abierto.mx)</span>
            </button>
          </div>

          {/* SUBTAB 0: IDENTIDAD, TÍTULO, META SEO & FAVICON */}
          {cmsSubTab === 'general' && (
            <div className="space-y-6">
              {/* Browser Preview Card */}
              <div className="p-6 rounded-2xl bg-[#121316] border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    <h4 className="font-editorial text-xl text-white font-medium">
                      Vista Previa de la Pestaña del Navegador & SEO
                    </h4>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    En Tiempo Real
                  </span>
                </div>

                {/* Mock Browser Tab Bar */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                    Así se ve tu sitio en Google Chrome / Safari / Edge:
                  </span>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-t-lg bg-[#242730] border-t border-x border-white/15 text-xs text-zinc-200 max-w-md shadow-lg">
                    {cmsContent.general?.faviconUrl ? (
                      <img
                        src={cmsContent.general.faviconUrl}
                        alt="Favicon"
                        className="w-4 h-4 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-400 shrink-0">
                        📸
                      </div>
                    )}
                    <span className="font-sans font-medium truncate">
                      {cmsContent.general?.pageTitle || 'Lente Abierto MX | Fotografía de Autor'}
                    </span>
                    <span className="text-zinc-500 text-[10px] ml-1">✕</span>
                  </div>
                  <div className="h-1 bg-[#242730] rounded-b-lg"></div>
                </div>

                {/* Main Inputs: Page Title & Meta Description */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Título de la Página Web (<code className="text-amber-400">&lt;title&gt;</code>) *
                    </label>
                    <input
                      type="text"
                      value={cmsContent.general?.pageTitle || ''}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          general: {
                            ...(cmsContent.general || {
                              pageTitle: '',
                              pageDescription: '',
                              brandName: 'Lente Abierto MX',
                              brandTagline: 'Fotografía de Autor · Pixieset Edition',
                              faviconUrl: '',
                              logoIconUrl: '',
                            }),
                            pageTitle: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej. Lente Abierto MX | Fotografía de Autor & Bodas de Destino"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-sans"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Es el texto que se lee en la pestaña del navegador y el título destacado en los resultados de Google.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Descripción de la Página (Meta SEO & Compartir en Redes) *
                    </label>
                    <textarea
                      rows={3}
                      value={cmsContent.general?.pageDescription || ''}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          general: {
                            ...(cmsContent.general || {
                              pageTitle: '',
                              pageDescription: '',
                              brandName: 'Lente Abierto MX',
                              brandTagline: 'Fotografía de Autor · Pixieset Edition',
                              faviconUrl: '',
                              logoIconUrl: '',
                            }),
                            pageDescription: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej. Portafolio oficial y entrega de galerías privadas para bodas, retratos de autor y eventos exclusivos en México..."
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none font-sans"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Este texto aparece debajo del título en Google y al compartir el link en WhatsApp, Facebook o Instagram.
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Name & Tagline */}
              <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
                <h4 className="font-editorial text-xl text-white font-medium border-b border-white/5 pb-3">
                  Nombre de Marca & Lema del Encabezado
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Nombre de la Marca en Barra Superior
                    </label>
                    <input
                      type="text"
                      value={cmsContent.general?.brandName || ''}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          general: {
                            ...(cmsContent.general || {
                              pageTitle: '',
                              pageDescription: '',
                              brandName: 'Lente Abierto MX',
                              brandTagline: 'Fotografía de Autor · Pixieset Edition',
                              faviconUrl: '',
                              logoIconUrl: '',
                            }),
                            brandName: e.target.value,
                          },
                        })
                      }
                      placeholder="LENTE ABIERTO MX"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 tracking-wider font-editorial uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Lema / Bajada de Marca
                    </label>
                    <input
                      type="text"
                      value={cmsContent.general?.brandTagline || ''}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          general: {
                            ...(cmsContent.general || {
                              pageTitle: '',
                              pageDescription: '',
                              brandName: 'Lente Abierto MX',
                              brandTagline: 'Fotografía de Autor · Pixieset Edition',
                              faviconUrl: '',
                              logoIconUrl: '',
                            }),
                            brandTagline: e.target.value,
                          },
                        })
                      }
                      placeholder="FOTOGRAFÍA DE AUTOR · PIXIESET EDITION"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 uppercase tracking-widest font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Favicon & Logo Customization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Favicon Card */}
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="font-editorial text-lg text-white font-medium">
                      Favicon (Ícono de Pestaña)
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">ICO, PNG o SVG</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#181a1f] border border-white/10 flex items-center justify-center p-2 overflow-hidden shrink-0">
                      {cmsContent.general?.faviconUrl ? (
                        <img
                          src={cmsContent.general.faviconUrl}
                          alt="Favicon preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                          📸
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Archivo de Ícono</span>
                        <input
                          type="file"
                          accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const dataUrl = ev.target?.result as string;
                                if (dataUrl) {
                                  setCmsContent({
                                    ...cmsContent,
                                    general: {
                                      ...(cmsContent.general || {
                                        pageTitle: '',
                                        pageDescription: '',
                                        brandName: 'Lente Abierto MX',
                                        brandTagline: 'Fotografía de Autor · Pixieset Edition',
                                        faviconUrl: '',
                                        logoIconUrl: '',
                                      }),
                                      faviconUrl: dataUrl,
                                    },
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {cmsContent.general?.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCmsContent({
                              ...cmsContent,
                              general: {
                                ...(cmsContent.general || {
                                  pageTitle: '',
                                  pageDescription: '',
                                  brandName: 'Lente Abierto MX',
                                  brandTagline: 'Fotografía de Autor · Pixieset Edition',
                                  faviconUrl: '',
                                  logoIconUrl: '',
                                }),
                                faviconUrl: '',
                              },
                            });
                          }}
                          className="block text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Restaurar favicon predeterminado
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                      O pega la URL directa de la imagen / favicon:
                    </label>
                    <input
                      type="text"
                      value={cmsContent.general?.faviconUrl || ''}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          general: {
                            ...(cmsContent.general || {
                              pageTitle: '',
                              pageDescription: '',
                              brandName: 'Lente Abierto MX',
                              brandTagline: 'Fotografía de Autor · Pixieset Edition',
                              faviconUrl: '',
                              logoIconUrl: '',
                            }),
                            faviconUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://ejemplo.com/favicon.png"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* 2. Logo Icon Card */}
                <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="font-editorial text-lg text-white font-medium">
                      Ícono / Logo del Encabezado
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">PNG, SVG o JPG</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#181a1f] border border-white/10 flex items-center justify-center p-2 overflow-hidden shrink-0">
                      {cmsContent.general?.logoIconUrl ? (
                        <img
                          src={cmsContent.general.logoIconUrl}
                          alt="Logo preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Archivo de Logo</span>
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const dataUrl = ev.target?.result as string;
                                if (dataUrl) {
                                  setCmsContent({
                                    ...cmsContent,
                                    general: {
                                      ...(cmsContent.general || {
                                        pageTitle: '',
                                        pageDescription: '',
                                        brandName: 'Lente Abierto MX',
                                        brandTagline: 'Fotografía de Autor · Pixieset Edition',
                                        faviconUrl: '',
                                        logoIconUrl: '',
                                      }),
                                      logoIconUrl: dataUrl,
                                    },
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {cmsContent.general?.logoIconUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCmsContent({
                              ...cmsContent,
                              general: {
                                ...(cmsContent.general || {
                                  pageTitle: '',
                                  pageDescription: '',
                                  brandName: 'Lente Abierto MX',
                                  brandTagline: 'Fotografía de Autor · Pixieset Edition',
                                  faviconUrl: '',
                                  logoIconUrl: '',
                                }),
                                logoIconUrl: '',
                              },
                            });
                          }}
                          className="block text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Restaurar ícono de cámara dorado
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                      O pega la URL directa del logotipo:
                    </label>
                    <input
                      type="text"
                      value={cmsContent.general?.logoIconUrl || ''}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          general: {
                            ...(cmsContent.general || {
                              pageTitle: '',
                              pageDescription: '',
                              brandName: 'Lente Abierto MX',
                              brandTagline: 'Fotografía de Autor · Pixieset Edition',
                              faviconUrl: '',
                              logoIconUrl: '',
                            }),
                            logoIconUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://ejemplo.com/logo.png"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 1: BIOGRAPHY */}
          {cmsSubTab === 'bio' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-5">
                <h4 className="font-editorial text-xl text-white font-medium border-b border-white/5 pb-3">
                  Información Personal & Fotográfica
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Nombre del Fotógrafo / Fundador
                    </label>
                    <input
                      type="text"
                      value={cmsContent.biography.photographerName}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          biography: { ...cmsContent.biography, photographerName: e.target.value },
                        })
                      }
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Título / Cargo
                    </label>
                    <input
                      type="text"
                      value={cmsContent.biography.tagline}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          biography: { ...cmsContent.biography, tagline: e.target.value },
                        })
                      }
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400">
                        Foto de Perfil / Retrato del Fotógrafo
                      </label>
                      <label className="text-[11px] text-amber-400 hover:text-amber-300 font-mono cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Subir desde Equipo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (ev) => {
                                const data = ev.target?.result as string;
                                if (data) {
                                  setCmsContent({
                                    ...cmsContent,
                                    biography: { ...cmsContent.biography, portraitUrl: data },
                                  });
                                }
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex gap-3 items-center">
                      <input
                        type="url"
                        value={cmsContent.biography.portraitUrl}
                        onChange={(e) =>
                          setCmsContent({
                            ...cmsContent,
                            biography: { ...cmsContent.biography, portraitUrl: e.target.value },
                          })
                        }
                        placeholder="https://images.unsplash.com/... o sube archivo"
                        className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                      />
                      {cmsContent.biography.portraitUrl && (
                        <img
                          src={cmsContent.biography.portraitUrl}
                          alt="Previa"
                          className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Ubicación de Trabajo Habitual
                    </label>
                    <input
                      type="text"
                      value={cmsContent.biography.locationText}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          biography: { ...cmsContent.biography, locationText: e.target.value },
                        })
                      }
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Distintivo de Experiencia (Badge flotante)
                    </label>
                    <input
                      type="text"
                      value={cmsContent.biography.experienceYears}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          biography: { ...cmsContent.biography, experienceYears: e.target.value },
                        })
                      }
                      placeholder="Ej. 12+ Años de Carrera"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Subtítulo del Distintivo
                    </label>
                    <input
                      type="text"
                      value={cmsContent.biography.experienceSubtitle}
                      onChange={(e) =>
                        setCmsContent({
                          ...cmsContent,
                          biography: { ...cmsContent.biography, experienceSubtitle: e.target.value },
                        })
                      }
                      placeholder="Ej. Bodas de Destino & Retrato"
                      className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Cita Célebre / Declaración Central
                  </label>
                  <input
                    type="text"
                    value={cmsContent.biography.quote}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        biography: { ...cmsContent.biography, quote: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Párrafo Introductorio (Filosofía de Lente Abierto MX)
                  </label>
                  <textarea
                    rows={3}
                    value={cmsContent.biography.introParagraph}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        biography: { ...cmsContent.biography, introParagraph: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Trayectoria Completa & Biografía Detallada
                  </label>
                  <textarea
                    rows={5}
                    value={cmsContent.biography.detailedBio}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        biography: { ...cmsContent.biography, detailedBio: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Distintivos / Certificaciones (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={cmsContent.biography.badges.join(', ')}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        biography: {
                          ...cmsContent.biography,
                          badges: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    placeholder="Sony Alpha Artisan, Capture One Certified..."
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Edit 3 Philosophy Principles */}
              <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
                <h4 className="font-editorial text-xl text-white font-medium border-b border-white/5 pb-3">
                  Tres Principios Inviolables de Fotografía
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cmsContent.biography.principles.map((pr, index) => (
                    <div key={index} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <span className="text-amber-400 font-mono text-xs font-bold block">
                        Principio {pr.number || `0${index + 1}`}
                      </span>
                      <input
                        type="text"
                        value={pr.title}
                        onChange={(e) => {
                          const updated = [...cmsContent.biography.principles];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setCmsContent({
                            ...cmsContent,
                            biography: { ...cmsContent.biography, principles: updated },
                          });
                        }}
                        className="w-full bg-[#181a1f] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-medium"
                      />
                      <textarea
                        rows={4}
                        value={pr.description}
                        onChange={(e) => {
                          const updated = [...cmsContent.biography.principles];
                          updated[index] = { ...updated[index], description: e.target.value };
                          setCmsContent({
                            ...cmsContent,
                            biography: { ...cmsContent.biography, principles: updated },
                          });
                        }}
                        className="w-full bg-[#181a1f] border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] text-zinc-300 leading-relaxed resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Publications & Press */}
              <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-3">
                <h4 className="font-editorial text-xl text-white font-medium">
                  Publicaciones & Reconocimientos
                </h4>
                <p className="text-xs text-zinc-400">
                  Separadas por comas. Se muestran en el cintillo inferior de la biografía.
                </p>
                <input
                  type="text"
                  value={cmsContent.biography.publications.join(', ')}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      biography: {
                        ...cmsContent.biography,
                        publications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* SUBTAB 2: HERO & PORTFOLIO */}
          {cmsSubTab === 'hero' && (
            <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-5">
              <h4 className="font-editorial text-xl text-white font-medium border-b border-white/5 pb-3">
                Encabezado Principal del Portafolio de Galerías
              </h4>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Etiqueta Superior (Badge)
                </label>
                <input
                  type="text"
                  value={cmsContent.hero.badge}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      hero: { ...cmsContent.hero, badge: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Título Principal del Portafolio
                </label>
                <input
                  type="text"
                  value={cmsContent.hero.title}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      hero: { ...cmsContent.hero, title: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Subtítulo / Introducción del Portafolio
                </label>
                <textarea
                  rows={3}
                  value={cmsContent.hero.subtitle}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      hero: { ...cmsContent.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Texto del Botón para Acceder al Portal de Clientes
                </label>
                <input
                  type="text"
                  value={cmsContent.hero.clientPortalCta}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      hero: { ...cmsContent.hero, clientPortalCta: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* SUBTAB 3: CONTACT & LOCATION */}
          {cmsSubTab === 'contact' && (
            <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-5">
              <h4 className="font-editorial text-xl text-white font-medium border-b border-white/5 pb-3">
                Datos de Contacto Directo & Cobertura de Estudios
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={cmsContent.contact.email}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        contact: { ...cmsContent.contact, email: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Teléfono & WhatsApp (Formato Visible)
                  </label>
                  <input
                    type="text"
                    value={cmsContent.contact.phone}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        contact: { ...cmsContent.contact, phone: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Usuario de Instagram
                  </label>
                  <input
                    type="text"
                    value={cmsContent.contact.instagramHandle}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        contact: { ...cmsContent.contact, instagramHandle: e.target.value },
                      })
                    }
                    placeholder="@lente.abierto.mx"
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Base de Operaciones Principal
                </label>
                <input
                  type="text"
                  value={cmsContent.contact.locationTitle}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      contact: { ...cmsContent.contact, locationTitle: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Detalles del Estudio
                </label>
                <input
                  type="text"
                  value={cmsContent.contact.locationDetails}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      contact: { ...cmsContent.contact, locationDetails: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Zona de Cobertura Geográfica
                </label>
                <textarea
                  rows={3}
                  value={cmsContent.contact.coverageDetails}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      contact: { ...cmsContent.contact, coverageDetails: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Título de la Página de Contacto
                  </label>
                  <input
                    type="text"
                    value={cmsContent.contact.title}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        contact: { ...cmsContent.contact, title: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Subtítulo / Introducción de Contacto
                  </label>
                  <input
                    type="text"
                    value={cmsContent.contact.subtitle}
                    onChange={(e) =>
                      setCmsContent({
                        ...cmsContent,
                        contact: { ...cmsContent.contact, subtitle: e.target.value },
                      })
                    }
                    className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: PRICING & COLLECTIONS */}
          {cmsSubTab === 'pricing' && (
            <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-editorial text-xl text-white font-medium">
                    Costos de Colecciones & Guía de Inversión
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Agrega, edita o elimina los paquetes que los clientes ven en la sección de cotización.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newPkg: PricingPackage = {
                      id: `pkg-${Date.now()}`,
                      name: 'Nueva Colección',
                      price: 'Desde $15,000 MXN',
                      description: 'Descripción del paquete de cobertura y entrega fotográfica.',
                    };
                    setCmsContent({
                      ...cmsContent,
                      contact: {
                        ...cmsContent.contact,
                        pricingPackages: [...cmsContent.contact.pricingPackages, newPkg],
                      },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Paquete</span>
                </button>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Título de la Sección de Precios
                </label>
                <input
                  type="text"
                  value={cmsContent.contact.pricingTitle}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      contact: { ...cmsContent.contact, pricingTitle: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Package cards */}
              <div className="space-y-4">
                {cmsContent.contact.pricingPackages.map((pkg, idx) => (
                  <div
                    key={pkg.id || idx}
                    className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-amber-400 font-bold uppercase">
                        Paquete #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = cmsContent.contact.pricingPackages.filter((_, i) => i !== idx);
                          setCmsContent({
                            ...cmsContent,
                            contact: { ...cmsContent.contact, pricingPackages: updated },
                          });
                        }}
                        className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-500/20"
                        title="Eliminar este paquete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase font-mono text-zinc-400 mb-1">
                          Nombre de la Colección
                        </label>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => {
                            const updated = [...cmsContent.contact.pricingPackages];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setCmsContent({
                              ...cmsContent,
                              contact: { ...cmsContent.contact, pricingPackages: updated },
                            });
                          }}
                          className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase font-mono text-zinc-400 mb-1">
                          Costo / Rango de Inversión
                        </label>
                        <input
                          type="text"
                          value={pkg.price}
                          onChange={(e) => {
                            const updated = [...cmsContent.contact.pricingPackages];
                            updated[idx] = { ...updated[idx], price: e.target.value };
                            setCmsContent({
                              ...cmsContent,
                              contact: { ...cmsContent.contact, pricingPackages: updated },
                            });
                          }}
                          className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-mono text-zinc-400 mb-1">
                        Descripción & Entregables
                      </label>
                      <input
                        type="text"
                        value={pkg.description}
                        onChange={(e) => {
                          const updated = [...cmsContent.contact.pricingPackages];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setCmsContent({
                            ...cmsContent,
                            contact: { ...cmsContent.contact, pricingPackages: updated },
                          });
                        }}
                        className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Aviso al Pie de Precios (Garantía Pixieset & Descargas)
                </label>
                <textarea
                  rows={2}
                  value={cmsContent.contact.pricingNotice}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      contact: { ...cmsContent.contact, pricingNotice: e.target.value },
                    })
                  }
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* SUBTAB 5: NOVEDADES & BANNER */}
          {cmsSubTab === 'announcement' && (
            <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-5">
              <h4 className="font-editorial text-xl text-white font-medium border-b border-white/5 pb-3">
                Barra Superior de Novedades & Anuncios
              </h4>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/5">
                <input
                  type="checkbox"
                  id="announcement-toggle"
                  checked={cmsContent.announcement.enabled}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      announcement: { ...cmsContent.announcement, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 focus:ring-offset-0 bg-zinc-800 border-zinc-700"
                />
                <label htmlFor="announcement-toggle" className="text-xs text-zinc-200 cursor-pointer">
                  <span className="font-semibold block">Activar Barra Superior de Novedades</span>
                  <span className="text-zinc-400 font-light text-[11px]">
                    Aparece en la parte más alta de la página web para avisos de agenda abierta, promociones de temporada o cobertura especial.
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Etiqueta / Badge del Anuncio
                </label>
                <input
                  type="text"
                  value={cmsContent.announcement.badgeText || ''}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      announcement: { ...cmsContent.announcement, badgeText: e.target.value },
                    })
                  }
                  placeholder="Ej. Agenda Abierta 2026 / 2027"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Texto del Anuncio o Novedad
                </label>
                <textarea
                  rows={3}
                  value={cmsContent.announcement.text}
                  onChange={(e) =>
                    setCmsContent({
                      ...cmsContent,
                      announcement: { ...cmsContent.announcement, text: e.target.value },
                    })
                  }
                  placeholder="Ej. Disponibilidad limitada para bodas de destino en Oaxaca, San Miguel de Allende y Riviera Maya."
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Preview */}
              {cmsContent.announcement.enabled && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                    Vista Previa de la Barra de Novedades:
                  </span>
                  <div className="bg-gradient-to-r from-amber-950/70 via-[#181510] to-amber-950/70 border border-amber-500/30 rounded-xl py-2 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      {cmsContent.announcement.badgeText && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] uppercase font-mono tracking-wider font-semibold">
                          {cmsContent.announcement.badgeText}
                        </span>
                      )}
                      <span className="text-zinc-300 font-light text-xs tracking-wide">
                        {cmsContent.announcement.text}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 5: INSTAGRAM FEED MANAGEMENT */}
          {cmsSubTab === 'instagram' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#121316] border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Instagram className="w-5 h-5 text-rose-400" />
                      <h4 className="font-editorial text-xl text-white font-medium">
                        Publicaciones Oficiales @lente.abierto.mx
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 font-light mt-1">
                      Gestiona las fotografías, textos y estadísticas que se muestran en el carrusel de Instagram de la web oficial.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const realPhotos: InstagramPost[] = [];
                        for (const g of galleries) {
                          for (const p of g.photos.slice(0, 2)) {
                            realPhotos.push({
                              id: `ig-sync-${p.id}`,
                              imageUrl: p.url,
                              caption: `${p.title}. Toma documental de autor para la colección "${g.title}". Momentos únicos bajo luz natural. #LenteAbiertoMX @lente.abierto.mx`,
                              likes: Math.floor(Math.random() * 400) + 380,
                              comments: Math.floor(Math.random() * 30) + 20,
                              postUrl: 'https://instagram.com/lente.abierto.mx',
                              date: 'Publicación reciente',
                            });
                            if (realPhotos.length >= 6) break;
                          }
                          if (realPhotos.length >= 6) break;
                        }
                        if (realPhotos.length > 0) {
                          setInstagramPostsList(realPhotos);
                          saveInstagramPosts(realPhotos);
                          setIgFeedback('¡Se cargaron 6 fotografías reales de tus colecciones para el feed de Instagram!');
                          setTimeout(() => setIgFeedback(null), 3500);
                        } else {
                          setIgFeedback('No hay fotos en tus galerías aún. Agrega fotos primero.');
                          setTimeout(() => setIgFeedback(null), 3500);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1.5 transition-colors font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cargar Mis Fotos de Galerías</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const reset = resetInstagramPosts();
                        setInstagramPostsList(reset);
                        setIgFeedback('Publicaciones de Instagram restablecidas.');
                        setTimeout(() => setIgFeedback(null), 3500);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Restablecer</span>
                    </button>

                    <a
                      href="https://instagram.com/lente.abierto.mx"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-600/20 hover:from-amber-500/30 text-white text-xs border border-white/10 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Ver en Instagram</span>
                    </a>
                  </div>
                </div>

                {igFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{igFeedback}</span>
                  </div>
                )}

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {instagramPostsList.map((post, idx) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-xl bg-[#181a1f] border border-white/5 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex gap-3">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10 group bg-black">
                          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-mono cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                            <span>Cambiar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const r = new FileReader();
                                  r.onload = (ev) => {
                                    const data = ev.target?.result as string;
                                    if (data) {
                                      const updated = [...instagramPostsList];
                                      updated[idx] = { ...updated[idx], imageUrl: data };
                                      setInstagramPostsList(updated);
                                      saveInstagramPosts(updated);
                                    }
                                  };
                                  r.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                              Post #{idx + 1}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{post.date || 'Reciente'}</span>
                          </div>
                          <p className="text-xs text-zinc-300 line-clamp-2 font-light">{post.caption}</p>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 pt-1">
                            <span>❤️ {post.likes}</span>
                            <span>💬 {post.comments}</span>
                          </div>
                        </div>
                      </div>

                      {/* Edit Fields */}
                      <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                            URL de Imagen
                          </label>
                          <input
                            type="url"
                            value={post.imageUrl}
                            onChange={(e) => {
                              const updated = [...instagramPostsList];
                              updated[idx] = { ...updated[idx], imageUrl: e.target.value };
                              setInstagramPostsList(updated);
                              saveInstagramPosts(updated);
                            }}
                            className="w-full bg-[#121316] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                            Pie de foto (Caption)
                          </label>
                          <textarea
                            rows={2}
                            value={post.caption}
                            onChange={(e) => {
                              const updated = [...instagramPostsList];
                              updated[idx] = { ...updated[idx], caption: e.target.value };
                              setInstagramPostsList(updated);
                              saveInstagramPosts(updated);
                            }}
                            className="w-full bg-[#121316] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                              Likes
                            </label>
                            <input
                              type="number"
                              value={post.likes}
                              onChange={(e) => {
                                const updated = [...instagramPostsList];
                                updated[idx] = { ...updated[idx], likes: parseInt(e.target.value) || 0 };
                                setInstagramPostsList(updated);
                                saveInstagramPosts(updated);
                              }}
                              className="w-full bg-[#121316] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-mono text-zinc-400 mb-1">
                              Fecha relativa
                            </label>
                            <input
                              type="text"
                              value={post.date || ''}
                              onChange={(e) => {
                                const updated = [...instagramPostsList];
                                updated[idx] = { ...updated[idx], date: e.target.value };
                                setInstagramPostsList(updated);
                                saveInstagramPosts(updated);
                              }}
                              placeholder="Hace 2 días"
                              className="w-full bg-[#121316] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 pt-4 border-t border-white/5">
            {cmsSaveError && (
              <div className="px-3.5 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{cmsSaveError}</span>
              </div>
            )}
            <button
              type="button"
              disabled={isSavingCms}
              onClick={async () => {
                setIsSavingCms(true);
                setCmsSaveError(null);
                try {
                  saveSiteContent(cmsContent);
                  if (onSaveSiteContent) {
                    await onSaveSiteContent(cmsContent);
                  }
                  setCmsSaveSuccess(true);
                  setTimeout(() => setCmsSaveSuccess(false), 3500);
                } catch (err: any) {
                  console.error('Error saving CMS:', err);
                  setCmsSaveError(err?.message || 'Error al guardar en la nube.');
                } finally {
                  setIsSavingCms(false);
                }
              }}
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingCms ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
              ) : cmsSaveSuccess ? (
                <Check className="w-4 h-4 text-black" />
              ) : (
                <Sparkles className="w-4 h-4 text-black" />
              )}
              <span>
                {isSavingCms
                  ? 'Sincronizando con Firestore...'
                  : cmsSaveSuccess
                  ? '¡Guardado y Sincronizado en la Nube!'
                  : 'Guardar Todo el Contenido del Sitio'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: USERS & ADMIN SECURITY */}
      {activeTab === 'users' && (
        <div className="space-y-10 animate-fadeIn">
          {/* SECTION A: ADMIN CREDENTIALS MODIFICATION */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] uppercase font-mono tracking-widest mb-1.5">
                  <KeyRound className="w-3 h-3" />
                  <span>Seguridad Maestra</span>
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">
                  Modificar Usuario y Contraseña de Administrador
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Protege el backend cambiando las credenciales iniciales (por defecto: usuario <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">admi</code> y contraseña <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">Mar.830903</code>).
                </p>
              </div>

              <div className="text-right font-mono text-[11px] text-zinc-400 bg-black/30 px-3.5 py-2 rounded-xl border border-white/5">
                <span className="text-zinc-500 block text-[9px] uppercase">Usuario Activo:</span>
                <span className="text-amber-400 font-semibold">{adminCreds.username}</span>
              </div>
            </div>

            {adminCredsFeedback && (
              <div
                className={`p-4 rounded-xl mb-6 text-xs flex items-center gap-2.5 ${
                  adminCredsFeedback.isError
                    ? 'bg-red-950/50 border border-red-500/40 text-red-200'
                    : 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                }`}
              >
                {adminCredsFeedback.isError ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{adminCredsFeedback.message}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAdminCredsFeedback(null);

                if (adminNewPass !== adminConfirmPass) {
                  setAdminCredsFeedback({
                    isError: true,
                    message: 'La nueva contraseña y su confirmación no coinciden.',
                  });
                  return;
                }

                const res = updateAdminCredentials(adminCurrentPass, adminUserForm, adminNewPass, adminEmailForm);
                if (res.success) {
                  const refreshed = getStoredAdminCredentials();
                  setAdminCreds(refreshed);
                  setAdminCurrentPass('');
                  setAdminNewPass('');
                  setAdminConfirmPass('');
                  setAdminCredsFeedback({
                    isError: false,
                    message: res.message,
                  });
                  setTimeout(() => setAdminCredsFeedback(null), 5000);
                } else {
                  setAdminCredsFeedback({
                    isError: true,
                    message: res.message,
                  });
                }
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Nuevo Nombre de Usuario Administrador
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUserForm}
                    onChange={(e) => setAdminUserForm(e.target.value)}
                    placeholder="ej. admi o fotografo"
                    className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                    Nombre con el que iniciarás sesión en el backend.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Correo Electrónico de Notificaciones
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmailForm}
                    onChange={(e) => setAdminEmailForm(e.target.value)}
                    placeholder="casm830903@gmail.com"
                    className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                    Para recuperación y recepción de avisos.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Contraseña Actual <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={adminCurrentPass}
                      onChange={(e) => setAdminCurrentPass(e.target.value)}
                      placeholder="Contraseña actual requerida"
                      className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 pr-10 text-xs text-white font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Nueva Contraseña <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={adminNewPass}
                      onChange={(e) => setAdminNewPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 pr-10 text-xs text-white font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Confirmar Nueva Contraseña <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={adminConfirmPass}
                    onChange={(e) => setAdminConfirmPass(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guardar Nuevas Credenciales Maestras</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION B: COLLABORATORS & USERS MANAGEMENT */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-white/5 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="font-editorial text-2xl text-white font-medium">
                    Gestión de Colaboradores, Equipo & Clientes
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Agrega colaboradores (asistentes, segundos fotógrafos, editores) o gestiona clientes con acceso exclusivo a colecciones privadas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isSyncingUsersCloud}
                  onClick={async () => {
                    setIsSyncingUsersCloud(true);
                    try {
                      await syncAllUsersToCloud(userList);
                      setUserFeedback({
                        isError: false,
                        message: '¡Todos los perfiles de usuario han sido sincronizados y respaldados en la base de datos Firestore!',
                      });
                      setTimeout(() => setUserFeedback(null), 4000);
                    } catch (err: any) {
                      setUserFeedback({
                        isError: true,
                        message: `Error al sincronizar usuarios con Firestore: ${err?.message || err}`,
                      });
                    } finally {
                      setIsSyncingUsersCloud(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingUsersCloud ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} />
                  <span>{isSyncingUsersCloud ? 'Sincronizando...' : 'Sincronizar Usuarios con BD'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Agregar Colaborador / Usuario</span>
                </button>
              </div>
            </div>

            {userFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  userFeedback.isError
                    ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                    : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {userFeedback.isError ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{userFeedback.message}</span>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-[#181a1f] p-1 rounded-xl border border-white/5 text-[11px] font-mono">
                {(['todos', 'colaborador', 'fotografo', 'asistente', 'editor', 'cliente'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      userRoleFilter === r
                        ? 'bg-amber-500 text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r === 'todos' ? `Todos (${userList.length})` : r}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nombre o correo..."
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
            </div>

            {/* Users Table / List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userList
                .filter((u) => {
                  const matchRole = userRoleFilter === 'todos' || u.role === userRoleFilter;
                  const matchSearch =
                    !userSearch ||
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase());
                  return matchRole && matchSearch;
                })
                .map((u) => {
                  const isMainPhotographer = u.id === DEFAULT_PHOTOGRAPHER_PROFILE.id;
                  return (
                    <div
                      key={u.id}
                      className="p-5 rounded-2xl bg-[#181a1f] border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                          alt={u.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/30 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-editorial text-lg text-white font-medium truncate">
                              {u.name}
                            </h4>
                            <span
                              className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : u.role === 'fotografo'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : u.role === 'colaborador'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : u.role === 'asistente'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : u.role === 'editor'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 truncate">
                            <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>

                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          )}

                          <p className="text-[11px] text-zinc-400 font-light mt-1.5 line-clamp-2">
                            {u.bio || 'Miembro de la plataforma Lente Abierto MX'}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase font-mono text-zinc-500">Rol:</label>
                          <select
                            value={u.role}
                            disabled={isMainPhotographer}
                            onChange={(e) => {
                              const newRole = e.target.value as UserProfile['role'];
                              updateUserProfile(u.id, { role: newRole });
                              setUserList(getStoredUsers());
                              setUserFeedback({
                                isError: false,
                                message: `Rol de ${u.name} cambiado a ${newRole}.`,
                              });
                              setTimeout(() => setUserFeedback(null), 3000);
                            }}
                            className="bg-[#121316] border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-zinc-200 capitalize disabled:opacity-50"
                          >
                            <option value="colaborador">Colaborador</option>
                            <option value="fotografo">Fotógrafo</option>
                            <option value="asistente">Asistente</option>
                            <option value="editor">Editor</option>
                            <option value="cliente">Cliente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserData({
                                name: u.name,
                                email: u.email,
                                role: u.role,
                                password: u.password || '',
                                pin: u.pin || '',
                                phone: u.phone || '',
                                location: u.location || '',
                                bio: u.bio || '',
                                assignedGalleries: u.assignedGalleries || [],
                                avatarUrl: u.avatarUrl || '',
                              });
                              setIsEditUserModalOpen(true);
                            }}
                            className="p-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border border-zinc-700 text-xs flex items-center gap-1.5 transition-colors"
                            title="Editar información y credenciales de acceso"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {!isMainPhotographer ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar al usuario ${u.name}?`)) {
                                  deleteUser(u.id);
                                  setUserList(getStoredUsers());
                                  setUserFeedback({
                                    isError: false,
                                    message: `Usuario ${u.name} eliminado.`,
                                  });
                                  setTimeout(() => setUserFeedback(null), 3000);
                                }
                              }}
                              className="p-1.5 px-2.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20 text-xs flex items-center gap-1 transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-amber-400/80 uppercase">Titular</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* MODAL: ADD NEW USER / COLLABORATOR */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-lg bg-[#141518] border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-zinc-200 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-editorial text-2xl text-white font-medium">
                        Nuevo Colaborador o Usuario
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Registra integrantes del equipo o clientes con acceso.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      const created = addUser({
                        name: newUserForm.name,
                        email: newUserForm.email,
                        role: newUserForm.role,
                        password: newUserForm.password,
                        pin: newUserForm.pin,
                        phone: newUserForm.phone,
                        location: newUserForm.location,
                        bio: newUserForm.bio,
                        assignedGalleries: newUserForm.assignedGalleries,
                        avatarUrl: newUserForm.avatarUrl?.trim() || undefined,
                      });
                      setUserList(getStoredUsers());
                      setIsAddUserModalOpen(false);
                      setNewUserData({
                        name: '',
                        email: '',
                        role: 'colaborador',
                        password: '',
                        pin: '',
                        phone: '',
                        location: 'México',
                        bio: '',
                        assignedGalleries: [],
                        avatarUrl: '',
                      });
                      setUserFeedback({
                        isError: false,
                        message: `Usuario ${created.name} (${created.role}) agregado exitosamente.`,
                      });
                      setTimeout(() => setUserFeedback(null), 4000);
                    } catch (err: any) {
                      alert(err.message || 'Error al registrar usuario.');
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserForm.name}
                        onChange={(e) => setNewUserData({ ...newUserForm, name: e.target.value })}
                        placeholder="Ej. Sofía Hernández"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserForm.email}
                        onChange={(e) => setNewUserData({ ...newUserForm, email: e.target.value })}
                        placeholder="sofia@lenteabierto.mx"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Rol en la Plataforma *
                      </label>
                      <select
                        value={newUserForm.role}
                        onChange={(e) =>
                          setNewUserData({ ...newUserForm, role: e.target.value as UserProfile['role'] })
                        }
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="colaborador">Colaborador (Producción / Subida)</option>
                        <option value="fotografo">Fotógrafo Asociado</option>
                        <option value="asistente">Asistente de Iluminación</option>
                        <option value="editor">Editor de Postproducción</option>
                        <option value="cliente">Cliente Exclusivo</option>
                        <option value="admin">Administrador Secundario</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserData({ ...newUserForm, phone: e.target.value })}
                        placeholder="+52 55 1234 5678"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Contraseña o PIN de Acceso
                      </label>
                      <input
                        type="text"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserData({ ...newUserForm, password: e.target.value })}
                        placeholder="•••••••• o 1234"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Ubicación Base
                      </label>
                      <input
                        type="text"
                        value={newUserForm.location}
                        onChange={(e) => setNewUserData({ ...newUserForm, location: e.target.value })}
                        placeholder="CDMX / Cuernavaca / Oaxaca"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                      Biografía Corta o Notas Internas
                    </label>
                    <input
                      type="text"
                      value={newUserForm.bio}
                      onChange={(e) => setNewUserData({ ...newUserForm, bio: e.target.value })}
                      placeholder="Segundo fotógrafo para bodas en Morelos..."
                      className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Avatar Upload for New User */}
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <img
                      src={
                        newUserForm.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                      }
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/40 shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        Foto de Perfil / Avatar (Opcional)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow">
                          <Upload className="w-3 h-3" />
                          <span>Subir Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const data = await resizeImageToDataUrl(file, 256, 256, 0.85);
                                  if (data) {
                                    setNewUserData({ ...newUserForm, avatarUrl: data });
                                  }
                                } catch (err) {
                                  console.error('Error compressing new user avatar:', err);
                                }
                              }
                            }}
                          />
                        </label>
                        {newUserForm.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setNewUserData({ ...newUserForm, avatarUrl: '' })}
                            className="text-[10px] text-zinc-500 hover:text-red-400 font-mono"
                          >
                            Quitar foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Galleries checkboxes */}
                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1.5">
                      Asignar Colecciones / Galerías Permitidas:
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#121316] rounded-xl border border-zinc-800">
                      {galleries.map((gal) => (
                        <label
                          key={gal.id}
                          className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={newUserForm.assignedGalleries.includes(gal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUserData({
                                  ...newUserForm,
                                  assignedGalleries: [...newUserForm.assignedGalleries, gal.id],
                                });
                              } else {
                                setNewUserData({
                                  ...newUserForm,
                                  assignedGalleries: newUserForm.assignedGalleries.filter((id) => id !== gal.id),
                                });
                              }
                            }}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="truncate">{gal.title}</span>
                          <span className="text-[10px] font-mono text-zinc-500">({gal.category})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white uppercase font-mono text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20"
                    >
                      Guardar Usuario
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: EDIT USER / COLLABORATOR */}
          {isEditUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-lg bg-[#141518] border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-zinc-200 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-editorial text-2xl text-white font-medium">
                        Editar Usuario: {editingUser.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Modifica datos personales, rol y credenciales de acceso.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsEditUserModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      if (editingUser.id === DEFAULT_PHOTOGRAPHER_PROFILE.id) {
                        saveAdminCredentials({
                          username: editUserForm.email.split('@')[0] || 'admi',
                          email: editUserForm.email.trim(),
                          password: editUserForm.password || 'Mar.830903',
                          name: editUserForm.name.trim(),
                        });
                      }

                      updateUserProfile(editingUser.id, {
                        name: editUserForm.name.trim(),
                        email: editUserForm.email.trim(),
                        role: editUserForm.role,
                        password: editUserForm.password.trim(),
                        pin: editUserForm.pin.trim(),
                        phone: editUserForm.phone.trim(),
                        location: editUserForm.location.trim(),
                        bio: editUserForm.bio.trim(),
                        assignedGalleries: editUserForm.assignedGalleries,
                        avatarUrl: editUserForm.avatarUrl?.trim() || undefined,
                      });

                      setUserList(getStoredUsers());
                      setIsEditUserModalOpen(false);
                      setEditingUser(null);
                      setUserFeedback({
                        isError: false,
                        message: `Usuario ${editUserForm.name} actualizado exitosamente.`,
                      });
                      setTimeout(() => setUserFeedback(null), 4000);
                    } catch (err: any) {
                      alert(err.message || 'Error al actualizar usuario.');
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  {/* Avatar section */}
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <img
                      src={
                        editUserForm.avatarUrl ||
                        editingUser.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={editUserForm.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/40 shrink-0"
                    />
                    <div className="flex-1 space-y-1.5">
                      <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        Foto de Perfil / Avatar
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow">
                          <Upload className="w-3 h-3" />
                          <span>Subir Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const data = await resizeImageToDataUrl(file, 256, 256, 0.85);
                                  if (data) {
                                    setEditUserData({ ...editUserForm, avatarUrl: data });
                                  }
                                } catch (err) {
                                  console.error('Error compressing user avatar:', err);
                                }
                              }
                            }}
                          />
                        </label>
                        {editUserForm.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setEditUserData({ ...editUserForm, avatarUrl: '' })}
                            className="text-[10px] text-zinc-500 hover:text-red-400 font-mono"
                          >
                            Quitar foto
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editUserForm.avatarUrl}
                        onChange={(e) => setEditUserData({ ...editUserForm, avatarUrl: e.target.value })}
                        placeholder="O pega URL de foto (https://...)"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={editUserForm.name}
                        onChange={(e) => setEditUserData({ ...editUserForm, name: e.target.value })}
                        placeholder="Ej. Sofía Hernández"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Usuario / Correo Electrónico *
                      </label>
                      <input
                        type="text"
                        required
                        value={editUserForm.email}
                        onChange={(e) => setEditUserData({ ...editUserForm, email: e.target.value })}
                        placeholder="demo o demo@lenteabierto.mx"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Rol en la Plataforma *
                      </label>
                      <select
                        value={editUserForm.role}
                        onChange={(e) =>
                          setEditUserData({ ...editUserForm, role: e.target.value as UserProfile['role'] })
                        }
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="colaborador">Colaborador (Producción / Subida)</option>
                        <option value="fotografo">Fotógrafo Asociado</option>
                        <option value="asistente">Asistente de Iluminación</option>
                        <option value="editor">Editor de Postproducción</option>
                        <option value="cliente">Cliente Exclusivo</option>
                        <option value="admin">Administrador Secundario</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={editUserForm.phone}
                        onChange={(e) => setEditUserData({ ...editUserForm, phone: e.target.value })}
                        placeholder="+52 55 1234 5678"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Contraseña o Clave de Acceso
                      </label>
                      <input
                        type="text"
                        value={editUserForm.password}
                        onChange={(e) => setEditUserData({ ...editUserForm, password: e.target.value })}
                        placeholder="•••••••• o demo"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                        Ubicación Base
                      </label>
                      <input
                        type="text"
                        value={editUserForm.location}
                        onChange={(e) => setEditUserData({ ...editUserForm, location: e.target.value })}
                        placeholder="CDMX / Cuernavaca / Oaxaca"
                        className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1">
                      Biografía Corta o Notas Internas
                    </label>
                    <input
                      type="text"
                      value={editUserForm.bio}
                      onChange={(e) => setEditUserData({ ...editUserForm, bio: e.target.value })}
                      placeholder="Notas del usuario..."
                      className="w-full bg-[#1c1e24] border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Assigned Galleries checkboxes */}
                  <div>
                    <label className="block text-zinc-400 uppercase font-mono text-[10px] mb-1.5">
                      Asignar Colecciones / Galerías Permitidas:
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#121316] rounded-xl border border-zinc-800">
                      {galleries.map((gal) => (
                        <label
                          key={gal.id}
                          className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={editUserForm.assignedGalleries.includes(gal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditUserData({
                                  ...editUserForm,
                                  assignedGalleries: [...editUserForm.assignedGalleries, gal.id],
                                });
                              } else {
                                setEditUserData({
                                  ...editUserForm,
                                  assignedGalleries: editUserForm.assignedGalleries.filter((id) => id !== gal.id),
                                });
                              }
                            }}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="truncate">{gal.title}</span>
                          <span className="text-[10px] font-mono text-zinc-500">({gal.category})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditUserModalOpen(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white uppercase font-mono text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
