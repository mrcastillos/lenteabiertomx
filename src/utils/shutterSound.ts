const SHUTTER_SOUND_STORAGE_KEY = 'lente_abierto_shutter_sound_v1';
const SHUTTER_SOUND_EVENT = 'lente-abierto-shutter-sound-changed';

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let lastPlayedAt = 0;

export function isShutterSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SHUTTER_SOUND_STORAGE_KEY);
    if (raw === null) return true;
    return raw !== 'false';
  } catch {
    return true;
  }
}

export function setShutterSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SHUTTER_SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SHUTTER_SOUND_EVENT, { detail: enabled }));
    }
  } catch {}
}

export function subscribeShutterSoundPreference(listener: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<boolean>;
    listener(Boolean(custom.detail));
  };
  window.addEventListener(SHUTTER_SOUND_EVENT, handler);
  return () => window.removeEventListener(SHUTTER_SOUND_EVENT, handler);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

/**
 * Plays a crisp, ultra-short (~105ms) 1-shot mechanical camera shutter sound
 * synthesized cleanly with the Web Audio API (no external audio downloads).
 */
export function playShutterClick(force = false): void {
  if (!force && !isShutterSoundEnabled()) return;

  const nowMs = Date.now();
  if (nowMs - lastPlayedAt < 110) return;
  lastPlayedAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const buffer = getNoiseBuffer(ctx);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.22, t);
    master.connect(ctx.destination);

    // Stage 1 (0ms -> 28ms): First shutter curtain + subtle mirror thud
    const noise1 = ctx.createBufferSource();
    noise1.buffer = buffer;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(2500, t);
    filter1.Q.setValueAtTime(1.4, t);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.85, t + 0.003);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

    noise1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(master);
    noise1.start(t);
    noise1.stop(t + 0.032);

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(215, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(75, t + 0.022);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.5, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.024);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(master);
    bodyOsc.start(t);
    bodyOsc.stop(t + 0.026);

    // Stage 2 (42ms -> 98ms): Second shutter curtain metallic snap
    const t2 = t + 0.042;
    const noise2 = ctx.createBufferSource();
    noise2.buffer = buffer;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(4300, t2);
    filter2.Q.setValueAtTime(1.7, t2);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.75, t2 + 0.002);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.042);

    noise2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(master);
    noise2.start(t2);
    noise2.stop(t2 + 0.046);

    const springOsc = ctx.createOscillator();
    springOsc.type = 'sine';
    springOsc.frequency.setValueAtTime(1250, t2);
    springOsc.frequency.exponentialRampToValueAtTime(520, t2 + 0.02);

    const springGain = ctx.createGain();
    springGain.gain.setValueAtTime(0.18, t2);
    springGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.022);

    springOsc.connect(springGain);
    springGain.connect(master);
    springOsc.start(t2);
    springOsc.stop(t2 + 0.025);
  } catch {}
}

/**
 * Registers a single delegated document click handler for interactive UI elements
 * so every real click triggers a subtle, crisp 1-shot shutter sound.
 */
export function attachGlobalShutterClickListener(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Skip silent / non-interactive inputs
    if (target.closest('[data-no-shutter="true"]')) return;
    const interactive = target.closest(
      'button, a, [role="button"], article.cursor-pointer, [data-shutter-click="true"]'
    ) as HTMLElement | null;

    if (!interactive) return;
    if ((interactive as HTMLButtonElement).disabled) return;

    playShutterClick();
  };

  document.addEventListener('click', handleDocumentClick, { capture: true, passive: true });
  return () => {
    document.removeEventListener('click', handleDocumentClick, { capture: true });
  };
}
