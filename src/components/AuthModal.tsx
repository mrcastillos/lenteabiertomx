import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import { UserProfile } from '../types';
import { loginUser, registerUser, authenticateHiddenSuperAdmin, setAdminLoggedIn, setSuperAdminLoggedIn } from '../services/userService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onSuperAdminSuccess?: () => void;
  logoUrl?: string;
  brandName?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSuperAdminSuccess,
  logoUrl,
  brandName,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'fotografo' | 'cliente'>('cliente');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email) {
          setError('Por favor introduce tu correo electrónico o usuario.');
          setIsLoading(false);
          return;
        }
        // Check silent hidden Super Admin access
        if (authenticateHiddenSuperAdmin(email, password)) {
          setAdminLoggedIn(true);
          setSuperAdminLoggedIn(true);
          setEmail('');
          setPassword('');
          if (onSuperAdminSuccess) onSuperAdminSuccess();
          onClose();
          return;
        }
        const user = loginUser(email, password);
        setEmail('');
        setPassword('');
        onSuccess(user);
        onClose();
      } else {
        if (!name.trim() || !email.trim()) {
          setError('Por favor completa tu nombre y correo electrónico.');
          setIsLoading(false);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
          setError('Por favor introduce un correo electrónico válido.');
          setIsLoading(false);
          return;
        }
        if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
          setError('Por favor introduce un número de teléfono o WhatsApp válido (mínimo 10 dígitos).');
          setIsLoading(false);
          return;
        }
        const newUser = registerUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          phone: phone.trim(),
          whatsapp: whatsapp || phone.trim(),
          instagram,
          bio,
          detailedBio: `${name.trim()} - ${role === 'fotografo' ? 'Fotógrafo profesional' : 'Cliente'}. Apasionado de la estética visual de Lente Abierto MX.`,
        });
        onSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121316] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 text-zinc-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 overflow-hidden shadow-lg shadow-amber-500/10">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName || 'Logo'} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </div>
          <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">
            {mode === 'login' ? `Acceso a ${brandName || 'Lente Abierto MX'}` : 'Crear Cuenta Profesional'}
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-1">
            {mode === 'login'
              ? 'Ingresa con tu cuenta de fotógrafo o cliente'
              : 'Regístrate para gestionar galerías o descargar tus colecciones'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-black/40 p-1 mb-6 border border-white/5 text-xs uppercase font-mono tracking-wider">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-amber-500 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Sofía Valdés"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Tipo de Cuenta
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRole('cliente')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      role === 'cliente'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : 'bg-black/30 border-white/5 text-zinc-400'
                    }`}
                  >
                    Cliente / Novios
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('fotografo')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      role === 'fotografo'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : 'bg-black/30 border-white/5 text-zinc-400'
                    }`}
                  >
                    Fotógrafo / Creador
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              {mode === 'login' ? 'Usuario o Correo Electrónico *' : 'Correo Electrónico *'}
            </label>
            <input
              type={mode === 'login' ? 'text' : 'email'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'usuario o correo@ejemplo.com' : 'correo@ejemplo.com'}
              className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 777 000 0000"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario"
                  className="w-full bg-[#181a1f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center animate-pulse pt-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
          >
            {isLoading
              ? 'Procesando...'
              : mode === 'login'
              ? 'Iniciar Sesión'
              : 'Completar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};
