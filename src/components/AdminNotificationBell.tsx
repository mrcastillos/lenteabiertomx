import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Download, Heart, Inbox, Clock, Sparkles } from 'lucide-react';
import { AdminNotificationsState, BookingInquiry, DownloadLog, FavoriteLog } from '../types';
import { saveAdminNotificationsStateToCloud } from '../services/firestoreSync';
import { emitCloudStatus, formatFirestoreErrorReason } from '../services/cloudFeedback';

const STORAGE_KEY = 'lente_abierto_admin_notif_state_v1';

interface AdminNotificationItem {
  id: string;
  kind: 'download' | 'favorite' | 'inquiry';
  title: string;
  subtitle: string;
  contact: string;
  timestamp: string;
  timeMs: number;
  thumbnailUrl?: string;
  targetTab: 'downloads' | 'favorites' | 'inquiries';
}

interface AdminNotificationBellProps {
  downloadLogs: DownloadLog[];
  favoriteLogs: FavoriteLog[];
  inquiries: BookingInquiry[];
  cloudReadState?: AdminNotificationsState;
  onNavigateTab: (tab: 'downloads' | 'favorites' | 'inquiries') => void;
}

function loadLocalReadState(): AdminNotificationsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clearedBeforeMs: 0, readIds: [] };
    const parsed = JSON.parse(raw);
    return {
      clearedBeforeMs: typeof parsed?.clearedBeforeMs === 'number' ? parsed.clearedBeforeMs : 0,
      readIds: Array.isArray(parsed?.readIds) ? parsed.readIds.slice(-300) : [],
    };
  } catch {
    return { clearedBeforeMs: 0, readIds: [] };
  }
}

function saveLocalReadState(state: AdminNotificationsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function mergeReadStates(
  a?: AdminNotificationsState,
  b?: AdminNotificationsState
): AdminNotificationsState {
  const clearedBeforeMs = Math.max(a?.clearedBeforeMs || 0, b?.clearedBeforeMs || 0);
  const mergedIds = Array.from(
    new Set([...(a?.readIds || []), ...(b?.readIds || [])])
  ).slice(-300);
  return { clearedBeforeMs, readIds: mergedIds };
}

function formatRelativeTime(timestamp: string): string {
  const timeMs = new Date(timestamp).getTime();
  if (Number.isNaN(timeMs)) return 'Reciente';
  const diffMin = Math.floor((Date.now() - timeMs) / 60000);
  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs} h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return new Date(timeMs).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

export const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({
  downloadLogs,
  favoriteLogs,
  inquiries,
  cloudReadState,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [readState, setReadState] = useState<AdminNotificationsState>(() =>
    mergeReadStates(loadLocalReadState(), cloudReadState)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync whenever cloudReadState arrives from Firestore (across browsers/devices)
  useEffect(() => {
    if (!cloudReadState) return;
    setReadState((prev) => {
      const merged = mergeReadStates(prev, cloudReadState);
      saveLocalReadState(merged);
      return merged;
    });
  }, [cloudReadState]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const allNotifications = useMemo<AdminNotificationItem[]>(() => {
    const items: AdminNotificationItem[] = [];

    for (const d of downloadLogs) {
      const timeMs = new Date(d.timestamp).getTime() || 0;
      items.push({
        id: `dl:${d.id}`,
        kind: 'download',
        title:
          d.type === 'zip'
            ? `${d.userName} descargó ZIP completo`
            : `${d.userName} descargó "${d.photoTitle || 'Foto JPG'}"`,
        subtitle: d.galleryTitle,
        contact: d.userPhone || d.userEmail,
        timestamp: d.timestamp,
        timeMs,
        thumbnailUrl: d.photoThumbnailUrl || d.photoUrl,
        targetTab: 'downloads',
      });
    }

    for (const f of favoriteLogs) {
      const timeMs = new Date(f.timestamp).getTime() || 0;
      items.push({
        id: `fav:${f.id}`,
        kind: 'favorite',
        title: `${f.userName} dio favorito a "${f.photoTitle || 'Fotografía'}"`,
        subtitle: f.galleryTitle,
        contact: f.userPhone || f.userEmail,
        timestamp: f.timestamp,
        timeMs,
        thumbnailUrl: f.photoThumbnailUrl || f.photoUrl,
        targetTab: 'favorites',
      });
    }

    for (const inq of inquiries) {
      const timeMs = new Date(inq.createdAt).getTime() || 0;
      items.push({
        id: `inq:${inq.id}`,
        kind: 'inquiry',
        title: `Cotización de ${inq.clientName}`,
        subtitle: inq.serviceType + (inq.eventDate ? ` · ${inq.eventDate}` : ''),
        contact: inq.phone || inq.email,
        timestamp: inq.createdAt,
        timeMs,
        targetTab: 'inquiries',
      });
    }

    return items.sort((a, b) => b.timeMs - a.timeMs);
  }, [downloadLogs, favoriteLogs, inquiries]);

  const unreadNotifications = useMemo(() => {
    const readSet = new Set(readState.readIds);
    return allNotifications.filter(
      (item) => item.timeMs > readState.clearedBeforeMs && !readSet.has(item.id)
    );
  }, [allNotifications, readState]);

  const unreadCount = unreadNotifications.length;

  const persistStateToCloud = async (nextState: AdminNotificationsState) => {
    setReadState(nextState);
    saveLocalReadState(nextState);
    setIsSyncing(true);
    try {
      await saveAdminNotificationsStateToCloud(nextState);
    } catch (err) {
      console.error('Error syncing notification read state to Firestore:', err);
      emitCloudStatus({
        type: 'error',
        title: 'No se pudo sincronizar las notificaciones en la nube',
        message: formatFirestoreErrorReason(err),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const markAsRead = (item: AdminNotificationItem) => {
    const nextReadIds = readState.readIds.includes(item.id)
      ? readState.readIds
      : [...readState.readIds.slice(-299), item.id];
    const nextState: AdminNotificationsState = {
      clearedBeforeMs: readState.clearedBeforeMs,
      readIds: nextReadIds,
    };
    persistStateToCloud(nextState);
    setIsOpen(false);
    onNavigateTab(item.targetTab);
  };

  const markAllAsRead = () => {
    const maxItemTime = allNotifications.reduce((max, item) => Math.max(max, item.timeMs), 0);
    const nextState: AdminNotificationsState = {
      clearedBeforeMs: Math.max(Date.now(), maxItemTime),
      readIds: [],
    };
    persistStateToCloud(nextState);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
          unreadCount > 0
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-lg shadow-amber-500/10'
            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
        }`}
        title={
          unreadCount > 0
            ? `${unreadCount} notificaciones nuevas sin leer`
            : 'Sin notificaciones nuevas'
        }
        aria-label="Notificaciones del backend"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-400' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md border border-[#0c0d0e] tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-96 z-50 bg-[#121316] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-zinc-200 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-[#181a1f] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-white truncate">
                Notificaciones ({unreadCount})
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-colors shrink-0 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Guardando...' : 'Marcar leídas'}</span>
              </button>
            )}
          </div>

          {/* Unread List */}
          <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto divide-y divide-white/5">
            {unreadNotifications.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-white">Estás al día</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  No hay descargas, favoritos ni cotizaciones nuevas sin leer en ninguno de tus dispositivos.
                </p>
              </div>
            ) : (
              unreadNotifications.slice(0, 30).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item)}
                  className="w-full px-4 py-3 text-left hover:bg-white/[0.04] transition-colors flex items-start gap-3 group"
                >
                  {/* Thumbnail or Event Icon */}
                  {item.thumbnailUrl ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-tl-md flex items-center justify-center ${
                          item.kind === 'favorite'
                            ? 'bg-rose-500 text-white'
                            : 'bg-cyan-500 text-black'
                        }`}
                      >
                        {item.kind === 'favorite' ? (
                          <Heart className="w-2.5 h-2.5 fill-current" />
                        ) : (
                          <Download className="w-2.5 h-2.5" />
                        )}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                        item.kind === 'download'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : item.kind === 'favorite'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {item.kind === 'download' ? (
                        <Download className="w-4 h-4" />
                      ) : item.kind === 'favorite' ? (
                        <Heart className="w-4 h-4" />
                      ) : (
                        <Inbox className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-medium text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {item.subtitle} · {item.contact}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 pt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatRelativeTime(item.timestamp)}</span>
                    </p>
                  </div>

                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5"
                    title="Nueva sin leer"
                  />
                </button>
              ))
            )}
          </div>

          {unreadCount > 30 && (
            <div className="px-4 py-2 bg-[#181a1f] border-t border-white/5 text-center text-[10px] font-mono text-zinc-400">
              Mostrando las 30 más recientes de {unreadCount} sin leer
            </div>
          )}
        </div>
      )}
    </div>
  );
};
