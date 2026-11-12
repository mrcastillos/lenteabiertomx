import React from 'react';
import { Camera, Instagram, Mail, Phone, MapPin, Shield, Heart } from 'lucide-react';
import { SiteContentConfig } from '../types';
import { DEFAULT_SITE_CONTENT } from '../services/storage';

interface FooterProps {
  onSelectTab: (tab: 'galleries' | 'biography' | 'contact' | 'portal' | 'admin' | 'profile') => void;
  onOpenAdminAuth: () => void;
  isAdmin: boolean;
  contactConfig?: SiteContentConfig['contact'];
  generalConfig?: SiteContentConfig['general'];
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenAdminAuth,
  isAdmin,
  contactConfig = DEFAULT_SITE_CONTENT.contact,
  generalConfig,
}) => {
  const contact = contactConfig || DEFAULT_SITE_CONTENT.contact;
  const whatsappNumber = (contact.whatsapp || contact.phone || '527773743420').replace(/[^0-9]/g, '');
  const igHandle = contact.instagramHandle || '@lente.abierto.mx';
  const igUrl = `https://instagram.com/${igHandle.replace('@', '')}`;

  return (
    <footer className="border-t border-white/5 bg-[#090a0c] text-zinc-400 font-sans text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-amber-400/40 flex items-center justify-center bg-amber-400/10 overflow-hidden">
                {generalConfig?.logoIconUrl ? (
                  <img src={generalConfig.logoIconUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <span className="font-editorial text-2xl tracking-[0.2em] font-medium text-white uppercase">
                {generalConfig?.brandName || 'Lente Abierto MX'}
              </span>
            </div>
            <p className="text-zinc-400 font-light leading-relaxed max-w-md text-sm">
              Plataforma de portafolio y entrega de galerías fotográficas de alta fidelidad estilo Pixieset.
              Capturando la luz, arquitectura y autenticidad del México contemporáneo con respeto visual y técnica editorial.
            </p>
            <div className="flex items-center gap-4 pt-2 text-zinc-300">
              <a
                href={igUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-rose-400 transition-colors"
                aria-label={`Instagram ${igHandle}`}
                title={igHandle}
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-amber-400 transition-colors"
                aria-label={`Correo ${contact.email}`}
                title={contact.email}
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-emerald-400 transition-colors"
                aria-label={`WhatsApp ${contact.phone}`}
                title={contact.phone}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Instagram: <a href={igUrl} target="_blank" rel="noreferrer" className="text-amber-400/90 hover:underline">{igHandle}</a> · Tel: {contact.phone}
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h5 className="font-editorial text-base text-zinc-200 tracking-wider uppercase font-semibold">
              Explorar
            </h5>
            <ul className="space-y-2 text-zinc-400 text-xs tracking-wider uppercase">
              <li>
                <button
                  onClick={() => onSelectTab('galleries')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Todas las Galerías
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('biography')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Biografía & Filosofía
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('portal')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Portal de Clientes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('contact')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Cotizaciones & Agenda
                </button>
              </li>
              <li>
                {isAdmin ? (
                  <button
                    onClick={() => onSelectTab('admin')}
                    className="hover:text-amber-400 transition-colors text-amber-500/80 flex items-center gap-1"
                  >
                    <span>Panel Backend (Activo)</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenAdminAuth}
                    className="hover:text-amber-400 transition-colors text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                  >
                    <span>Acceso Fotógrafo (Admin)</span>
                  </button>
                )}
              </li>
            </ul>
          </div>

          {/* Details / Location */}
          <div className="space-y-3">
            <h5 className="font-editorial text-base text-zinc-200 tracking-wider uppercase font-semibold">
              Estudio & Cobertura
            </h5>
            <div className="space-y-2 text-xs text-zinc-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Roma Norte, CDMX / Oaxaca / San Miguel de Allende & Destinos Internacionales</span>
              </p>
              <p className="flex items-center gap-2 pt-2">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Descargas seguras protegidas con PIN & Marcas de agua</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} Lente Abierto MX. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <span>Hecho con dedicación para fotografía de alta fidelidad</span>
            <Heart className="w-3 h-3 text-amber-500 fill-amber-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};
