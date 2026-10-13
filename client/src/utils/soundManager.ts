import { logger } from '@lark-apaas/client-toolkit/logger';

type ClickType = 'nav' | 'primary' | 'confirm' | 'cancel' | 'soft';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.7;

  ensureContext(): void {
    if (this.audioContext) return;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new Ctor();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    } catch (err) {
      logger.error('SoundManager: failed to init audio context', JSON.stringify(err));
    }
  }

  setVolume(vol: number): void {
    // vol: 0-100, convert to 0-1
    this.volume = Math.max(0, Math.min(1, vol / 100));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    startTimeOffset: number = 0,
  ): void {
    if (!this.audioContext || !this.masterGain) return;
    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.type = type;
      const start = ctx.currentTime + startTimeOffset;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    } catch (err) {
      logger.error('SoundManager: playTone error', JSON.stringify(err));
    }
  }

  playClick(type: ClickType = 'soft'): void {
    this.ensureContext();
    const configs: Record<ClickType, { f: number; d: number; v: number; t: OscillatorType }> = {
      nav: { f: 520, d: 0.08, v: 0.12, t: 'sine' },
      primary: { f: 780, d: 0.1, v: 0.2, t: 'triangle' },
      confirm: { f: 880, d: 0.12, v: 0.22, t: 'triangle' },
      cancel: { f: 280, d: 0.1, v: 0.18, t: 'sawtooth' },
      soft: { f: 480, d: 0.06, v: 0.08, t: 'sine' },
    };
    const c = configs[type];
    this.playTone(c.f, c.d, c.t, c.v);
  }

  playKeystroke(): void {
    this.ensureContext();
    if (!this.audioContext) return;
    // Mechanical click: high tick + low thump
    this.playTone(1400, 0.03, 'square', 0.06);
    this.playTone(500, 0.025, 'sine', 0.04);
  }

  playWrong(): void {
    this.ensureContext();
    this.playTone(180, 0.18, 'sawtooth', 0.15);
  }

  playBackspace(): void {
    this.ensureContext();
    this.playTone(380, 0.05, 'sine', 0.09);
  }

  playComplete(): void {
    this.ensureContext();
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq: number, i: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }

  playVictory(): void {
    this.ensureContext();
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq: number, i: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  }

  playWordComplete(): void {
    this.ensureContext();
    if (!this.audioContext || !this.masterGain) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    // Crisp two-tone chime: high then slightly higher
    const notes = [880, 1174.66];
    notes.forEach((freq: number, i: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.type = 'sine';
      const start = now + i * 0.06;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }
}

export const soundManager = new SoundManager();
