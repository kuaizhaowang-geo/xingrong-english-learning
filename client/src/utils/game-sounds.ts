import { logger } from '@lark-apaas/client-toolkit/logger';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(audioCtx.destination);
    } catch (err) {
      logger.error('GameSound AudioContext 初始化失败', err as Error);
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { /* noop */ });
  }
  return audioCtx;
}

export function setMasterVolume(percent: number): void {
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  if (!Number.isFinite(percent)) return;
  const v = Math.max(0, Math.min(1, percent / 100));
  masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
}

export function resumeAudio(): void {
  getAudioContext();
}

function envelope(
  ctx: AudioContext,
  gain: GainNode,
  startTime: number,
  attack: number,
  peak: number,
  release: number,
): void {
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + attack);
  gain.gain.setValueAtTime(peak, startTime + attack + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + release);
}

// ─── 音效1：答对/单小关过关 ding-ding ───────────────────
export function playCorrectSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  const makeTone = (freq: number, start: number, dur: number, peak: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(gain).connect(masterGain!);
    envelope(ctx, gain, start, 0.008, peak, dur);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  };

  makeTone(880, now, 0.18, 0.4);
  makeTone(1100, now + 0.12, 0.3, 0.45);
}

// ─── 音效2：完整单元通关 胜利旋律 ───────────────────
export function playVictorySound(): void {
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  const notes = [
    { f: 523, t: 0, d: 0.22 },      // C5
    { f: 659, t: 0.2, d: 0.22 },    // E5
    { f: 784, t: 0.4, d: 0.22 },    // G5
    { f: 1047, t: 0.6, d: 0.55 },   // C6 拖尾
  ];

  notes.forEach(({ f, t, d }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, now + t);
    osc.connect(gain).connect(masterGain!);
    envelope(ctx, gain, now + t, 0.015, 0.35, d);
    osc.start(now + t);
    osc.stop(now + t + d + 0.05);
  });

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1319, now + 0.8);
  osc2.connect(gain2).connect(masterGain);
  envelope(ctx, gain2, now + 0.8, 0.02, 0.2, 0.6);
  osc2.start(now + 0.8);
  osc2.stop(now + 1.5);
}

// ─── 音效3：获得星星 星光闪烁 ───────────────────
export function playStarSound(): void {
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
  osc.connect(gain).connect(masterGain);
  envelope(ctx, gain, now, 0.01, 0.28, 0.45);
  osc.start(now);
  osc.stop(now + 0.5);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(2400, now + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(3200, now + 0.3);
  osc2.connect(gain2).connect(masterGain);
  envelope(ctx, gain2, now + 0.05, 0.008, 0.12, 0.35);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.5);
}

export const gameSounds = {
  correct: playCorrectSound,
  victory: playVictorySound,
  star: playStarSound,
};
