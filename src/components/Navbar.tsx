import React from 'react';
import { Camera, Lock, User, LayoutDashboard, LogIn, LogOut, Bell } from 'lucide-react';
import { UserProfile, SiteContentConfig } from '../types';

interface NavbarProps {
  currentTab: 'galleries' | 'biography' | 'contact' | 'portal' | 'admin' | 'profile';
  onSelectTab: (tab: 'galleries' | 'biography' | 'contact' | 'portal' | 'admin' | 'profile') => void;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  onOpenAdminAuth: () => void;
  onLockAdmin: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  announcement?: SiteContentConfig['announcement'];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isAdmin,
  onOpenAdminAuth,
  onLockAdmin,
  onOpenAuthModal,
  onLogout,
  announcement,
}) => {
  return (
    <>
      {/* Top Announcement / Novedades Bar */}
      {announcement?.enabled && announcement.text && (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#181510] to-amber-950/70 border-b border-amber-500/20 py-2 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs">
            {announcement.badgeText && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] uppercase font-mono tracking-wider font-semibold">
                {announcement.badgeText}
              </span>
            )}
            <span className="text-zinc-300 font-light text-xs tracking-wide">
              {announcement.text}
            </span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#0c0d0e]/95 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-18 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('galleries')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-400/30 flex items-center justify-center bg-amber-400/5 group-hover:border-amber-400/70 transition-colors shrink-0">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-editorial text-lg sm:text-2xl tracking-[0.15em] sm:tracking-[0.2em] font-medium text-white uppercase block leading-none">
              Lente Abierto MX
            </span>
            <span className="text-[8px] sm:text-[9px] font-sans tracking-[0.18em] sm:tracking-[0.25em] text-zinc-400 uppercase mt-1 block truncate max-w-[140px] sm:max-w-none">
              Fotografía de Autor · Pixieset Edition
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-sans uppercase tracking-[0.18em]">
          <button
            onClick={() => onSelectTab('galleries')}
            className={`transition-colors py-1 relative ${
              currentTab === 'galleries' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Galerías
            {currentTab === 'galleries' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('biography')}
            className={`transition-colors py-1 relative ${
              currentTab === 'biography' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Biografía
            {currentTab === 'biography' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('contact')}
            className={`transition-colors py-1 relative ${
              currentTab === 'contact' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Contacto
            {currentTab === 'contact' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('portal')}
            className={`transition-colors py-1 relative flex items-center gap-1.5 ${
              currentTab === 'portal' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Clientes</span>
            {currentTab === 'portal' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>
        </nav>

        {/* Right side controls: Backend Admin & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Admin exclusive view vs discreet lock */}
          {isAdmin ? (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 p-1 rounded-full pl-2 sm:pl-3 pr-1">
              <button
                onClick={() => onSelectTab('admin')}
                className={`flex items-center gap-1 sm:gap-1.5 text-xs tracking-wider uppercase font-medium transition-colors ${
                  currentTab === 'admin' ? 'text-amber-300 font-bold' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Backend Activo</span>
                <span className="sm:hidden text-[10px] font-bold">Admin</span>
              </button>

              <button
                onClick={onLockAdmin}
                className="p-1 rounded-full hover:bg-amber-500/20 text-amber-400/80 hover:text-amber-300 transition-colors"
                title="Bloquear y salir del modo administrador"
              >
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminAuth}
              className="p-2 rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              title="Acceso exclusivo para el fotógrafo / administrador"
              aria-label="Acceso administrador"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User profile / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={() => onSelectTab('profile')}
                className={`flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border transition-all ${
                  currentTab === 'profile'
                    ? 'border-amber-400/80 bg-amber-500/10 text-white'
                    : 'border-white/10 hover:border-white/20 bg-white/5 text-zinc-300'
                }`}
                title="Ver mi perfil"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/40"
                />
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <span className="block font-medium truncate max-w-[100px]">{currentUser.name}</span>
                  <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-mono">
                    {currentUser.role}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-full transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs tracking-wider uppercase transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bar Navigation */}
      <div className="md:hidden border-t border-white/5 px-4 py-2 flex items-center justify-around text-[10px] uppercase font-sans tracking-widest text-zinc-400 bg-[#0c0d0e]">
        <button
          onClick={() => onSelectTab('galleries')}
          className={`py-1 ${currentTab === 'galleries' ? 'text-amber-400 font-bold' : ''}`}
        >
          Galerías
        </button>
        <button
          onClick={() => onSelectTab('biography')}
          className={`py-1 ${currentTab === 'biography' ? 'text-amber-400 font-bold' : ''}`}
        >
          Biografía
        </button>
        <button
          onClick={() => onSelectTab('contact')}
          className={`py-1 ${currentTab === 'contact' ? 'text-amber-400 font-bold' : ''}`}
        >
          Contacto
        </button>
        <button
          onClick={() => onSelectTab('portal')}
          className={`py-1 ${currentTab === 'portal' ? 'text-amber-400 font-bold' : ''}`}
        >
          Clientes
        </button>
        <button
          onClick={() => onSelectTab('profile')}
          className={`py-1 ${currentTab === 'profile' ? 'text-amber-400 font-bold' : ''}`}
        >
          Perfil
        </button>
      </div>
    </header>
  </>
);
};
