import { logger } from '@lark-apaas/client-toolkit/logger';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new AC();
    } catch (err) {
      logger.error('AudioContext 初始化失败', err as Error);
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      /* noop */
    });
  }
  return audioCtx;
}

// Ensure audio context is resumed after user interaction
if (typeof window !== 'undefined') {
  const resume = (): void => {
    getAudioContext();
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
}

export type SoundType =
  | 'switchQuestion'
  | 'typing'
  | 'correctAnswer'
  | 'wrongAnswer'
  | 'courseComplete';

/**
 * Play a sound effect using Web Audio API (OscillatorNode).
 * Volume range: 0-100.
 */
export function playSound(type: SoundType, volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const vol = Math.max(0, Math.min(100, volume)) / 100;
  if (vol <= 0) return;

  const now = ctx.currentTime;

  switch (type) {
    case 'typing': {
      // Short click sound: square wave with rapid frequency drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }
    case 'switchQuestion': {
      // Soft "whoosh" / slide: two-tone ascending
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }
    case 'correctAnswer': {
      // Rising arpeggio: C5-E5-G5 (happy/success)
      const notes = [523.25, 659.25, 783.99];
      const noteDur = 0.1;
      notes.forEach((freq, i) => {
        const t = now + i * noteDur * 0.6;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol * 0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + noteDur);
      });
      break;
    }
    case 'wrongAnswer': {
      // Descending dissonant pair: error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      break;
    }
    case 'courseComplete': {
      // Fanfare: ascending triumphant scale
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const noteDur = 0.12;
      notes.forEach((freq, i) => {
        const t = now + i * noteDur * 0.7;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol * 0.35, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + noteDur);
      });
      break;
    }
  }
}
