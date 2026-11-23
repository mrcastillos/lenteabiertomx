import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { CloudFeedbackEvent, subscribeToCloudFeedback } from '../services/cloudFeedback';
import { flushPendingCloudLogs, getPendingCloudLogsCount } from '../services/storage';

export const CloudSyncToast: React.FC = () => {
  const [items, setItems] = useState<CloudFeedbackEvent[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const timers = new Map<string, number>();

    const unsub = subscribeToCloudFeedback((evt) => {
      setItems((prev) => {
        // Deduplicate rapid identical messages
        const filtered = prev.filter(
          (p) => !(p.type === evt.type && p.title === evt.title && p.message === evt.message)
        );
        return [evt, ...filtered].slice(0, 3);
      });

      const delay = evt.durationMs ?? (evt.type === 'error' ? 12000 : 4000);
      if (delay > 0) {
        const timer = window.setTimeout(() => {
          setItems((prev) => prev.filter((p) => p.id !== evt.id));
          timers.delete(evt.id);
        }, delay);
        timers.set(evt.id, timer);
      }
    });

    return () => {
      unsub();
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRetryPendingLogs = async (id: string) => {
    setIsRetrying(true);
    try {
      const res = await flushPendingCloudLogs(true);
      if (res.failed === 0) {
        handleDismiss(id);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (items.length === 0) return null;

  const hasErrorModal = items.find((i) => i.type === 'error');

  return (
    <>
      {/* Prominent Red Warning Popup when something fails to save in Firestore */}
      {hasErrorModal && (
        <div
          role="alertdialog"
          aria-live="assertive"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-md bg-red-950/95 border-2 border-red-500 text-white rounded-2xl p-4 sm:p-5 shadow-2xl shadow-red-950/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/50 text-red-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-300 mb-0.5">
                Aviso de Sincronización · Firestore
              </p>
              <h4 className="text-sm font-semibold text-white leading-snug">
                {hasErrorModal.title}
              </h4>
              <p className="text-xs text-red-100/90 mt-1 leading-relaxed break-words">
                {hasErrorModal.message}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {(hasErrorModal.allowRetryLogs || getPendingCloudLogsCount() > 0) && (
                  <button
                    type="button"
                    disabled={isRetrying}
                    onClick={() => handleRetryPendingLogs(hasErrorModal.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? 'Reintentando...' : 'Reintentar Subida'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDismiss(hasErrorModal.id)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-red-100 text-[11px] font-mono uppercase tracking-wider transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(hasErrorModal.id)}
              aria-label="Cerrar aviso"
              className="text-red-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Green Confirmation Toasts when saved to Firestore */}
      <div className="fixed bottom-5 right-5 z-[115] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none">
        {items
          .filter((i) => i.type !== 'error')
          .map((item) => (
            <div
              key={item.id}
              role="status"
              aria-live="polite"
              className="pointer-events-auto bg-emerald-950/95 border border-emerald-500/60 text-white rounded-2xl px-4 py-3 shadow-2xl shadow-emerald-950/60 backdrop-blur-md flex items-start gap-3 animate-fadeIn"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-100 leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-emerald-200/85 mt-0.5 leading-snug">
                  {item.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDismiss(item.id)}
                aria-label="Cerrar notificación"
                className="text-emerald-300/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
      </div>
    </>
  );
};
