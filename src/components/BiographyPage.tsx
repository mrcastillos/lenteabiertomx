import React from 'react';
import { Camera, Award, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { SiteContentConfig } from '../types';
import { DEFAULT_SITE_CONTENT } from '../services/storage';

interface BiographyPageProps {
  onContactClick: () => void;
  biography?: SiteContentConfig['biography'];
}

export const BiographyPage: React.FC<BiographyPageProps> = ({
  onContactClick,
  biography = DEFAULT_SITE_CONTENT.biography,
}) => {
  const bio = biography || DEFAULT_SITE_CONTENT.biography;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-zinc-200">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src={bio.portraitUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85'}
              alt={`${bio.photographerName} - Lente Abierto MX`}
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <p className="font-editorial text-2xl text-white font-medium">{bio.photographerName}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400 mt-1">
                {bio.tagline}
              </p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden sm:block p-4 rounded-xl bg-[#141518] border border-white/10 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-white">{bio.experienceYears}</p>
                <p className="text-[10px] text-zinc-400">{bio.experienceSubtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biografía Profesional & Declaración Artística</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-white font-normal leading-[1.1]">
            "{bio.quote}"
          </h1>

          <p className="text-base text-zinc-300 font-light leading-relaxed">
            {bio.introParagraph}
          </p>

          <p className="text-sm text-zinc-400 font-light leading-relaxed whitespace-pre-line">
            {bio.detailedBio}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {bio.locationText}
            </span>
            {bio.badges && bio.badges.map((badge, idx) => (
              <React.Fragment key={idx}>
                <span>·</span>
                <span>{badge}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={onContactClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-semibold text-xs tracking-widest uppercase transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Consultar Disponibilidad & Agenda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Philosophy Pillars */}
      {bio.principles && bio.principles.length > 0 && (
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-editorial text-3xl sm:text-4xl text-white font-normal mb-3">
              Principios Inviolables de Fotografía
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              El estándar estético y ético que define cada captura en Lente Abierto MX.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bio.principles.map((pr, index) => (
              <div key={index} className="p-8 rounded-2xl bg-[#121316] border border-white/5 space-y-3">
                <span className="font-editorial text-3xl text-amber-400 font-semibold block">{pr.number || `0${index + 1}`}</span>
                <h3 className="font-editorial text-2xl text-white">{pr.title}</h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  {pr.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment & Technical Arsenal */}
      {bio.gear && bio.gear.length > 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#121316] border border-white/5 mb-24">
          <div className="max-w-3xl mb-8">
            <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest mb-2 font-mono">
              <Camera className="w-4 h-4" />
              <span>Equipo & Tecnologías de Alta Gama</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-white font-normal mb-3">
              Garantía Técnica para Entregas de Máxima Calidad
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
              Para garantizar nitidez de galería, rango dinámico extendido y seguridad total en eventos irrepetibles, trabajamos exclusivamente con doble ranura de memoria en vivo y equipos insignia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bio.gear.map((g, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-black/40 border border-white/5">
                <h4 className="text-xs uppercase font-mono tracking-wider text-amber-400 mb-2">{g.title}</h4>
                <ul className="text-xs text-zinc-300 space-y-1.5 font-light">
                  {g.items.map((it, itemIdx) => (
                    <li key={itemIdx}>• {it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications / Testimonials Bar */}
      {bio.publications && bio.publications.length > 0 && (
        <div className="text-center border-t border-white/5 pt-12">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 block mb-6">
            Publicado y Reconocido en
          </span>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-70 font-editorial text-xl sm:text-2xl tracking-[0.2em] uppercase text-zinc-300">
            {bio.publications.map((pub, idx) => (
              <React.Fragment key={idx}>
                <span>{pub}</span>
                {idx < bio.publications.length - 1 && <span>·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
