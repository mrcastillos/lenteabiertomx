import React, { useState } from 'react';
import { Lock, X, ShieldAlert, Eye, EyeOff, KeyRound, Sparkles, UserCheck } from 'lucide-react';
import {
  authenticateUserForBackend,
  setAdminLoggedIn,
  setCurrentUser,
} from '../services/userService';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const authResult = authenticateUserForBackend(username, password);

      if (authResult.success && authResult.user) {
        setAdminLoggedIn(true);
        setCurrentUser(authResult.user);
        setIsLoading(false);
        onSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setError('Acceso denegado. Credenciales inválidas. Verifica tu usuario y contraseña.');
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121316] border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-zinc-200 overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
            <Lock className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] uppercase font-mono tracking-widest mb-2">
            <KeyRound className="w-3 h-3" />
            <span>Zona Restringida · Administrador</span>
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl text-white font-medium">
            Acceso al Backend
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Panel exclusivo para la gestión de galerías, Google Drive, marcas de agua y PINs de seguridad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
              Usuario de Administrador
            </label>
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ingresa tu usuario (ej. admi)"
              className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
              Contraseña Maestra
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••••••"
                className="w-full bg-[#181a1f] border border-zinc-700 focus:border-amber-500/80 rounded-xl px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-semibold text-xs tracking-widest uppercase transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Desbloquear Backend</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-zinc-500">
          <span>Seguridad criptográfica © Lente Abierto MX</span>
        </div>
      </div>
    </div>
  );
};
