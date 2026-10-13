import { useState, useCallback, useEffect } from 'react';

export function isAutoSpeakEnabled(): boolean {
  try {
    const raw = localStorage.getItem('keyboard_sound_settings');
    if (raw) {
      const s = JSON.parse(raw);
      return s.autoPronounceEnabled !== false;
    }
  } catch {
    /* ignore */
  }
  return true;
}

export function useAutoSpeakSetting(): { enabled: boolean; refresh: () => void } {
  const [enabled, setEnabled] = useState<boolean>(isAutoSpeakEnabled());

  const refresh = useCallback(() => {
    setEnabled(isAutoSpeakEnabled());
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent): void => {
      if (e.key === 'keyboard_sound_settings') refresh();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

  return { enabled, refresh };
}
