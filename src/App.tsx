import { useState, useEffect, useRef } from 'react';
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
import { CloudSyncToast } from './components/CloudSyncToast';
import { Gallery, UserProfile, SiteContentConfig, FavoriteLog } from './types';
import {
  getStoredGalleries,
  saveGalleries,
  getFavorites,
  toggleFavorite,
  getStoredSiteContent,
  saveSiteContent,
  getStoredFavoriteLogs,
  isGalleryPinVerifiedInSession,
  setGalleryPinVerifiedInSession,
  getGalleryShareUrl,
  flushPendingCloudLogs,
} from './services/storage';
import { emitCloudStatus, formatFirestoreErrorReason } from './services/cloudFeedback';
import {
  getCurrentUser,
  logoutUser,
  isAdminLoggedIn,
  setAdminLoggedIn,
  isSuperAdminLoggedIn,
  setSuperAdminLoggedIn,
  saveStoredUsers,
} from './services/userService';
import {
  subscribeToGalleries,
  saveGalleryToCloud,
  deleteGalleryFromCloud,
  incrementGalleryViewsInCloud,
  subscribeToSiteContent,
  saveSiteContentToCloud,
  subscribeToUsers,
  subscribeToFavoriteLogs,
} from './services/firestoreSync';
import { DEFAULT_APPEARANCE, getReadableContrastColor, isLightColor } from './utils/themePresets';
import { ThemePresetContext } from './components/ThemedCameraIcon';
import { attachGlobalShutterClickListener } from './utils/shutterSound';

type AppTab = 'galleries' | 'biography' | 'contact' | 'portal' | 'admin' | 'profile';

interface AppHistoryState {
  lenteApp: true;
  tab: AppTab;
  galleryId: string | null;
  lightbox: boolean;
  photoId: string | null;
  depth: number;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('biography');

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const galleriesRef = useRef<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [previewPhotoId, setPreviewPhotoId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteLogs, setFavoriteLogs] = useState<FavoriteLog[]>(() => getStoredFavoriteLogs());
  const [currentUser, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [siteContent, setSiteContent] = useState<SiteContentConfig>(getStoredSiteContent());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [pendingSharedSlug, setPendingSharedSlug] = useState<string | null>(() => {
    try {
      return new URLSearchParams(window.location.search).get('galeria');
    } catch {
      return null;
    }
  });
  const [privateLinkGallery, setPrivateLinkGallery] = useState<Gallery | null>(null);
  const [privateLinkPinInput, setPrivateLinkPinInput] = useState('');
  const [privateLinkPinError, setPrivateLinkPinError] = useState(false);

  useEffect(() => {
    galleriesRef.current = galleries;
  }, [galleries]);

  // Initialize data & browser history navigation on mount
  useEffect(() => {
    const loadedGalleries = getStoredGalleries();
    galleriesRef.current = loadedGalleries;
    setGalleries(loadedGalleries);
    setFavorites(getFavorites());
    setUser(getCurrentUser());
    setIsAdmin(isAdminLoggedIn());
    setIsSuperAdmin(isSuperAdminLoggedIn());

    // Anchor root history entry so Back/Forward stays consistent inside the SPA
    try {
      if (!window.history.state?.lenteApp) {
        const initialState: AppHistoryState = {
          lenteApp: true,
          tab: 'biography',
          galleryId: null,
          lightbox: false,
          photoId: null,
          depth: 0,
        };
        window.history.replaceState(initialState, '', window.location.href);
      }
    } catch {}

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as AppHistoryState | null;
      if (!state || !state.lenteApp) return;

      const safeTab: AppTab = state.tab === 'admin' && !isAdminLoggedIn() ? 'biography' : state.tab;
      const targetGallery = state.galleryId
        ? galleriesRef.current.find((g) => g.id === state.galleryId) || null
        : null;

      setCurrentTab(safeTab);
      setSelectedGallery(targetGallery);
      setPreviewPhotoId(targetGallery && state.lightbox ? state.photoId || null : null);
    };

    window.addEventListener('popstate', handlePopState);

    // Subscribe to live cloud galleries from Firestore
    const unsubGalleries = subscribeToGalleries((cloudGalleries) => {
      galleriesRef.current = cloudGalleries;
      setGalleries(cloudGalleries);
      setSelectedGallery((prev) => (prev ? cloudGalleries.find((g) => g.id === prev.id) || prev : null));
    });

    // Subscribe to live site content (CMS) from Firestore
    const unsubContent = subscribeToSiteContent((cloudContent) => {
      setSiteContent(cloudContent);
    });

    // Subscribe to live users from Firestore
    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        saveStoredUsers(cloudUsers);
        const fresh = getCurrentUser();
        if (fresh) setUser(fresh);
      }
    });

    // Subscribe to live favorite logs from Firestore
    const unsubFavoriteLogs = subscribeToFavoriteLogs((cloudFavLogs) => {
      setFavoriteLogs(cloudFavLogs);
    });

    // Retry any locally backed-up favorite/download logs that failed previously
    flushPendingCloudLogs(true).catch(() => {});

    // Single-shot mechanical camera shutter click feedback on interactive clicks
    const detachShutterListener = attachGlobalShutterClickListener();

    return () => {
      detachShutterListener();
      window.removeEventListener('popstate', handlePopState);
      unsubGalleries();
      unsubContent();
      unsubUsers();
      unsubFavoriteLogs();
    };
  }, []);

  // Dynamically update document title, meta description, and favicon from CMS
  useEffect(() => {
    if (siteContent?.general?.pageTitle) {
      document.title = siteContent.general.pageTitle;
    }
    if (siteContent?.general?.pageDescription) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', siteContent.general.pageDescription);
      }
    }
    if (siteContent?.general?.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = siteContent.general.faviconUrl;
    }

    // Apply appearance CSS custom properties globally so all visitors see the active theme
    const appTheme = siteContent?.appearance || DEFAULT_APPEARANCE;
    const light = isLightColor(appTheme.backgroundColor);
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--theme-bg', appTheme.backgroundColor || DEFAULT_APPEARANCE.backgroundColor);
    rootStyle.setProperty('--theme-surface', appTheme.surfaceColor || DEFAULT_APPEARANCE.surfaceColor);
    rootStyle.setProperty('--theme-surface-alt', light ? '#f1f0ec' : '#181a1f');
    rootStyle.setProperty('--theme-text', appTheme.textColor || DEFAULT_APPEARANCE.textColor);
    rootStyle.setProperty('--theme-heading', appTheme.headingColor || DEFAULT_APPEARANCE.headingColor);
    rootStyle.setProperty('--theme-muted', appTheme.mutedTextColor || DEFAULT_APPEARANCE.mutedTextColor);
    rootStyle.setProperty('--theme-accent', appTheme.accentColor || DEFAULT_APPEARANCE.accentColor);
    rootStyle.setProperty('--theme-accent-contrast', getReadableContrastColor(appTheme.accentColor || DEFAULT_APPEARANCE.accentColor));
    rootStyle.setProperty('--theme-border', light ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)');
  }, [siteContent]);

  const handleSaveGalleries = async (newGalleries: Gallery[]) => {
    const prevById = new Map(galleries.map((item) => [item.id, item]));
    const changedGalleries = newGalleries.filter((g) => {
      const prev = prevById.get(g.id);
      return !prev || JSON.stringify(prev) !== JSON.stringify(g);
    });

    setGalleries(newGalleries);
    saveGalleries(newGalleries);
    if (selectedGallery) {
      const updated = newGalleries.find((g) => g.id === selectedGallery.id);
      if (updated) setSelectedGallery(updated);
    }

    if (changedGalleries.length === 0) return;

    // Only write modified/new galleries to Firestore to protect quota and avoid partial loops
    let savedCount = 0;
    for (const g of changedGalleries) {
      try {
        await saveGalleryToCloud(g);
        savedCount++;
      } catch (e) {
        console.error('Error saving gallery to cloud:', e);
        emitCloudStatus({
          type: 'error',
          title: 'No se guardaron los cambios de la galería en Firestore',
          message: `Galería "${g.title}": ${formatFirestoreErrorReason(e)}`,
          durationMs: 12000,
        });
        throw e;
      }
    }

    if (savedCount > 0) {
      emitCloudStatus({
        type: 'success',
        title: 'Cambios guardados en Firestore',
        message:
          savedCount === 1
            ? `La galería "${changedGalleries[0].title}" se sincronizó correctamente en la nube.`
            : `Se sincronizaron ${savedCount} galerías correctamente en la nube.`,
      });
    }
  };

  const handleDeleteGallery = async (galleryId: string) => {
    const target = galleries.find((g) => g.id === galleryId);
    try {
      await deleteGalleryFromCloud(galleryId);
      const updated = galleries.filter((g) => g.id !== galleryId);
      setGalleries(updated);
      saveGalleries(updated);
      if (selectedGallery?.id === galleryId) {
        setSelectedGallery(null);
        setPreviewPhotoId(null);
        replaceAppHistoryState({
          lenteApp: true,
          tab: currentTab,
          galleryId: null,
          lightbox: false,
          photoId: null,
          depth: getCurrentHistoryDepth(),
        }, getCleanUrlWithoutGallery());
      }
      emitCloudStatus({
        type: 'success',
        title: 'Galería eliminada en Firestore',
        message: target
          ? `"${target.title}" se eliminó correctamente de la base de datos.`
          : 'La galería se eliminó correctamente.',
      });
    } catch (e) {
      console.error('Error deleting gallery from cloud:', e);
      emitCloudStatus({
        type: 'error',
        title: 'No se pudo eliminar la galería en Firestore',
        message: formatFirestoreErrorReason(e),
        durationMs: 12000,
      });
      throw e;
    }
  };

  const handleSaveSiteContent = async (updated: SiteContentConfig) => {
    setSiteContent(updated);
    saveSiteContent(updated, true);
    try {
      await saveSiteContentToCloud(updated);
      emitCloudStatus({
        type: 'success',
        title: 'Cambios guardados en Firestore',
        message: 'La biografía, identidad, diseño y textos del sitio se guardaron correctamente.',
      });
    } catch (e) {
      console.error('Error saving site content to cloud:', e);
      emitCloudStatus({
        type: 'error',
        title: 'No se guardaron los cambios del sitio en Firestore',
        message: formatFirestoreErrorReason(e),
        durationMs: 12000,
      });
      throw e;
    }
  };

  const handleToggleFavorite = (photoId: string) => {
    const updated = toggleFavorite(photoId);
    setFavorites(updated);
  };

  const getCurrentHistoryDepth = (): number => {
    try {
      const state = window.history.state as AppHistoryState | null;
      return state?.lenteApp && typeof state.depth === 'number' ? state.depth : 0;
    } catch {
      return 0;
    }
  };

  const getCleanUrlWithoutGallery = (): string => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('galeria');
      return url.pathname + url.search + url.hash;
    } catch {
      return window.location.pathname || '/';
    }
  };

  const pushAppHistoryState = (nextState: AppHistoryState, targetUrl?: string) => {
    try {
      window.history.pushState(nextState, '', targetUrl || window.location.href);
    } catch {}
  };

  const replaceAppHistoryState = (nextState: AppHistoryState, targetUrl?: string) => {
    try {
      window.history.replaceState(nextState, '', targetUrl || window.location.href);
    } catch {}
  };

  const handleSelectGallery = (
    gallery: Gallery,
    initialPhotoId?: string,
    options?: { replaceHistory?: boolean }
  ) => {
    const viewKey = `lente_abierto_viewed_${gallery.id}`;
    let alreadyViewed = false;
    try {
      alreadyViewed = sessionStorage.getItem(viewKey) === 'true';
      if (!alreadyViewed) {
        sessionStorage.setItem(viewKey, 'true');
      }
    } catch {}

    const shareUrl = getGalleryShareUrl(gallery);
    const currentDepth = getCurrentHistoryDepth();

    if (options?.replaceHistory) {
      replaceAppHistoryState(
        {
          lenteApp: true,
          tab: 'galleries',
          galleryId: gallery.id,
          lightbox: Boolean(initialPhotoId),
          photoId: initialPhotoId || null,
          depth: currentDepth,
        },
        shareUrl
      );
    } else {
      pushAppHistoryState(
        {
          lenteApp: true,
          tab: currentTab,
          galleryId: gallery.id,
          lightbox: false,
          photoId: null,
          depth: currentDepth + 1,
        },
        shareUrl
      );
      if (initialPhotoId) {
        pushAppHistoryState(
          {
            lenteApp: true,
            tab: currentTab,
            galleryId: gallery.id,
            lightbox: true,
            photoId: initialPhotoId,
            depth: currentDepth + 2,
          },
          shareUrl
        );
      }
    }

    setPreviewPhotoId(initialPhotoId || null);

    if (!alreadyViewed) {
      const nextViews = (gallery.viewsCount || 0) + 1;
      const updatedGallery = { ...gallery, viewsCount: nextViews };
      setSelectedGallery(updatedGallery);
      setGalleries((prev) =>
        prev.map((item) => (item.id === gallery.id ? { ...item, viewsCount: nextViews } : item))
      );
      incrementGalleryViewsInCloud(gallery.id).catch(() => {});
    } else {
      setSelectedGallery(gallery);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resolve deep-linked gallery (?galeria=slug-or-id) once galleries load
  useEffect(() => {
    if (!pendingSharedSlug || galleries.length === 0) return;
    const cleanTarget = pendingSharedSlug.trim().toLowerCase();
    const matched = galleries.find(
      (g) =>
        (g.slug && g.slug.toLowerCase() === cleanTarget) ||
        g.id.toLowerCase() === cleanTarget
    );
    if (!matched) return;

    setPendingSharedSlug(null);
    if (matched.isPrivate && matched.accessPin && !isGalleryPinVerifiedInSession(matched.id)) {
      setPrivateLinkGallery(matched);
      setPrivateLinkPinInput('');
      setPrivateLinkPinError(false);
    } else {
      handleSelectGallery(matched, undefined, { replaceHistory: true });
    }
  }, [pendingSharedSlug, galleries]);

  const handleOpenLightbox = (photoId: string) => {
    const currentDepth = getCurrentHistoryDepth();
    pushAppHistoryState({
      lenteApp: true,
      tab: currentTab,
      galleryId: selectedGallery?.id || null,
      lightbox: true,
      photoId,
      depth: currentDepth + 1,
    });
    setPreviewPhotoId(photoId);
  };

  // Navigating Prev/Next inside Lightbox must NOT push extra history entries
  const handleNavigateLightbox = (photoId: string) => {
    setPreviewPhotoId(photoId);
  };

  const handleCloseLightbox = () => {
    const state = window.history.state as AppHistoryState | null;
    if (state?.lenteApp && state.lightbox && (state.depth ?? 0) > 0) {
      window.history.back();
    } else {
      setPreviewPhotoId(null);
    }
  };

  const handleCloseGallery = () => {
    const state = window.history.state as AppHistoryState | null;
    if (state?.lenteApp && state.galleryId && !state.lightbox && (state.depth ?? 0) > 0) {
      window.history.back();
      return;
    }

    const nextDepth = getCurrentHistoryDepth() + 1;
    pushAppHistoryState(
      {
        lenteApp: true,
        tab: 'galleries',
        galleryId: null,
        lightbox: false,
        photoId: null,
        depth: nextDepth,
      },
      getCleanUrlWithoutGallery()
    );
    setSelectedGallery(null);
    setPreviewPhotoId(null);
    setCurrentTab('galleries');
  };

  const handleSelectTab = (tab: AppTab) => {
    if (tab === 'admin' && !isAdmin) {
      setIsAdminAuthModalOpen(true);
      return;
    }
    if (currentTab === tab && !selectedGallery && !previewPhotoId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const nextDepth = getCurrentHistoryDepth() + 1;
    pushAppHistoryState(
      {
        lenteApp: true,
        tab,
        galleryId: null,
        lightbox: false,
        photoId: null,
        depth: nextDepth,
      },
      getCleanUrlWithoutGallery()
    );
    setSelectedGallery(null);
    setPreviewPhotoId(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminLoggedIn(false);
    setSuperAdminLoggedIn(false);
    if (currentTab === 'admin') {
      replaceAppHistoryState(
        {
          lenteApp: true,
          tab: 'biography',
          galleryId: null,
          lightbox: false,
          photoId: null,
          depth: getCurrentHistoryDepth(),
        },
        getCleanUrlWithoutGallery()
      );
      setCurrentTab('biography');
    }
  };

  const handleAdminAuthSuccess = (superAdmin = false) => {
    setIsAdmin(true);
    setIsSuperAdmin(superAdmin);
    setAdminLoggedIn(true);
    setSuperAdminLoggedIn(superAdmin);
    setSelectedGallery(null);
    setPreviewPhotoId(null);
    const nextDepth = getCurrentHistoryDepth() + 1;
    pushAppHistoryState(
      {
        lenteApp: true,
        tab: 'admin',
        galleryId: null,
        lightbox: false,
        photoId: null,
        depth: nextDepth,
      },
      getCleanUrlWithoutGallery()
    );
    setCurrentTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    handleLockAdmin();
    replaceAppHistoryState(
      {
        lenteApp: true,
        tab: 'biography',
        galleryId: null,
        lightbox: false,
        photoId: null,
        depth: getCurrentHistoryDepth(),
      },
      getCleanUrlWithoutGallery()
    );
    setSelectedGallery(null);
    setPreviewPhotoId(null);
    setCurrentTab('biography');
  };

  const activePreset = (siteContent?.appearance || DEFAULT_APPEARANCE).preset || 'default';
  const isLightTheme = isLightColor((siteContent?.appearance || DEFAULT_APPEARANCE).backgroundColor);

  return (
    <ThemePresetContext.Provider value={activePreset}>
    <div
      className={`min-h-screen flex flex-col font-sans ${currentTab === 'admin' && isAdmin ? 'bg-[#0c0d0e] text-[#e6e8eb]' : 'site-theme-scope'}`}
      data-theme-light={isLightTheme ? 'true' : 'false'}
    >
      {/* Editorial Luxury Header */}
      <div className="site-theme-scope" data-theme-light={isLightTheme ? 'true' : 'false'}>
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
          generalConfig={siteContent.general}
        />
      </div>

      {/* Main View Router */}
      <div className="flex-1">
        {selectedGallery ? (
          <GalleryView
            gallery={selectedGallery}
            onBack={handleCloseGallery}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            brandName={siteContent.general?.brandName}
            brandLogoUrl={siteContent.general?.logoIconUrl}
            initialPhotoId={previewPhotoId || undefined}
            whatsappNumber={siteContent.contact?.whatsapp || siteContent.contact?.phone || '527773743420'}
            lightboxPhotoId={previewPhotoId}
            onOpenLightbox={handleOpenLightbox}
            onNavigateLightbox={handleNavigateLightbox}
            onCloseLightbox={handleCloseLightbox}
          />
        ) : (
          <>
            {currentTab === 'galleries' && (
              <GalleryGrid
                galleries={galleries}
                heroConfig={siteContent.hero}
                favorites={favorites}
                favoriteLogs={favoriteLogs}
                onSelectGallery={handleSelectGallery}
                onOpenPortal={() => handleSelectTab('portal')}
              />
            )}

            {currentTab === 'biography' && (
              <BiographyPage
                biography={siteContent.biography}
                onContactClick={() => handleSelectTab('contact')}
              />
            )}

            {currentTab === 'contact' && <ContactPage contact={siteContent.contact} />}

            {currentTab === 'portal' && (
              <ClientPortalPage
                galleries={galleries}
                onSelectGallery={handleSelectGallery}
                favorites={favorites}
                logoUrl={siteContent.general?.logoIconUrl}
                brandName={siteContent.general?.brandName}
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
                  onDeleteGallery={handleDeleteGallery}
                  onPreviewGallery={handleSelectGallery}
                  onLockAdmin={handleLockAdmin}
                  onSaveSiteContent={handleSaveSiteContent}
                  siteContent={siteContent}
                  isSuperAdmin={isSuperAdmin}
                />
              ) : (
                <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto overflow-hidden">
                    {siteContent.general?.logoIconUrl ? (
                      <img src={siteContent.general.logoIconUrl} alt={siteContent.general?.brandName || 'Logo'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono text-xl font-bold">🔒</span>
                    )}
                  </div>
                  <h2 className="font-editorial text-3xl text-white">Acceso Restringido</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    El backend es exclusivo para el equipo de gestión de {siteContent.general?.brandName || 'Lente Abierto MX'}. Ingresa tus credenciales autorizadas para desbloquear este panel.
                  </p>
                  <button
                    onClick={() => setIsAdminAuthModalOpen(true)}
                    className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20"
                  >
                    Ingresar al Panel
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Instagram Feed Showcase (@lente.abierto.mx) */}
      <div className="site-theme-scope" data-theme-light={isLightTheme ? 'true' : 'false'}>
        <InstagramFeed
          galleries={galleries}
          portraitUrl={siteContent.biography.portraitUrl}
          customPosts={siteContent.instagramPosts}
        />
      </div>

      {/* Editorial Luxury Footer */}
      <div className="site-theme-scope" data-theme-light={isLightTheme ? 'true' : 'false'}>
        <Footer
          onSelectTab={handleSelectTab}
          onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
          isAdmin={isAdmin}
          contactConfig={siteContent.contact}
          generalConfig={siteContent.general}
        />
      </div>

      {/* User Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setIsAuthModalOpen(false);
        }}
        onSuperAdminSuccess={() => {
          handleAdminAuthSuccess(true);
        }}
        logoUrl={siteContent.general?.logoIconUrl}
        brandName={siteContent.general?.brandName}
      />

      {/* Backend Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={(superAdmin) => handleAdminAuthSuccess(Boolean(superAdmin))}
        logoUrl={siteContent.general?.logoIconUrl}
        brandName={siteContent.general?.brandName}
      />

      {/* Direct Shared Link PIN Unlock Modal (when opening a private gallery URL directly) */}
      {privateLinkGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#121316] border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-zinc-200">
            <div className="text-center mb-5 space-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto overflow-hidden">
                {siteContent.general?.logoIconUrl ? (
                  <img src={siteContent.general.logoIconUrl} alt={siteContent.general?.brandName || 'Logo'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🔒</span>
                )}
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-400">
                Colección Privada
              </p>
              <h3 className="font-editorial text-2xl text-white font-medium">
                {privateLinkGallery.title}
              </h3>
              <p className="text-xs text-zinc-400 font-light">
                Ingresa el PIN de apertura para ver esta galería privada.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const attempt = privateLinkPinInput.trim().toLowerCase();
                const validOpenPin = (privateLinkGallery.accessPin || '').trim().toLowerCase();
                const validDlPin = (privateLinkGallery.downloadPin || '').trim().toLowerCase();
                if (attempt && (attempt === validOpenPin || (validDlPin && attempt === validDlPin))) {
                  const target = privateLinkGallery;
                  setGalleryPinVerifiedInSession(target.id);
                  setPrivateLinkGallery(null);
                  setPrivateLinkPinError(false);
                  handleSelectGallery(target, undefined, { replaceHistory: true });
                } else {
                  setPrivateLinkPinError(true);
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                autoFocus
                value={privateLinkPinInput}
                onChange={(e) => {
                  setPrivateLinkPinInput(e.target.value);
                  if (privateLinkPinError) setPrivateLinkPinError(false);
                }}
                placeholder="Ingresa la clave PIN"
                className={`w-full bg-[#181a1f] border text-center text-base tracking-[0.22em] text-white py-3 px-4 rounded-xl focus:outline-none ${
                  privateLinkPinError
                    ? 'border-red-500/80 bg-red-950/20'
                    : 'border-zinc-700 focus:border-amber-500/80'
                }`}
              />
              {privateLinkPinError && (
                <p className="text-xs text-red-400 text-center">
                  PIN incorrecto. Verifica la clave enviada por el estudio.
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPrivateLinkGallery(null);
                    replaceAppHistoryState(
                      {
                        lenteApp: true,
                        tab: currentTab,
                        galleryId: null,
                        lightbox: false,
                        photoId: null,
                        depth: getCurrentHistoryDepth(),
                      },
                      getCleanUrlWithoutGallery()
                    );
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Cloud Save Status Toast / Error Popup */}
      <CloudSyncToast />
    </div>
    </ThemePresetContext.Provider>
  );
}

