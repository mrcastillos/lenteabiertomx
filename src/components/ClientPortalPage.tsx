import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Camera, Heart, CheckCircle2 } from 'lucide-react';
import { Gallery } from '../types';

interface ClientPortalPageProps {
  galleries: Gallery[];
  onSelectGallery: (gallery: Gallery) => void;
  favorites: string[];
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({
  galleries,
  onSelectGallery,
  favorites,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setError(true);
      setErrorMessage('Por favor ingresa la clave de tu galería.');
      return;
    }

    // Match gallery by accessPin (PIN de apertura de la galería) or downloadPin or clientEmail or slug
    const match = galleries.find(
      (g) =>
        (g.accessPin && g.accessPin.toLowerCase() === cleanPin.toLowerCase()) ||
        (g.downloadPin && g.downloadPin.toLowerCase() === cleanPin.toLowerCase()) ||
        (g.clientEmail && g.clientEmail.toLowerCase() === cleanPin.toLowerCase()) ||
        g.slug.toLowerCase().includes(cleanPin.toLowerCase()) ||
        g.id.toLowerCase() === cleanPin.toLowerCase() ||
        (g.clientName && g.clientName.toLowerCase().includes(cleanPin.toLowerCase()))
    );

    if (match) {
      setError(false);
      onSelectGallery(match);
    } else {
      setError(true);
      setErrorMessage('No encontramos ninguna galería asociada a esa clave o PIN. Verifica tu correo de entrega o escribe a casm830903@gmail.com.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-zinc-200">
      <div className="text-center max-w-xl mx-auto mb-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl text-white font-normal leading-tight">
          Portal Exclusivo de Clientes
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
          Ingresa la clave PIN o el nombre de tu colección asignado por Lente Abierto MX para ingresar directamente a tu galería privada.
        </p>
      </div>

      {/* Access Form */}
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#121316] border border-white/5 shadow-2xl mb-16">
        <form onSubmit={handleAccess} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-mono">
              Clave de Acceso / PIN de Galería
            </label>
            <input
              type="text"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Ej. 2026 ó sofia"
              className={`w-full bg-[#181a1f] border text-center text-lg tracking-[0.25em] text-white py-3.5 px-4 rounded-xl focus:outline-none transition-all ${
                error
                  ? 'border-red-500/80 bg-red-950/20'
                  : 'border-zinc-700 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20'
              }`}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center animate-pulse">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <span>Acceder a Mi Galería</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-[11px] text-zinc-500 space-y-1">
          <p>¿No recuerdas tu clave de entrega?</p>
          <a
            href="https://wa.me/527773743420"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:underline"
          >
            Contactar al fotógrafo por WhatsApp (+52 777 374 3420)
          </a>
        </div>
      </div>

      {/* Available Client Collections Quick Access */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h3 className="font-editorial text-xl text-zinc-200">Colecciones de Clientes Registradas</h3>
          <span className="text-xs text-zinc-500 font-mono">Claves de demostración</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {galleries.slice(0, 4).map((g) => (
            <div
              key={g.id}
              onClick={() => onSelectGallery(g)}
              className="p-4 rounded-xl bg-[#141518] border border-white/5 hover:border-amber-500/30 cursor-pointer flex items-center gap-3.5 group transition-colors"
            >
              <img
                src={g.coverPhotoUrl}
                alt=""
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-editorial text-base text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                  {g.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 mt-1">
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Apertura: {g.accessPin || g.downloadPin || 'Libre'}
                  </span>
                  <span className="font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Descarga: {g.downloadPin || 'Libre'}
                  </span>
                  <span>·</span>
                  <span>{g.photos.length} fotos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
