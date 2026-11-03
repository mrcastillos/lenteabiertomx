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
  isPinVerified,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentPhoto = photos[currentIndex];

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
    if (gallery.downloadPin && !isPinVerified) {
      onRequestPin('single', executeDownload);
    } else {
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
              className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(currentPhoto.id)}
            className={`p-2 rounded-full transition-colors ${
              isFavorite
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title={isFavorite ? 'Quitar de Favoritos' : 'Marcar como Favorito'}
            aria-label="Favorito"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Info toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full transition-colors ${
              showInfo ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Datos de Toma & EXIF"
            aria-label="Detalles EXIF"
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

        {/* EXIF / Info Drawer */}
        {showInfo && (
          <aside className="absolute right-4 bottom-4 top-20 w-80 max-w-[90vw] bg-[#121316]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-5 z-40 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn">
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

                {/* Camera & EXIF specs */}
                <div className="pt-2 border-t border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentPhoto.exif?.camera || 'Sony α Series'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentPhoto.exif?.lens || 'Sony G Master Prime'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 rounded-lg text-center font-mono text-[11px] text-zinc-300">
                    <div>
                      <span className="text-[9px] text-zinc-500 block">APERTURA</span>
                      {currentPhoto.exif?.aperture || 'f/1.4'}
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block">VELOCIDAD</span>
                      {currentPhoto.exif?.shutterSpeed || '1/800s'}
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block">SENSIBILIDAD</span>
                      {currentPhoto.exif?.iso || 'ISO 100'}
                    </div>
                  </div>
                </div>

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
