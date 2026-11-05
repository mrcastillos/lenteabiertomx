import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GalleryGrid } from './components/GalleryGrid';
import { GalleryView } from './components/GalleryView';
import { BiographyPage } from './components/BiographyPage';
import { ContactPage } from './components/ContactPage';
import { ClientPortalPage } from './components/ClientPortalPage';
import { UserProfilePage } from './components/UserProfilePage';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { InstagramFeed } from './components/InstagramFeed';
import { Gallery, UserProfile, SiteContentConfig } from './types';
import { getStoredGalleries, saveGalleries, getFavorites, toggleFavorite, getStoredSiteContent, saveSiteContent } from './services/storage';
import { getCurrentUser, setCurrentUser, logoutUser, isAdminLoggedIn, setAdminLoggedIn } from './services/userService';
import { initAuth } from './services/firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'galleries' | 'biography' | 'contact' | 'portal' | 'admin' | 'profile'
  >('galleries');

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentUser, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [siteContent, setSiteContent] = useState<SiteContentConfig>(getStoredSiteContent());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedGalleries = getStoredGalleries();
    setGalleries(loadedGalleries);
    setFavorites(getFavorites());
    setUser(getCurrentUser());
    setIsAdmin(isAdminLoggedIn());

    // Initialize Firebase Auth listener
    initAuth(
      (fbUser) => {
        // On Google Auth success
        const current = getCurrentUser();
        if (!current || current.email !== fbUser.email) {
          const profile: UserProfile = {
            id: `usr-${fbUser.uid}`,
            name: fbUser.displayName || 'Fotógrafo Lente Abierto',
            email: fbUser.email || '',
            role: 'fotografo',
            avatarUrl: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
          };
          setCurrentUser(profile);
          setUser(profile);
        }
      },
      () => {
        // Not actively logged in with Firebase, rely on local session
      }
    );
  }, []);

  const handleSaveGalleries = (newGalleries: Gallery[]) => {
    setGalleries(newGalleries);
    saveGalleries(newGalleries);
    if (selectedGallery) {
      const updated = newGalleries.find((g) => g.id === selectedGallery.id);
      if (updated) setSelectedGallery(updated);
    }
  };

  const handleToggleFavorite = (photoId: string) => {
    const updated = toggleFavorite(photoId);
    setFavorites(updated);
  };

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tab: 'galleries' | 'biography' | 'contact' | 'portal' | 'admin' | 'profile') => {
    if (tab === 'admin' && !isAdmin) {
      setIsAdminAuthModalOpen(true);
      return;
    }
    setSelectedGallery(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    setAdminLoggedIn(false);
    if (currentTab === 'admin') {
      setCurrentTab('galleries');
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    setAdminLoggedIn(true);
    setSelectedGallery(null);
    setCurrentTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    handleLockAdmin();
    setCurrentTab('galleries');
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#e6e8eb] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Editorial Luxury Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        onLockAdmin={handleLockAdmin}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        announcement={siteContent.announcement}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {selectedGallery ? (
          <GalleryView
            gallery={selectedGallery}
            onBack={() => setSelectedGallery(null)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <>
            {currentTab === 'galleries' && (
              <GalleryGrid
                galleries={galleries}
                heroConfig={siteContent.hero}
                onSelectGallery={handleSelectGallery}
                onOpenPortal={() => {
                  setCurrentTab('portal');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentTab === 'biography' && (
              <BiographyPage
                biography={siteContent.biography}
                onContactClick={() => {
                  setCurrentTab('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentTab === 'contact' && <ContactPage contact={siteContent.contact} />}

            {currentTab === 'portal' && (
              <ClientPortalPage
                galleries={galleries}
                onSelectGallery={handleSelectGallery}
                favorites={favorites}
              />
            )}

            {currentTab === 'profile' && currentUser && (
              <UserProfilePage
                user={currentUser}
                galleries={galleries}
                onSelectGallery={handleSelectGallery}
                onUpdateUser={(updated) => setUser(updated)}
                onLogout={handleLogout}
              />
            )}

            {currentTab === 'profile' && !currentUser && (
              <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
                <h2 className="font-editorial text-3xl text-white">Inicia Sesión</h2>
                <p className="text-xs text-zinc-400">
                  Para ver y personalizar tu perfil profesional o de cliente, por favor inicia sesión o crea una cuenta.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase"
                >
                  Iniciar Sesión
                </button>
              </div>
            )}

            {currentTab === 'admin' && (
              isAdmin ? (
                <AdminPanel
                  galleries={galleries}
                  onSaveGalleries={handleSaveGalleries}
                  onPreviewGallery={handleSelectGallery}
                  onLockAdmin={handleLockAdmin}
                  siteContent={siteContent}
                  onSaveSiteContent={(updated) => {
                    setSiteContent(updated);
                    saveSiteContent(updated);
                  }}
                />
              ) : (
                <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <span className="font-mono text-xl font-bold">🔒</span>
                  </div>
                  <h2 className="font-editorial text-3xl text-white">Acceso Restringido</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    El backend es exclusivo para el fotógrafo de Lente Abierto MX. Ingresa las credenciales de administrador para desbloquear este panel.
                  </p>
                  <button
                    onClick={() => setIsAdminAuthModalOpen(true)}
                    className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20"
                  >
                    Ingresar con Credenciales Admin
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Instagram Feed Showcase (@lente.abierto.mx) */}
      <InstagramFeed galleries={galleries} portraitUrl={siteContent.biography.portraitUrl} />

      {/* Editorial Luxury Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        isAdmin={isAdmin}
        contactConfig={siteContent.contact}
      />

      {/* User Auth Modal (Login / Register / Google) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Admin Exclusive Auth Modal (Password: Mar.830903) */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />
    </div>
  );
}

