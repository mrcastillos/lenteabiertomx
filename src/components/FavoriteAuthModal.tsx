import React, { useState, useEffect } from 'react';
import { Heart, X, User, Mail, Phone, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { getClientSessionInfo, setClientSessionInfo } from '../services/storage';

interface FavoriteAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clientInfo: { name: string; email: string; phone?: string }) => void;
  galleryTitle?: string;
}

export const FavoriteAuthModal: React.FC<FavoriteAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  galleryTitle = 'la galería',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorField, setErrorField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = getClientSessionInfo();
      if (saved) {
        setName(saved.name || '');
        setEmail(saved.email || '');
        setPhone(saved.phone || '');
      }
      setErrorField(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorField(null);
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorField('name');
      setErrorMessage('Por favor introduce tu nombre.');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      setErrorField('email');
      setErrorMessage('Por favor introduce un correo electrónico válido.');
      return;
    }

    const info = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
    };

    setClientSessionInfo(info);
    onSuccess(info);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121316] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-zinc-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800/60 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/30">
          <Heart className="w-7 h-7 fill-rose-500 text-rose-500" />
        </div>

        <h3 className="font-editorial text-2xl sm:text-3xl text-center font-medium tracking-wide text-white mb-2">
          Guardar en Tus Favoritas
        </h3>

        <p className="text-xs text-center text-zinc-400 leading-relaxed mb-6 font-light">
          Identifícate para que <span className="text-zinc-200 font-medium">Martín Castillo (@lente.abierto.mx)</span> reciba la selección de tus fotos preferidas de <span className="text-zinc-200 font-medium">"{galleryTitle}"</span> para tu álbum físico, impresiones o retoque.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-300 font-medium mb-1.5 flex items-center justify-between">
              <span>Tu Nombre *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorField === 'name') setErrorField(null);
                }}
                placeholder="Ej. Sofía Morales"
                className={`w-full bg-[#181a1f] border text-sm text-white py-2.5 pl-10 pr-4 rounded-xl focus:outline-none transition-all ${
                  errorField === 'name'
                    ? 'border-red-500/80 bg-red-950/20'
                    : 'border-zinc-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-300 font-medium mb-1.5 flex items-center justify-between">
              <span>Correo Electrónico Válido *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorField === 'email') setErrorField(null);
                }}
                placeholder="cliente@ejemplo.com"
                className={`w-full bg-[#181a1f] border text-sm text-white py-2.5 pl-10 pr-4 rounded-xl focus:outline-none transition-all ${
                  errorField === 'email'
                    ? 'border-red-500/80 bg-red-950/20'
                    : 'border-zinc-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
              <span>Teléfono / WhatsApp</span>
              <span className="text-[10px] text-zinc-500">Opcional</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 777 000 0000"
                className="w-full bg-[#181a1f] border border-zinc-700 text-sm text-white py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Guardar Mi Selección</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs tracking-wider uppercase text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
