import { useState, useEffect, useRef } from 'react';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import {
  getKeyboardSoundSettings,
  saveKeyboardSoundSettings,
} from '@client/src/hooks/use-keyboard-sound';

const DEFAULT_SETTINGS = {
  selectedVoice: 'young_female',
  speechRate: 1,
  soundEffectsEnabled: true,
  keyboardVisible: true,
  fingerGuideEnabled: true,
  autoSpeakEnabled: true,
  letterSpeakEnabled: true,
  autoNextEnabled: true,
  soundVolume: 80,
  animationLevel: 'standard',
  rememberMode: true,
  phoneticVisible: true,
  partOfSpeechVisible: true,
  showGrammarTags: true,
  showIllustration: true,
  wordRearrangeMode: false,
};

function loadInitialSettings(): typeof DEFAULT_SETTINGS {
  try {
    const saved = loadSettings();
    const kbs = getKeyboardSoundSettings();
    return {
      ...DEFAULT_SETTINGS,
      ...(saved || {}),
      soundEffectsEnabled: kbs.soundEnabled ?? (saved?.soundEffectsEnabled as boolean | undefined) ?? DEFAULT_SETTINGS.soundEffectsEnabled,
      letterSpeakEnabled: kbs.letterSoundEnabled ?? (saved?.letterSpeakEnabled as boolean | undefined) ?? DEFAULT_SETTINGS.letterSpeakEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const STORAGE_KEY = 'sp_settings';
const MODE_STORAGE_KEY = 'sp_practice_mode';

function loadSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function loadInitialMode(): PracticeMode {
  try {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved && ['watch-speak', 'dictation', 'typing', 'shadowing'].includes(saved)) {
      return saved as PracticeMode;
    }
  } catch { /* ignore */ }
  return 'typing';
}

function saveSettings(obj: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* ignore */ }
}

interface UsePracticeSettingsArgs {
  initialMode?: PracticeMode;
}

export function usePracticeSettings({ initialMode = 'typing' }: UsePracticeSettingsArgs = {}) {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(() => {
    const saved = loadInitialMode();
    return saved !== 'typing' ? saved : initialMode;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState(loadInitialSettings);

  const showGrammarTags = settings.showGrammarTags;
  const showIllustration = settings.showIllustration;
  const wordRearrangeMode = settings.wordRearrangeMode;

  const handleSettingsChange = (key: string, value: unknown) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    if (key === 'soundEffectsEnabled') {
      try {
        const kbs = getKeyboardSoundSettings();
        saveKeyboardSoundSettings({
          ...kbs,
          soundEnabled: value as boolean,
        });
      } catch { /* ignore */ }
    }
    if (key === 'letterSpeakEnabled') {
      try {
        const kbs = getKeyboardSoundSettings();
        saveKeyboardSoundSettings({
          ...kbs,
          letterSoundEnabled: value as boolean,
        });
      } catch { /* ignore */ }
    }
  };

  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  const handleToggleGrammarTags = () => {
    setSettings((prev) => {
      const next = { ...prev, showGrammarTags: !prev.showGrammarTags };
      saveSettings(next);
      return next;
    });
  };

  const handleToggleIllustration = () => {
    setSettings((prev) => {
      const next = { ...prev, showIllustration: !prev.showIllustration };
      saveSettings(next);
      return next;
    });
  };

  const handleToggleWordRearrange = () => {
    setSettings((prev) => {
      const next = { ...prev, wordRearrangeMode: !prev.wordRearrangeMode };
      saveSettings(next);
      return next;
    });
  };

  const handleModeChange = (mode: PracticeMode) => {
    setPracticeMode(mode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch { /* ignore */ }
  };

  const handleSwitchMode = () => {
    const modes: PracticeMode[] = ['watch-speak', 'dictation', 'typing', 'shadowing'];
    const currentIdx = modes.indexOf(practiceMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    handleModeChange(nextMode);
  };

  return {
    practiceMode,
    isPaused,
    showGrammarTags,
    showIllustration,
    wordRearrangeMode,
    settings,
    handleSettingsChange,
    handlePauseToggle,
    handleToggleGrammarTags,
    handleToggleIllustration,
    handleToggleWordRearrange,
    handleModeChange,
    handleSwitchMode,
  };
}

export function usePauseTimer() {
  const [showPause, setShowPause] = useState(false);
  const pauseTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (pauseTimerRef.current) {
        window.clearTimeout(pauseTimerRef.current);
      }
      pauseTimerRef.current = window.setTimeout(() => {
        setShowPause(true);
      }, 60_000);
    };
    resetTimer();
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) => document.addEventListener(evt, resetTimer));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, resetTimer));
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    };
  }, []);

  const handleClosePause = () => {
    setShowPause(false);
    lastActivityRef.current = Date.now();
  };

  return {
    showPause,
    handleClosePause,
  };
}

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'warning' | 'info'>('success');

  const show = (msg: string, t: 'success' | 'warning' | 'info' = 'success') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return { visible, message, type, show, hide };
}
