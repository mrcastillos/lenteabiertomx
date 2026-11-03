import React, { useState } from 'react';
import { Lock, X, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedPin: string;
  galleryTitle: string;
  actionType: 'single' | 'full';
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  expectedPin,
  galleryTitle,
  actionType,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError(true);
      setErrorMessage('Por favor introduce el código PIN de descarga.');
      return;
    }

    if (pin.trim() === expectedPin.trim()) {
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
      setErrorMessage('PIN incorrecto. Verifica el código entregado por Lente Abierto MX.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121316] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center text-zinc-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800/60 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h3 className="font-editorial text-2xl sm:text-3xl font-medium tracking-wide text-white mb-2">
          PIN de Descarga
        </h3>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 font-light">
          Para descargar {actionType === 'full' ? 'la galería completa en alta resolución (.ZIP)' : 'esta fotografía original limpia y sin marcas de agua'}, ingresa la clave PIN asignada para{' '}
          <span className="text-zinc-200 font-medium">"{galleryTitle}"</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Ingresa tu PIN (ej. 2026)"
              className={`w-full bg-[#181a1f] border text-center text-lg tracking-[0.35em] text-white py-3.5 pl-10 pr-4 rounded-xl focus:outline-none transition-all ${
                error
                  ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30 bg-red-950/20'
                  : 'border-zinc-700 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20'
              }`}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-normal tracking-wide animate-pulse">
              {errorMessage}
            </p>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-sm rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20"
            >
              Desbloquear y Descargar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs tracking-wider uppercase text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Protección de derechos fotográficos © Lente Abierto MX</span>
        </div>
      </div>
    </div>
  );
};
