import React, { useState, useEffect } from 'react';
import {
  Lock,
  X,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Phone,
  Download,
  AlertCircle,
  FileArchive,
  Camera,
} from 'lucide-react';
import {
  recordDownloadLog,
  getClientSessionInfo,
  setClientSessionInfo,
  setGalleryPinVerifiedInSession,
} from '../services/storage';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedPin?: string;
  galleryId?: string;
  galleryTitle: string;
  photoId?: string;
  photoTitle?: string;
  actionType: 'single' | 'full';
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  expectedPin = '',
  galleryId = '',
  galleryTitle,
  photoId,
  photoTitle,
  actionType,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [isEditingSession, setIsEditingSession] = useState(false);

  const [errorField, setErrorField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedInfo = getClientSessionInfo();
      if (savedInfo && savedInfo.name && savedInfo.email) {
        setName(savedInfo.name || '');
        setEmail(savedInfo.email || '');
        setPhone(savedInfo.phone || '');
        setHasExistingSession(true);
        setIsEditingSession(false);
      } else {
        setHasExistingSession(false);
        setIsEditingSession(true);
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

    // 1. Validate Name
    if (!name.trim() || name.trim().length < 2) {
      setErrorField('name');
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }

    // 2. Validate Email
    if (!email.trim() || !validateEmail(email)) {
      setErrorField('email');
      setErrorMessage('Por favor introduce un correo electrónico válido (ej. usuario@gmail.com).');
      return;
    }

    // 3. Validate PIN if gallery requires it
    const hasPinRequired = expectedPin && expectedPin.trim().length > 0;
    if (hasPinRequired) {
      if (!pin.trim()) {
        setErrorField('pin');
        setErrorMessage('Por favor introduce el código PIN de descarga de la galería.');
        return;
      }
      if (pin.trim() !== expectedPin.trim()) {
        setErrorField('pin');
        setErrorMessage('El PIN de descarga es incorrecto. Solicítalo al fotógrafo @lente.abierto.mx.');
        return;
      }
    }

    // 4. Save client download log in storage for photographer administration
    recordDownloadLog({
      galleryId: galleryId || 'gal-activa',
      galleryTitle,
      photoId,
      photoTitle: photoTitle || (actionType === 'full' ? 'Colección Completa ZIP' : 'Foto Individual'),
      type: actionType === 'full' ? 'zip' : 'single',
      userName: name.trim(),
      userEmail: email.trim().toLowerCase(),
      userPhone: phone.trim() || undefined,
    });

    // 5. Remember client session
    setClientSessionInfo({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
    });

    if (galleryId) {
      setGalleryPinVerifiedInSession(galleryId);
    }

    // 6. Proceed to download
    onSuccess();
    onClose();
  };

  const hasPinRequired = expectedPin && expectedPin.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#111215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-zinc-200">
        {/* Header decoration */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800/60 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {actionType === 'full' ? (
                <FileArchive className="w-6 h-6" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-amber-400/90 font-semibold block">
                Control de Entrega Digital
              </span>
              <h3 className="font-editorial text-2xl font-medium tracking-wide text-white">
                {actionType === 'full' ? 'Descargar Colección Completa (.ZIP)' : 'Descargar Fotografía en Alta Calidad'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-light">
            Para registrar tu descarga de <span className="text-zinc-200 font-medium">"{galleryTitle}"</span> y habilitar la entrega original sin marcas de agua, confirma la información:
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {hasExistingSession && !isEditingSession ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/40">
                    {(name.charAt(0) || 'C').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-xs">{name}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                        Sesión Activa
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono block">{email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingSession(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono tracking-wider uppercase"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                {/* Nombre */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-300 font-medium mb-1.5 flex items-center justify-between">
                    <span>Tu Nombre Completo *</span>
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
                          ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30 bg-red-950/20'
                          : 'border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-300 font-medium mb-1.5 flex items-center justify-between">
                    <span>Correo Electrónico Válido *</span>
                    <span className="text-[10px] text-zinc-500 lowercase">Registro de entrega</span>
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
                          ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30 bg-red-950/20'
                          : 'border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                </div>

                {/* Teléfono */}
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
                      className="w-full bg-[#181a1f] border border-zinc-700 text-sm text-white py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* PIN de descarga (si la galería lo requiere) */}
            {hasPinRequired && (
              <div className="pt-1">
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      PIN de Descarga Requerido
                    </span>
                    <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                      Protegida
                    </span>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (errorField === 'pin') setErrorField(null);
                    }}
                    placeholder="Ingresa el PIN asignado (ej. 2026)"
                    className={`w-full bg-[#121418] border text-center text-base tracking-[0.3em] text-white py-2.5 px-3 rounded-lg focus:outline-none transition-all ${
                      errorField === 'pin'
                        ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
                        : 'border-amber-500/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
                    }`}
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-3 space-y-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-sm rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  {actionType === 'full' ? 'Iniciar Descarga ZIP' : 'Descargar Fotografía .JPG'}
                </span>
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

          <div className="mt-5 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Lente Abierto MX © Entrega certificada y resguardada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
