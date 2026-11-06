import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Heart,
  Info,
  Maximize2,
  Minimize2,
  Camera,
  Layers,
  Lock,
  Share2,
  Check,
} from 'lucide-react';
import { Photo, Gallery } from '../types';
import { WatermarkCanvas } from './WatermarkCanvas';
import { downloadSingleCleanPhoto } from '../services/zipDownloader';
import { getAccessToken } from '../services/firebase';
import {
  getClientSessionInfo,
  recordDownloadLog,
  recordFavoriteLog,
  removeFavoriteLog,
  isGalleryPinVerifiedInSession,
  getPhotoFavoriteCount,
} from '../services/storage';

interface PhotoLightboxProps {
  gallery: Gallery;
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (photoId: string) => void;
  onRequestPin: (actionType: 'single', onSuccess: () => void) => void;
  onRequestFavorite?: (photo: Photo) => void;
  isPinVerified: boolean;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  gallery,
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  isFavorite,
  onToggleFavorite,
  onRequestPin,
  onRequestFavorite,
  isPinVerified,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentPhoto = photos[currentIndex];
  const favCount = currentPhoto ? getPhotoFavoriteCount(currentPhoto.id) : 0;

  const handleToggleFavClick = () => {
    const client = getClientSessionInfo();
    if (!isFavorite && !client) {
      if (onRequestFavorite) {
        onRequestFavorite(currentPhoto);
        return;
      }
    }
    onToggleFavorite(currentPhoto.id);
    if (!isFavorite && client) {
      recordFavoriteLog({
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        photoId: currentPhoto.id,
        photoTitle: currentPhoto.title || 'Foto de Colección',
        photoUrl: currentPhoto.url,
        photoThumbnailUrl: currentPhoto.thumbnailUrl || currentPhoto.url,
        userName: client.name,
        userEmail: client.email,
        userPhone: client.phone,
      });
    } else if (isFavorite && client) {
      removeFavoriteLog(currentPhoto.id, client.email);
    }
  };

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(photos.length - 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Prevent scroll when lightbox open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const executeDownload = async () => {
    try {
      setIsDownloading(true);
      const token = await getAccessToken();
      await downloadSingleCleanPhoto(currentPhoto, gallery.title, token);
    } catch (err) {
      console.error('Error downloading clean photo', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    const client = getClientSessionInfo();
    const pinVerified = isPinVerified || isGalleryPinVerifiedInSession(gallery.id);
    if (!client || (gallery.downloadPin && !pinVerified)) {
      onRequestPin('single', executeDownload);
    } else {
      recordDownloadLog({
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        photoId: currentPhoto.id,
        photoTitle: currentPhoto.title || 'Foto Individual',
        type: 'single',
        userName: client.name,
        userEmail: client.email,
        userPhone: client.phone,
      });
      executeDownload();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#08090a] text-zinc-100 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Bar */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <span className="font-editorial text-lg tracking-[0.15em] text-zinc-300 hidden sm:inline">
            {gallery.title}
          </span>
          <span className="text-xs tracking-widest text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full font-mono">
            {currentIndex + 1} / {photos.length}
          </span>
          {gallery.downloadPin && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1 ${
                isPinVerified
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              <Lock className="w-3 h-3" />
              {isPinVerified ? 'PIN Verificado' : 'PIN Requerido'}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Favorite button with count */}
          <button
            onClick={handleToggleFavClick}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all text-xs font-mono ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : favCount > 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title={isFavorite ? 'En tus favoritos' : 'Guardar en Favoritos'}
            aria-label="Favorito"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-white' : favCount > 0 ? 'fill-rose-400 text-rose-400' : ''}`} />
            {favCount > 0 && <span className="font-bold text-[11px]">{favCount}</span>}
          </button>

          {/* Info toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full transition-colors ${
              showInfo ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Datos de Toma"
            aria-label="Detalles de toma"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copiar enlace"
            aria-label="Compartir"
          >
            {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:inline-flex"
            title="Pantalla Completa"
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Download Clean Button */}
          <button
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            title="Descargar fotografía limpia sin marca de agua"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isDownloading ? 'Descargando...' : 'Descargar Original'}
            </span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 ml-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Cerrar visor"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Photo View Area */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-3 sm:left-6 z-30 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-sm border border-white/10 transition-all hover:scale-105"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 sm:right-6 z-30 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-sm border border-white/10 transition-all hover:scale-105"
          aria-label="Foto siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Photo Container with Protection Layer and Watermark */}
        <div className="relative max-w-full max-h-[82vh] flex items-center justify-center">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-[80vh] max-w-[92vw] object-contain select-none shadow-2xl rounded-sm protected-photo"
          />

          {/* Watermark overlay (only visible in viewer, never on downloaded file!) */}
          <WatermarkCanvas watermark={gallery.watermark} />

          {/* Invisible Anti-Drag & Right-Click Interceptor Layer */}
          <div
            className="absolute inset-0 z-20 cursor-default bg-transparent"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>

        {/* EXIF / Info Drawer (Bottom-sheet on mobile, floating panel on desktop) */}
        {showInfo && (
          <aside className="absolute w-full sm:w-85 inset-x-0 bottom-0 top-auto sm:inset-x-auto sm:right-4 sm:bottom-4 sm:top-20 max-h-[85vh] bg-[#121316]/95 border border-white/10 backdrop-blur-xl rounded-t-3xl sm:rounded-2xl p-5 z-40 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h4 className="font-editorial text-lg tracking-wider text-amber-300 font-medium">
                  Ficha Técnica
                </h4>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[10px] block mb-1">
                    Título de la Obra
                  </span>
                  <p className="text-zinc-200 font-medium text-sm">{currentPhoto.title}</p>
                  {currentPhoto.caption && (
                    <p className="text-zinc-400 mt-1 leading-relaxed">{currentPhoto.caption}</p>
                  )}
                </div>

                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[10px] block mb-1">
                    Colección
                  </span>
                  <p className="text-zinc-300">{gallery.title}</p>
                </div>

                {gallery.location && (
                  <div>
                    <span className="text-zinc-500 uppercase tracking-widest text-[10px] block mb-1">
                      Ubicación
                    </span>
                    <p className="text-zinc-300">{gallery.location}</p>
                  </div>
                )}

                {/* Favorite count indicator */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300 text-xs font-mono">
                  <Heart className={`w-3.5 h-3.5 ${favCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-zinc-500'}`} />
                  <span>
                    {favCount > 0
                      ? `${favCount} ${favCount === 1 ? 'cliente la guardó en favoritos' : 'clientes la guardaron en favoritos'}`
                      : 'Aún sin favoritos guardados'}
                  </span>
                </div>

                {/* Camera & EXIF specs - ONLY rendered if genuine camera metadata exists on photo */}
                {currentPhoto.exif?.camera && (
                  <div className="pt-2 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentPhoto.exif.camera}</span>
                    </div>
                    {currentPhoto.exif.lens && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentPhoto.exif.lens}</span>
                      </div>
                    )}
                    {(currentPhoto.exif.aperture || currentPhoto.exif.shutterSpeed || currentPhoto.exif.iso) && (
                      <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 rounded-lg text-center font-mono text-[11px] text-zinc-300">
                        {currentPhoto.exif.aperture && (
                          <div>
                            <span className="text-[9px] text-zinc-500 block">APERTURA</span>
                            {currentPhoto.exif.aperture}
                          </div>
                        )}
                        {currentPhoto.exif.shutterSpeed && (
                          <div>
                            <span className="text-[9px] text-zinc-500 block">VELOCIDAD</span>
                            {currentPhoto.exif.shutterSpeed}
                          </div>
                        )}
                        {currentPhoto.exif.iso && (
                          <div>
                            <span className="text-[9px] text-zinc-500 block">SENSIBILIDAD</span>
                            {currentPhoto.exif.iso}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
                  Esta fotografía visualizada en pantalla cuenta con marca de agua protectora. Al descargarla obtendrás el archivo original en resolución nativa sin marcas de agua.
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadClick}
              className="mt-4 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar Archivo Original
            </button>
          </aside>
        )}
      </div>

      {/* Bottom Thumbnail Filmstrip */}
      <footer className="h-20 px-4 bg-black/70 backdrop-blur-md border-t border-white/5 flex items-center justify-center overflow-x-auto gap-2.5 py-2">
        {photos.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => onNavigate(idx)}
            className={`relative flex-shrink-0 h-14 w-20 rounded-md overflow-hidden transition-all ${
              idx === currentIndex
                ? 'ring-2 ring-amber-400 scale-105 opacity-100'
                : 'opacity-40 hover:opacity-80'
            }`}
          >
            <img
              src={p.thumbnailUrl || p.url}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </button>
        ))}
      </footer>
    </div>
  );
};
