import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Camera, Phone, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { loginUser, registerUser } from '../services/userService';
import { googleSignIn } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
          setError('Por favor introduce tu correo electrónico.');
          setIsLoading(false);
          return;
        }
        const user = loginUser(email);
        onSuccess(user);
        onClose();
      } else {
        if (!name || !email) {
          setError('Por favor completa tu nombre y correo.');
          setIsLoading(false);
          return;
        }
        const newUser = registerUser({
          name,
          email,
          role,
          phone,
          whatsapp: whatsapp || phone,
          instagram,
          bio,
          detailedBio: `${name} - ${role === 'fotografo' ? 'Fotógrafo profesional' : 'Cliente'}. Apasionado de la estética visual de Lente Abierto MX.`,
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

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const u = loginUser(res.user.email || 'usuario@gmail.com');
        if (res.user.displayName) {
          u.name = res.user.displayName;
        }
        if (res.user.photoURL) {
          u.avatarUrl = res.user.photoURL;
        }
        onSuccess(u);
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign In Error', err);
      setError('No se pudo completar el inicio de sesión con Google.');
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
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">
            {mode === 'login' ? 'Acceso a Lente Abierto MX' : 'Crear Cuenta Profesional'}
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

        {/* Google sign-in button */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          type="button"
          className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-3 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-[10px] uppercase font-mono text-zinc-500">o correo</span>
          <div className="flex-1 border-t border-white/10" />
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
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
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
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55..."
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
