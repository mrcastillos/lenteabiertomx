export type CloudFeedbackType = 'success' | 'error' | 'warning';

export interface CloudFeedbackEvent {
  id: string;
  type: CloudFeedbackType;
  title: string;
  message: string;
  durationMs?: number;
  allowRetryLogs?: boolean;
}

type Listener = (event: CloudFeedbackEvent) => void;

const listeners = new Set<Listener>();

export function subscribeToCloudFeedback(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitCloudStatus(
  payload: Omit<CloudFeedbackEvent, 'id'>
): void {
  const event: CloudFeedbackEvent = {
    ...payload,
    id: `cloud-fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.error('Error in cloud feedback listener:', err);
    }
  });
}

export function formatFirestoreErrorReason(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : String(err || 'Error desconocido');

  const lower = raw.toLowerCase();
  if (lower.includes('resource_exhausted') || lower.includes('quota')) {
    return 'Se alcanzó el límite de cuota gratuita diaria de Firestore. Intenta de nuevo cuando se restablezca o revisa tu plan en Firebase.';
  }
  if (lower.includes('permission_denied') || lower.includes('permission-denied')) {
    return 'Permiso denegado por las reglas de seguridad de Firestore (verifica tamaño o campos requeridos).';
  }
  if (lower.includes('offline') || lower.includes('unavailable') || lower.includes('network')) {
    return 'Sin conexión o Firestore temporalmente inaccesible.';
  }
  if (lower.includes('exceeds the maximum allowed size') || lower.includes('1048576')) {
    return 'El documento supera el límite máximo de 1 MB por registro en Firestore.';
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {}

  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
}
