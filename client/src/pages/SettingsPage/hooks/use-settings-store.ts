import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'app_settings_v1';

export type ThemeMode = 'light' | 'dark';
export type FontType = 'default' | 'serif' | 'handwriting' | 'mono';
export type BorderStyle = 'rounded' | 'square' | 'capsule';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PronunciationSettings {
  voice: string;
  rate: number;
  volume: number;
  autoReadOnNewQuestion: boolean;
  readOnCorrect: boolean;
  readCount: number;
  readInterval: number;
}

export interface SoundEffectItem {
  enabled: boolean;
  volume: number;
}

export interface SoundEffectsSettings {
  switchQuestion: SoundEffectItem;
  typing: SoundEffectItem;
  correctAnswer: SoundEffectItem;
  wrongAnswer: SoundEffectItem;
  courseComplete: SoundEffectItem;
}

export interface AnswerSettings {
  showTranslation: boolean;
  speakingEval: boolean;
  autoNext: boolean;
  ignoreProperNouns: boolean;
  ignoreCase: boolean;
  autoShowAnswer: boolean;
  wrongCountShowAnswer: number;
}

export interface PersonalizationSettings {
  theme: ThemeMode;
  fontType: FontType;
  borderStyle: BorderStyle;
  fontSize: FontSize;
}

export interface ShortcutsSettings {
  ctrlARead: boolean;
  ctrlMMaster: boolean;
  ctrlQNewWord: boolean;
  spaceShowAnswer: boolean;
  shiftSwitchQuestion: boolean;
}

export interface AppSettings {
  pronunciation: PronunciationSettings;
  soundEffects: SoundEffectsSettings;
  answer: AnswerSettings;
  personalization: PersonalizationSettings;
  shortcuts: ShortcutsSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  pronunciation: {
    voice: '',
    rate: 1.0,
    volume: 80,
    autoReadOnNewQuestion: true,
    readOnCorrect: false,
    readCount: 1,
    readInterval: 1,
  },
  soundEffects: {
    switchQuestion: { enabled: true, volume: 60 },
    typing: { enabled: true, volume: 50 },
    correctAnswer: { enabled: true, volume: 70 },
    wrongAnswer: { enabled: true, volume: 60 },
    courseComplete: { enabled: true, volume: 80 },
  },
  answer: {
    showTranslation: true,
    speakingEval: false,
    autoNext: false,
    ignoreProperNouns: false,
    ignoreCase: true,
    autoShowAnswer: false,
    wrongCountShowAnswer: 0,
  },
  personalization: {
    theme: 'light',
    fontType: 'default',
    borderStyle: 'rounded',
    fontSize: 'md',
  },
  shortcuts: {
    ctrlARead: true,
    ctrlMMaster: true,
    ctrlQNewWord: true,
    spaceShowAnswer: true,
    shiftSwitchQuestion: true,
  },
};

function loadSettings(): AppSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as Partial<AppSettings>;
      return deepMerge(DEFAULT_SETTINGS, parsed);
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const srcVal = source[key];
    const tgtVal = result[key];
    if (
      srcVal &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal &&
      typeof tgtVal === 'object'
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      result[key] = srcVal as T[keyof T];
    }
  }
  return result;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  } else {
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
  }
}

function applyFontSize(size: FontSize): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-font-size', size);
}

function applyFontType(font: FontType): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-font-type', font);
}

function applyBorderStyle(style: BorderStyle): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-border-style', style);
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => loadSettings());

  // Apply theme and other global styles on mount and change
  useEffect(() => {
    applyTheme(settings.personalization.theme);
    applyFontSize(settings.personalization.fontSize);
    applyFontType(settings.personalization.fontType);
    applyBorderStyle(settings.personalization.borderStyle);
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings): void => {
      setSettingsState((prev) => {
        const next = updater(prev);
        saveSettings(next);
        // Apply global effects
        if (next.personalization.theme !== prev.personalization.theme) {
          applyTheme(next.personalization.theme);
        }
        if (next.personalization.fontSize !== prev.personalization.fontSize) {
          applyFontSize(next.personalization.fontSize);
        }
        if (next.personalization.fontType !== prev.personalization.fontType) {
          applyFontType(next.personalization.fontType);
        }
        if (next.personalization.borderStyle !== prev.personalization.borderStyle) {
          applyBorderStyle(next.personalization.borderStyle);
        }
        return next;
      });
    },
    [],
  );

  const setPronunciation = useCallback(
    (patch: Partial<PronunciationSettings>): void => {
      updateSettings((prev) => ({
        ...prev,
        pronunciation: { ...prev.pronunciation, ...patch },
      }));
    },
    [updateSettings],
  );

  const setSoundEffect = useCallback(
    (
      key: keyof SoundEffectsSettings,
      patch: Partial<SoundEffectItem>,
    ): void => {
      updateSettings((prev) => ({
        ...prev,
        soundEffects: {
          ...prev.soundEffects,
          [key]: { ...prev.soundEffects[key], ...patch },
        },
      }));
    },
    [updateSettings],
  );

  const setAnswer = useCallback(
    (patch: Partial<AnswerSettings>): void => {
      updateSettings((prev) => ({
        ...prev,
        answer: { ...prev.answer, ...patch },
      }));
    },
    [updateSettings],
  );

  const setPersonalization = useCallback(
    (patch: Partial<PersonalizationSettings>): void => {
      updateSettings((prev) => ({
        ...prev,
        personalization: { ...prev.personalization, ...patch },
      }));
    },
    [updateSettings],
  );

  const setShortcuts = useCallback(
    (patch: Partial<ShortcutsSettings>): void => {
      updateSettings((prev) => ({
        ...prev,
        shortcuts: { ...prev.shortcuts, ...patch },
      }));
    },
    [updateSettings],
  );

  return {
    settings,
    updateSettings,
    setPronunciation,
    setSoundEffect,
    setAnswer,
    setPersonalization,
    setShortcuts,
  };
}
