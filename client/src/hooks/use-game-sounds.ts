import { useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '@client/src/pages/SettingsPage/store/settingsStore';
import {
  playCorrectSound,
  playVictorySound,
  playStarSound,
  setMasterVolume,
  resumeAudio,
} from '@client/src/utils/game-sounds';

export function useGameSounds() {
  const correctSound = useSettingsStore((s) => s.soundEffects.correctSound);
  const victorySound = useSettingsStore((s) => s.soundEffects.victorySound);
  const starSound = useSettingsStore((s) => s.soundEffects.starSound);
  const volume = useSettingsStore((s) => s.soundEffects.volume);

  const resumedRef = useRef<boolean>(false);

  const ensureResumed = useCallback((): void => {
    if (!resumedRef.current) {
      resumeAudio();
      resumedRef.current = true;
    }
  }, []);

  // 同步全局音量
  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  const playCorrect = useCallback((): void => {
    if (!correctSound) return;
    ensureResumed();
    playCorrectSound();
  }, [correctSound, ensureResumed]);

  const playVictory = useCallback((): void => {
    if (!victorySound) return;
    ensureResumed();
    playVictorySound();
  }, [victorySound, ensureResumed]);

  const playStar = useCallback((): void => {
    if (!starSound) return;
    ensureResumed();
    playStarSound();
  }, [starSound, ensureResumed]);

  return { playCorrect, playVictory, playStar };
}
