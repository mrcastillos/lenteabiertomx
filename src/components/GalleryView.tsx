import React, { useState } from 'react';
import {
  Download,
  Share2,
  Calendar,
  MapPin,
  Heart,
  ArrowLeft,
  Lock,
  Check,
  ShieldCheck,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Gallery, Photo } from '../types';
import { WatermarkCanvas } from './WatermarkCanvas';
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
} from '../services/storage';

interface GalleryViewProps {
  gallery: Gallery;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  gallery,
  onBack,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
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

  const displayedPhotos = filterFavoritesOnly
    ? gallery.photos.filter((p) => favorites.includes(p.id))
    : gallery.photos;

  const handleStartZipDownload = async () => {
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
    const client = getClientSessionInfo();
    const needsPin = gallery.downloadPin && !isPinVerified;

    if (!client || needsPin) {
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
    const client = getClientSessionInfo();
    const needsPin = gallery.downloadPin && !isPinVerified;

    const action = async () => {
      const token = await getAccessToken();
      await downloadSingleCleanPhoto(photo, gallery.title, token);
    };

    if (!client || needsPin) {
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

    if (!isCurrentlyFav && !client) {
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
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100" onContextMenu={(e) => e.preventDefault()}>
      {/* Top Breadcrumb & Bar */}
      <nav className="sticky top-0 z-30 bg-[#0c0d0e]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Portafolio</span>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Favorites toggle filter */}
          <button
            onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-1.5 border transition-all ${
              filterFavoritesOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-rose-400' : ''}`} />
            <span>Favoritos ({gallery.photos.filter((p) => favorites.includes(p.id)).length})</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Compartir enlace de galería"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Download all button */}
          <button
            onClick={handleDownloadFullClick}
            disabled={isZipDownloading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isZipDownloading ? 'Preparando ZIP...' : 'Descargar Galería (ZIP)'}
            </span>
            <span className="sm:hidden">ZIP</span>
          </button>
        </div>
      </nav>

      {/* Hero Cover Header */}
      <header className="relative w-full h-[55vh] min-h-[380px] max-h-[560px] overflow-hidden flex items-end">
        <img
          src={gallery.coverPhotoUrl}
          alt={gallery.title}
          className="absolute inset-0 w-full h-full object-cover select-none brightness-75 scale-105 transition-transform duration-1000"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0e] via-[#0c0d0e]/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pb-12 w-full">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                {gallery.category}
              </span>
              {gallery.downloadPin && (
                <span className="text-[11px] font-sans flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-zinc-300 border border-white/10">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Descargas protegidas con PIN
                </span>
              )}
              {gallery.watermark.enabled && (
                <span className="text-[11px] font-sans flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-zinc-300 border border-white/10">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Muestra con Marca de Agua
                </span>
              )}
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-normal leading-[1.1] mb-3">
              {gallery.title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed mb-4 max-w-2xl">
              {gallery.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-400 font-sans">
              {gallery.clientName && (
                <span className="font-medium text-zinc-200">Clientes: {gallery.clientName}</span>
              )}
              {gallery.eventDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {gallery.eventDate}
                </span>
              )}
              {gallery.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {gallery.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                {gallery.photos.length} Fotografías
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ZIP Download Progress Overlay Banner */}
      {isZipDownloading && downloadProgress && (
        <div className="sticky top-16 z-30 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-md px-4 sm:px-8 py-3 text-amber-200 text-xs">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
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
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {displayedPhotos.map((photo) => {
              const photoIndex = gallery.photos.findIndex((p) => p.id === photo.id);
              const isFav = favorites.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(photoIndex)}
                  className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-lg bg-[#141518] border border-white/5 hover:border-amber-500/30 transition-all duration-300 shadow-lg"
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
                    <WatermarkCanvas watermark={gallery.watermark} />

                    {/* Anti-copy transparent protector */}
                    <div
                      className="absolute inset-0 z-20 bg-transparent"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />

                    {/* Hover Overlay with Action Buttons */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex flex-col justify-between p-4">
                      {/* Top Action Icons */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
                          {photo.exif?.aperture || 'f/1.4'} · {photo.exif?.camera?.split(' ')[1] || 'Sony'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleFavoriteClick(photo, e)}
                            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                              isFav
                                ? 'bg-rose-500 text-white'
                                : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80'
                            }`}
                            title={isFav ? 'Quitar de Favoritos' : 'Guardar en Favoritos'}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={(e) => handleSinglePhotoDownloadClick(photo, e)}
                            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md transition-colors"
                            title="Descargar fotografía limpia sin marca"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Photo Title */}
                      <div>
                        <p className="text-sm font-editorial tracking-wide text-white drop-shadow">
                          {photo.title}
                        </p>
                        {photo.caption && (
                          <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5 font-light">
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
            className="text-amber-400 hover:text-amber-300 tracking-wider uppercase text-[11px] flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar colección completa (.zip)
          </button>
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          gallery={gallery}
          photos={gallery.photos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
          isFavorite={favorites.includes(gallery.photos[selectedPhotoIndex]?.id || '')}
          onToggleFavorite={onToggleFavorite}
          onRequestPin={handleRequestPinFromLightbox}
          onRequestFavorite={handleLightboxRequestFav}
          isPinVerified={isPinVerified}
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
        actionType={pinActionType}
        onSuccess={handlePinSuccess}
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
