import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

export type VolumeLevel = 'mute' | 'low' | 'medium' | 'high';

export interface KeyboardSoundSettings {
  soundEnabled: boolean;
  letterSoundEnabled: boolean;
  autoPronounceEnabled: boolean;
  volume: VolumeLevel;
}

const STORAGE_KEY = 'keyboard_sound_settings';
const DEFAULT_SETTINGS: KeyboardSoundSettings = {
  soundEnabled: true,
  letterSoundEnabled: true,
  autoPronounceEnabled: true,
  volume: 'medium',
};

const VOL: Record<VolumeLevel, { click: number; error: number }> = {
  mute:   { click: 0,    error: 0 },
  low:    { click: 0.08, error: 0.06 },
  medium: { click: 0.15, error: 0.12 },
  high:   { click: 0.25, error: 0.2 },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
    } catch (err) {
      logger.error('AudioContext 初始化失败', err as Error);
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { /* noop */ });
  return audioCtx;
}

export function getKeyboardSoundSettings(): KeyboardSoundSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveKeyboardSoundSettings(settings: KeyboardSoundSettings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export function useKeyboardSound() {
  const [settings, setSettings] = useState<KeyboardSoundSettings>(() => getKeyboardSoundSettings());
  const ttsOk = useRef(typeof window !== 'undefined' && 'speechSynthesis' in window);

  const updateSettings = useCallback((patch: Partial<KeyboardSoundSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveKeyboardSoundSettings(next);
      return next;
    });
  }, []);

  // 用户首次交互后 resume，绕过自动播放策略
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const resume = (): void => { getAudioContext(); window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return () => { window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
  }, []);

  const playKeyClick = useCallback(() => {
    if (!settings.soundEnabled || settings.volume === 'mute') return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = VOL[settings.volume].click;

    // 方波 + 指数衰减：模拟机械键盘"咔"声，800Hz→200Hz，~50ms
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.05);

    // 噪声脉冲：增加按键质感，~30ms
    const n = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const noise = ctx.createBufferSource(); const ng = ctx.createGain();
    noise.buffer = buf; ng.gain.value = v * 0.3;
    noise.connect(ng).connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.03);
  }, [settings.soundEnabled, settings.volume]);

  const playKeyError = useCallback(() => {
    if (!settings.soundEnabled || settings.volume === 'mute') return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = VOL[settings.volume].error;

    // 低频正弦 + 轻度失真：低沉错误声，200Hz→100Hz，~120ms
    const osc = ctx.createOscillator(); const gain = ctx.createGain(); const shaper = ctx.createWaveShaper();
    shaper.curve = new Float32Array([-1, -0.7, -0.3, 0, 0.3, 0.7, 1]);
    shaper.oversample = '2x';
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(shaper).connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.12);
  }, [settings.soundEnabled, settings.volume]);

  const playKeyBackspace = useCallback(() => {
    if (!settings.soundEnabled || settings.volume === 'mute') return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = VOL[settings.volume].click * 0.7;

    // 短促的"嗒"声，频率从500Hz快速下扫到150Hz，~35ms
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.035);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.035);
  }, [settings.soundEnabled, settings.volume]);

  const playKeySpace = useCallback(() => {
    if (!settings.soundEnabled || settings.volume === 'mute') return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = VOL[settings.volume].click * 0.8;

    // 低沉的"啪"声，比普通按键低，300Hz→80Hz，~55ms
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.055);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.055);
  }, [settings.soundEnabled, settings.volume]);

  const playLetterSound = useCallback((letter: string, lang = 'en-US') => {
    if (!settings.letterSoundEnabled || !letter || !ttsOk.current) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(letter);
      u.lang = lang; u.rate = 1.1; u.volume = 0.8;
      window.speechSynthesis.speak(u);
    } catch (err) {
      logger.error('字母发音播放失败', err as Error);
    }
  }, [settings.letterSoundEnabled]);

  return { settings, updateSettings, playKeyClick, playKeyError, playKeyBackspace, playKeySpace, playLetterSound };
}
