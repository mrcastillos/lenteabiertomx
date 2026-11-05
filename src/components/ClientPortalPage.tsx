import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { Gallery } from '../types';
import { setGalleryPinVerifiedInSession, setClientSessionInfo, getClientSessionInfo } from '../services/storage';

interface ClientPortalPageProps {
  galleries: Gallery[];
  onSelectGallery: (gallery: Gallery) => void;
  favorites: string[];
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({
  galleries,
  onSelectGallery,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setError(true);
      setErrorMessage('Por favor ingresa la clave PIN privada de tu galería.');
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
      setGalleryPinVerifiedInSession(match.id);
      if (match.clientEmail && !getClientSessionInfo()) {
        setClientSessionInfo({
          name: match.clientName || 'Cliente',
          email: match.clientEmail,
        });
      }
      onSelectGallery(match);
    } else {
      setError(true);
      setErrorMessage(
        'Clave no encontrada o incorrecta. Recuerda que la clave te fue enviada de forma privada por Lente Abierto MX.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-zinc-200">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/20">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl text-white font-normal leading-tight">
          Portal Privado de Clientes
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
          Ingresa la clave PIN privada o el código exclusivo asignado por <span className="text-zinc-200 font-medium">Lente Abierto MX</span> para acceder a tu colección fotográfica.
        </p>
      </div>

      {/* Access Form Card */}
      <div className="max-w-md mx-auto p-7 sm:p-9 rounded-3xl bg-[#121316] border border-white/10 shadow-2xl mb-12">
        <form onSubmit={handleAccess} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-zinc-400 mb-2 font-mono flex items-center justify-between">
              <span>Clave PIN Privada de Galería</span>
              <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Acceso Seguro
              </span>
            </label>
            <input
              type="text"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Ingresa tu clave privada"
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
            <span>Desbloquear Mi Galería</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-[11px] text-zinc-400 space-y-1.5">
          <p>¿Extraviaste tu clave o aún no la recibes?</p>
          <a
            href="https://wa.me/527773743420?text=Hola%20Martín,%20solicito%20la%20clave%20de%20mi%20galería%20en%20Lente%20Abierto%20MX"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Solicitar clave a Martín Castillo por WhatsApp (+52 777 374 3420)</span>
          </a>
        </div>
      </div>

      {/* Security & Client Experience Features (No PINs exposed!) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 border-t border-white/5">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            100% Privado y Confidencial
          </h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
            Tus fotografías no son públicas; solo quienes tienen tu clave PIN pueden verlas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Descargas en Alta Calidad
          </h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
            Descarga individual de fotos en formato .JPG o la galería completa en archivo .ZIP sin marcas de agua.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-2">
            <Heart className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Selección para Álbum
          </h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
            Marca tus fotos favoritas con el corazón ❤️ para que el fotógrafo prepare tu entrega física o retoque.
          </p>
        </div>
      </div>
    </div>
  );
};
