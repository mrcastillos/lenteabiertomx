import React, { useState } from 'react';
import { Lock, Camera, Search, MapPin, Calendar, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Gallery, SiteContentConfig } from '../types';
import { getStoredCategories, DEFAULT_SITE_CONTENT } from '../services/storage';

interface GalleryGridProps {
  galleries: Gallery[];
  onSelectGallery: (gallery: Gallery) => void;
  onOpenPortal: () => void;
  heroConfig?: SiteContentConfig['hero'];
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  galleries,
  onSelectGallery,
  onOpenPortal,
  heroConfig = DEFAULT_SITE_CONTENT.hero,
}) => {
  const hero = heroConfig || DEFAULT_SITE_CONTENT.hero;
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const dynamicCategories = ['Todas', ...getStoredCategories()];

  // Only show public galleries on the main public portfolio, private ones are accessed in Client Portal!
  const filtered = galleries.filter((g) => {
    // If it's explicitly marked as private, keep it exclusive to the Client Portal unless searched by name
    if (g.isPrivate && !searchQuery.trim()) {
      return false;
    }
    const matchesCategory = selectedCategory === 'Todas' || g.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      g.title.toLowerCase().includes(q) ||
      (g.clientName && g.clientName.toLowerCase().includes(q)) ||
      (g.location && g.location.toLowerCase().includes(q)) ||
      (g.category && g.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      {/* Editorial Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        {hero.badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{hero.badge}</span>
          </div>
        )}
        <h1 className="font-editorial text-3xl sm:text-5xl md:text-6xl text-white font-normal leading-[1.15] tracking-tight">
          {hero.title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
          {hero.subtitle}
        </p>

        {/* Client Access Callout */}
        <div className="pt-2">
          <button
            onClick={onOpenPortal}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-300 hover:text-amber-400 py-2 px-4 rounded-full bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{hero.clientPortalCta || '¿Eres cliente? Accede a tu galería privada con tu PIN'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-white/5">
        {/* Category Pills - Smooth horizontal scrolling on mobile, centered wrap on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none sm:flex-wrap sm:justify-center -mx-4 px-4 sm:mx-0 sm:px-0">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 flex-shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por boda, lugar o cliente..."
            className="w-full bg-[#141518] border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Galleries Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-editorial text-zinc-300 mb-1">
            No se encontraron galerías
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Intenta con otro filtro de categoría o término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Todas');
              setSearchQuery('');
            }}
            className="text-xs uppercase tracking-widest text-amber-400 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((gallery) => (
            <article
              key={gallery.id}
              onClick={() => onSelectGallery(gallery)}
              className="group cursor-pointer flex flex-col bg-[#121316] rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-black/60"
            >
              {/* Cover Thumbnail / Principal Icon of the Folder */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                <img
                  src={gallery.coverPhotoUrl}
                  alt={gallery.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                    {gallery.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {gallery.downloadPin && (
                      <span
                        className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 border border-white/10"
                        title="Descarga protegida con PIN"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {gallery.watermark.enabled && (
                      <span
                        className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-emerald-400 border border-white/10"
                        title="Marca de agua activa"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo counter overlay */}
                <div className="absolute bottom-3 right-3 z-10">
                  <span className="text-[11px] font-mono tracking-wider px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-amber-400" />
                    {gallery.photos.length} fotos
                  </span>
                </div>
              </div>

              {/* Gallery Info Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-editorial text-2xl text-white font-normal group-hover:text-amber-300 transition-colors leading-snug mb-2">
                    {gallery.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed mb-4">
                    {gallery.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="space-y-0.5">
                    {gallery.clientName && (
                      <span className="block text-zinc-300 font-medium">{gallery.clientName}</span>
                    )}
                    {gallery.location && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <MapPin className="w-3 h-3 text-amber-400/80" />
                        {gallery.location}
                      </span>
                    )}
                  </div>

                  <span className="text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 uppercase tracking-widest text-[10px] font-semibold">
                    Abrir <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
