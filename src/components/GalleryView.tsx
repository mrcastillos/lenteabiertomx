import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Share2,
  Heart,
  ArrowLeft,
  Lock,
  Check,
  ShieldCheck,
  Layers,
  Sparkles,
  Eye,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Shuffle,
} from 'lucide-react';
import { Gallery, Photo, PhotoSortOrder } from '../types';
import { WatermarkCanvas } from './WatermarkCanvas';
import { ThemedCameraIcon, ThemedVignetteDivider } from './ThemedCameraIcon';
import { PhotoLightbox } from './PhotoLightbox';
import { PinModal } from './PinModal';
import { FavoriteAuthModal } from './FavoriteAuthModal';
import { downloadGalleryAsZip, downloadSingleCleanPhoto, DownloadProgress } from '../services/zipDownloader';
import { getAccessToken } from '../services/firebase';
import {
  getClientSessionInfo,
  recordDownloadLog,
  recordFavoriteLog,
  removeFavoriteLog,
  isGalleryPinVerifiedInSession,
  setGalleryPinVerifiedInSession,
  getPhotoFavoriteCount,
  getGalleryShareUrl,
  getGalleryExpirationStatus,
} from '../services/storage';

interface GalleryViewProps {
  gallery: Gallery;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
  brandName?: string;
  brandLogoUrl?: string;
  initialPhotoId?: string;
  whatsappNumber?: string;
  lightboxPhotoId?: string | null;
  onOpenLightbox?: (photoId: string) => void;
  onNavigateLightbox?: (photoId: string) => void;
  onCloseLightbox?: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  gallery,
  onBack,
  favorites,
  onToggleFavorite,
  brandName = 'Lente Abierto MX',
  brandLogoUrl,
  initialPhotoId,
  whatsappNumber,
  lightboxPhotoId,
  onOpenLightbox,
  onNavigateLightbox,
  onCloseLightbox,
}) => {
  const [internalSelectedPhotoId, setInternalSelectedPhotoId] = useState<string | null>(initialPhotoId || null);
  const selectedPhotoId = lightboxPhotoId !== undefined ? lightboxPhotoId : internalSelectedPhotoId;

  useEffect(() => {
    if (lightboxPhotoId === undefined) {
      setInternalSelectedPhotoId(initialPhotoId || null);
    }
  }, [gallery.id, initialPhotoId, lightboxPhotoId]);
  const [sortOrder, setSortOrder] = useState<PhotoSortOrder>('default');
  const [randomSeed, setRandomSeed] = useState<number>(() => Date.now());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinActionType, setPinActionType] = useState<'single' | 'full'>('full');
  const [downloadTargetPhoto, setDownloadTargetPhoto] = useState<Photo | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() =>
    isGalleryPinVerifiedInSession(gallery.id)
  );

  // Client Favorites tracking modal
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const [pendingFavPhoto, setPendingFavPhoto] = useState<Photo | null>(null);

  // ZIP download progress
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);

  const expirationStatus = getGalleryExpirationStatus(gallery);
  const isDownloadsExpired = expirationStatus.isExpired;

  const sortedPhotos = useMemo(() => {
    const base = [...gallery.photos];
    if (sortOrder === 'newest') {
      return base
        .map((p, idx) => ({ p, idx }))
        .sort((a, b) => {
          const diff =
            new Date(b.p.dateAdded || 0).getTime() - new Date(a.p.dateAdded || 0).getTime();
          return diff !== 0 ? diff : b.idx - a.idx;
        })
        .map((entry) => entry.p);
    }
    if (sortOrder === 'oldest') {
      return base
        .map((p, idx) => ({ p, idx }))
        .sort((a, b) => {
          const diff =
            new Date(a.p.dateAdded || 0).getTime() - new Date(b.p.dateAdded || 0).getTime();
          return diff !== 0 ? diff : a.idx - b.idx;
        })
        .map((entry) => entry.p);
    }
    if (sortOrder === 'name-asc') {
      return base.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'es', {
          numeric: true,
          sensitivity: 'base',
        })
      );
    }
    if (sortOrder === 'random') {
      // Deterministic Fisher-Yates shuffle keyed by randomSeed so liking/navigating won't re-shuffle
      let state = (randomSeed ^ 0x9e3779b9) >>> 0;
      const nextRand = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(nextRand() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
      }
      return base;
    }
    return base;
  }, [gallery.photos, sortOrder, randomSeed]);

  const displayedPhotos = useMemo(
    () =>
      filterFavoritesOnly
        ? sortedPhotos.filter((p) => favorites.includes(p.id))
        : sortedPhotos,
    [sortedPhotos, filterFavoritesOnly, favorites]
  );

  const selectedPhotoIndex = useMemo(() => {
    if (!selectedPhotoId) return null;
    const idx = displayedPhotos.findIndex((p) => p.id === selectedPhotoId);
    return idx >= 0 ? idx : null;
  }, [selectedPhotoId, displayedPhotos]);

  const handleChangeSortOrder = (nextOrder: PhotoSortOrder) => {
    setSortOrder(nextOrder);
    if (nextOrder === 'random') {
      setRandomSeed((prev) => (prev === Date.now() ? prev + 1 : Date.now()));
    }
  };

  const handleReshuffle = () => {
    setSortOrder('random');
    setRandomSeed((prev) => prev + Math.floor(Math.random() * 10000) + 1);
  };

  const favoriteCountInGallery = gallery.photos.filter((p) => favorites.includes(p.id)).length;

  const handleScrollToPhotos = () => {
    const el = document.getElementById('gallery-photos-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartZipDownload = async () => {
    if (isDownloadsExpired) return;
    try {
      setIsZipDownloading(true);
      const token = await getAccessToken();
      await downloadGalleryAsZip(gallery.photos, gallery.title, token, (progress) => {
        setDownloadProgress(progress);
      });
    } catch (err) {
      console.error('Error al descargar ZIP de galería', err);
    } finally {
      setIsZipDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleDownloadFullClick = () => {
    if (isDownloadsExpired) return;
    const client = getClientSessionInfo();
    const needsPin = gallery.downloadPin && !isPinVerified;

    const hasValidPhone = Boolean(client?.phone && /^\d{10}$/.test(client.phone.trim()));

    if (!client || !client.email?.trim() || !hasValidPhone || needsPin) {
      setPinActionType('full');
      setDownloadTargetPhoto(null);
      setPendingAction(() => handleStartZipDownload);
      setIsPinModalOpen(true);
    } else {
      recordDownloadLog({
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        photoTitle: 'Colección Completa ZIP',
        type: 'zip',
        userName: client.name,
        userEmail: client.email,
        userPhone: client.phone,
      });
      handleStartZipDownload();
    }
  };

  const handleSinglePhotoDownloadClick = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloadsExpired) return;
    const client = getClientSessionInfo();
    const needsPin = gallery.downloadPin && !isPinVerified;

    const action = async () => {
      const token = await getAccessToken();
      await downloadSingleCleanPhoto(photo, gallery.title, token);
    };

    const hasValidPhone = Boolean(client?.phone && /^\d{10}$/.test(client.phone.trim()));

    if (!client || !client.email?.trim() || !hasValidPhone || needsPin) {
      setPinActionType('single');
      setDownloadTargetPhoto(photo);
      setPendingAction(() => action);
      setIsPinModalOpen(true);
    } else {
      recordDownloadLog({
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        photoId: photo.id,
        photoTitle: photo.title || 'Foto Individual',
        photoUrl: photo.url,
        photoThumbnailUrl: photo.thumbnailUrl || photo.url,
        type: 'single',
        userName: client.name,
        userEmail: client.email,
        userPhone: client.phone,
      });
      action();
    }
  };

  const handleRequestPinFromLightbox = (type: 'single', onSuccess: () => void) => {
    setPinActionType(type);
    setDownloadTargetPhoto(
      selectedPhotoIndex !== null ? displayedPhotos[selectedPhotoIndex] || null : null
    );
    setPendingAction(() => onSuccess);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setGalleryPinVerifiedInSession(gallery.id);
    setIsPinVerified(true);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleFavoriteClick = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyFav = favorites.includes(photo.id);
    const client = getClientSessionInfo();

    const hasValidPhone = Boolean(client?.phone && /^\d{10}$/.test(client.phone.trim()));

    if (!isCurrentlyFav && (!client || !client.email?.trim() || !hasValidPhone)) {
      setPendingFavPhoto(photo);
      setIsFavModalOpen(true);
      return;
    }

    onToggleFavorite(photo.id);

    if (!isCurrentlyFav && client) {
      recordFavoriteLog({
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        photoId: photo.id,
        photoTitle: photo.title || 'Foto de Colección',
        photoUrl: photo.url,
        photoThumbnailUrl: photo.thumbnailUrl || photo.url,
        userName: client.name,
        userEmail: client.email,
        userPhone: client.phone,
      });
    } else if (isCurrentlyFav && client) {
      removeFavoriteLog(photo.id, client.email);
    }
  };

  const handleFavAuthSuccess = (client: { name: string; email: string; phone?: string }) => {
    if (pendingFavPhoto) {
      onToggleFavorite(pendingFavPhoto.id);
      recordFavoriteLog({
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        photoId: pendingFavPhoto.id,
        photoTitle: pendingFavPhoto.title || 'Foto de Colección',
        photoUrl: pendingFavPhoto.url,
        photoThumbnailUrl: pendingFavPhoto.thumbnailUrl || pendingFavPhoto.url,
        userName: client.name,
        userEmail: client.email,
        userPhone: client.phone,
      });
      setPendingFavPhoto(null);
    }
  };

  const handleLightboxRequestFav = (photo: Photo) => {
    setPendingFavPhoto(photo);
    setIsFavModalOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(getGalleryShareUrl(gallery));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-200" onContextMenu={(e) => e.preventDefault()}>
      {/* Top Breadcrumb & Quick Actions Bar */}
      <nav className="sticky top-0 z-30 bg-[#0c0d0e]/95 backdrop-blur-md border-b border-white/5 px-3 sm:px-8 py-2.5 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition-colors shrink-0 min-h-[40px] whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Volver al Portafolio</span>
          <span className="sm:hidden font-medium">Volver</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Favorites toggle filter */}
          <button
            onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide flex items-center gap-1.5 border transition-all whitespace-nowrap min-h-[40px] ${
              filterFavoritesOnly
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span className="hidden sm:inline">Favoritos ({favoriteCountInGallery})</span>
            <span className="sm:hidden text-[11px] font-mono tabular-nums">({favoriteCountInGallery})</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Copiar enlace de galería"
            aria-label="Compartir enlace"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Download all button */}
          <button
            onClick={handleDownloadFullClick}
            disabled={isZipDownloading || isDownloadsExpired}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0 whitespace-nowrap min-h-[40px]"
            title={isDownloadsExpired ? 'El periodo de descarga ha finalizado' : 'Descargar colección completa'}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isDownloadsExpired
                ? 'Vigencia Expirada'
                : isZipDownloading
                ? 'Preparando ZIP...'
                : 'Descargar Galería (ZIP)'}
            </span>
            <span className="sm:hidden text-[11px] font-bold">
              {isDownloadsExpired ? 'Expirada' : 'ZIP'}
            </span>
          </button>
        </div>
      </nav>

      {/* Editorial Clean Hero Cover Banner (Full intact photo scaled proportionally for all screens) */}
      <section className="relative w-full overflow-hidden border-b border-white/5 bg-[#0c0d0e]">
        <img
          src={gallery.coverPhotoUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-25 pointer-events-none select-none"
          draggable={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#0c0d0e]/50 via-[#0c0d0e]/35 to-[#0c0d0e]/75 pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-8 py-4 sm:py-6 flex items-center justify-center">
          <img
            src={gallery.coverPhotoUrl}
            alt={gallery.title}
            className="w-auto h-auto max-w-full max-h-[48vh] sm:max-h-[58vh] lg:max-h-[66vh] object-contain rounded-lg sm:rounded-xl shadow-2xl border border-white/10 select-none"
            draggable={false}
          />
        </div>
      </section>

      {/* Editorial Header Band BELOW Cover Image */}
      <header className="bg-[#121316] border-b border-white/5 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Date & Category Kicker */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.22em] text-zinc-400 text-center">
            <span>{gallery.category}</span>
            {gallery.eventDate && (
              <>
                <span aria-hidden="true">·</span>
                <span>{gallery.eventDate}</span>
              </>
            )}
            {gallery.location && (
              <>
                <span aria-hidden="true">·</span>
                <span>{gallery.location}</span>
              </>
            )}
          </div>

          {/* 3-Zone Title Strip (Brand left | Title center | Action right on tablet/desktop, cleanly stacked on mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-5 md:gap-6">
            {/* Left: Studio / Brand Identity */}
            <div className="flex items-center justify-center md:justify-start gap-3 order-2 md:order-1">
              {brandLogoUrl ? (
                <img
                  src={brandLogoUrl}
                  alt={brandName}
                  className="w-8 h-8 rounded-md object-contain shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ThemedCameraIcon variant="camera" size={18} className="text-amber-400" />
                </div>
              )}
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-400 truncate max-w-[200px]">
                {brandName}
              </span>
            </div>

            {/* Center: Main Gallery Title */}
            <h1
              className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-normal leading-[1.15] text-center order-1 md:order-2"
              style={{ textWrap: 'balance' }}
            >
              {gallery.title}
            </h1>

            {/* Right: Scroll to Gallery CTA */}
            <div className="flex items-center justify-center md:justify-end order-3">
              <button
                type="button"
                onClick={handleScrollToPhotos}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all whitespace-nowrap min-h-[40px]"
              >
                Ver galería
              </button>
            </div>
          </div>

          {/* Description & Quiet Unboxed Metadata */}
          <div className="max-w-3xl mx-auto text-center space-y-4 pt-1">
            {gallery.description && (
              <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
                {gallery.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-400 font-sans pt-1">
              {gallery.clientName && (
                <span>
                  Clientes: <strong className="font-medium text-zinc-200">{gallery.clientName}</strong>
                </span>
              )}
              {gallery.clientName && <span aria-hidden="true">·</span>}
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <ThemedCameraIcon variant="camera" size={15} className="text-amber-400" />
                {gallery.photos.length} Fotografías
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                {gallery.viewsCount || 0} {(gallery.viewsCount || 0) === 1 ? 'Vista' : 'Vistas'}
              </span>
              {gallery.downloadPin && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Descarga con PIN
                  </span>
                </>
              )}
              {gallery.watermark.enabled && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Protegida con marca de agua
                  </span>
                </>
              )}
              {expirationStatus.hasExpiration && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      isDownloadsExpired ? 'text-rose-400 font-medium' : ''
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${isDownloadsExpired ? 'text-rose-400' : 'text-amber-400'}`} />
                    {isDownloadsExpired
                      ? `Vigencia finalizada el ${expirationStatus.formattedDate}`
                      : `Descargas disponibles hasta el ${expirationStatus.formattedDate}`}
                  </span>
                </>
              )}
            </div>
          </div>

          <ThemedVignetteDivider variant="shutter" className="pt-2" />
        </div>
      </header>

      {/* ZIP Download Progress Overlay Banner */}
      {isZipDownloading && downloadProgress && (
        <div className="sticky top-16 z-30 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-md px-4 sm:px-8 py-3 text-amber-300 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                Generando archivo ZIP de alta resolución ({downloadProgress.current} de{' '}
                {downloadProgress.total} fotos) - {downloadProgress.currentFileName}
              </span>
            </div>
            <div className="w-full sm:w-48 bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <main id="gallery-photos-grid" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {isDownloadsExpired && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">
                Periodo de descargas finalizado ({expirationStatus.formattedDate})
              </p>
              <p className="text-rose-200/85 mt-0.5 leading-relaxed">
                Puedes seguir explorando las fotografías de muestra en pantalla. Si necesitas reactivar las descargas en alta resolución, ponte en contacto con el estudio.
              </p>
            </div>
          </div>
        )}

        {/* Clean Editorial Action Bar above the photos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-white/5">
          <div className="min-w-0">
            <h2 className="font-editorial text-lg sm:text-xl text-white font-normal truncate">
              {gallery.title}
            </h2>
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 tabular-nums">
              {displayedPhotos.length} de {gallery.photos.length} fotografías
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-400">
            {/* Quick Photo Sort Selector + Random Shuffle */}
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={sortOrder}
                onChange={(e) => handleChangeSortOrder(e.target.value as PhotoSortOrder)}
                aria-label="Ordenar fotografías de la galería"
                className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="default" className="bg-[#121316] text-white">Orden original</option>
                <option value="newest" className="bg-[#121316] text-white">Más recientes</option>
                <option value="oldest" className="bg-[#121316] text-white">Más antiguas</option>
                <option value="name-asc" className="bg-[#121316] text-white">Nombre A–Z</option>
                <option value="random" className="bg-[#121316] text-white">Aleatorio</option>
              </select>
              <button
                type="button"
                onClick={handleReshuffle}
                className={`p-1 rounded-md transition-colors ${
                  sortOrder === 'random'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title="Mezclar fotos en orden aleatorio"
                aria-label="Ordenar aleatoriamente"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
              className={`inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-colors whitespace-nowrap ${
                filterFavoritesOnly ? 'text-rose-400 font-medium bg-rose-500/10' : 'hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>Favoritos ({favoriteCountInGallery})</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFullClick}
              disabled={isZipDownloading || isDownloadsExpired}
              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:text-amber-400 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadsExpired ? 'Descargas expiradas' : 'Descargar ZIP'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:text-white transition-colors whitespace-nowrap"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Enlace copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </>
              )}
            </button>
          </div>
        </div>

        {displayedPhotos.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
            <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-editorial text-zinc-300 mb-1">
              No hay fotos seleccionadas como favoritas
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Haz clic en el corazón de cualquier fotografía para crear tu selección personalizada.
            </p>
            <button
              onClick={() => setFilterFavoritesOnly(false)}
              className="text-xs uppercase tracking-widest text-amber-400 hover:text-amber-300 underline"
            >
              Ver todas las fotografías ({gallery.photos.length})
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
            {displayedPhotos.map((photo) => {
              const isFav = favorites.includes(photo.id);
              const favCount = getPhotoFavoriteCount(photo.id);

              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    if (onOpenLightbox) {
                      onOpenLightbox(photo.id);
                    } else {
                      setInternalSelectedPhotoId(photo.id);
                    }
                  }}
                  className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-xl bg-[#141518] border border-white/5 hover:border-amber-500/30 transition-all duration-300 shadow-lg"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.title}
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-auto object-cover transform transition-transform duration-700 ease-out group-hover:scale-105 protected-photo"
                    />

                    {/* Watermark overlay */}
                    <WatermarkCanvas watermark={gallery.watermark} seed={photo.id} />

                    {/* Anti-copy transparent protector */}
                    <div
                      className="absolute inset-0 z-20 bg-transparent"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />

                    {/* Overlay with Action Buttons (Visible on mobile touch, hover on desktop) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-30 flex flex-col justify-between p-3 sm:p-4 pointer-events-none">
                      {/* Top Action Icons */}
                      <div className="flex items-center justify-between pointer-events-auto">
                        {photo.exif?.camera ? (
                          <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
                            {photo.exif.camera} {photo.exif.aperture ? `· ${photo.exif.aperture}` : ''}
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Heart button with multi-user count */}
                          <button
                            onClick={(e) => handleFavoriteClick(photo, e)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-md transition-all text-xs font-mono shadow-md ${
                              isFav
                                ? 'bg-rose-500 text-white shadow-rose-500/30'
                                : favCount > 0
                                ? 'bg-black/75 text-rose-300 border border-rose-500/40 hover:bg-black/90'
                                : 'bg-black/60 text-white/90 hover:text-white hover:bg-black/80'
                            }`}
                            title={isFav ? 'En tus favoritos' : 'Guardar en Favoritos'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current text-white' : favCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                            {favCount > 0 && <span className="font-bold text-[11px]">{favCount}</span>}
                          </button>

                          {!isDownloadsExpired && (
                            <button
                              onClick={(e) => handleSinglePhotoDownloadClick(photo, e)}
                              className="p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md transition-colors shadow-md"
                              title="Descargar fotografía limpia sin marca"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Photo Title */}
                      <div className="pointer-events-auto">
                        <p className="text-xs sm:text-sm font-editorial tracking-wide text-white drop-shadow">
                          {photo.title}
                        </p>
                        {photo.caption && (
                          <p className="text-[10px] sm:text-[11px] text-zinc-300 line-clamp-1 mt-0.5 font-light">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Gallery Footer Notice */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-sans">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500/60" />
            <span>
              Mostrando {displayedPhotos.length} de {gallery.photos.length} tomas exclusivas de Lente Abierto MX
            </span>
          </div>
          <button
            onClick={handleDownloadFullClick}
            disabled={isDownloadsExpired}
            className="text-amber-400 hover:text-amber-300 tracking-wider uppercase text-[11px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloadsExpired ? 'Descargas expiradas' : 'Descargar colección completa (.zip)'}
          </button>
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          gallery={gallery}
          photos={displayedPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => {
            if (onCloseLightbox) {
              onCloseLightbox();
            } else {
              setInternalSelectedPhotoId(null);
            }
          }}
          onNavigate={(newIdx) => {
            const target = displayedPhotos[newIdx];
            if (target) {
              if (onNavigateLightbox) {
                onNavigateLightbox(target.id);
              } else {
                setInternalSelectedPhotoId(target.id);
              }
            }
          }}
          isFavorite={favorites.includes(displayedPhotos[selectedPhotoIndex]?.id || '')}
          onToggleFavorite={onToggleFavorite}
          onRequestPin={handleRequestPinFromLightbox}
          onRequestFavorite={handleLightboxRequestFav}
          isPinVerified={isPinVerified}
          isExpired={isDownloadsExpired}
          sortOrder={sortOrder}
          onChangeSortOrder={handleChangeSortOrder}
          onReshuffle={handleReshuffle}
        />
      )}

      {/* PIN Verification & Download Registration Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
          setDownloadTargetPhoto(null);
        }}
        expectedPin={gallery.downloadPin || ''}
        galleryId={gallery.id}
        galleryTitle={gallery.title}
        photoId={downloadTargetPhoto?.id}
        photoTitle={downloadTargetPhoto?.title}
        photoUrl={downloadTargetPhoto?.url}
        photoThumbnailUrl={downloadTargetPhoto?.thumbnailUrl || downloadTargetPhoto?.url}
        actionType={pinActionType}
        onSuccess={handlePinSuccess}
        logoUrl={brandLogoUrl}
        brandName={brandName}
        whatsappNumber={whatsappNumber}
      />

      {/* Client Favorites Tracking Modal */}
      <FavoriteAuthModal
        isOpen={isFavModalOpen}
        onClose={() => {
          setIsFavModalOpen(false);
          setPendingFavPhoto(null);
        }}
        onSuccess={handleFavAuthSuccess}
        galleryTitle={gallery.title}
      />
    </div>
  );
};
