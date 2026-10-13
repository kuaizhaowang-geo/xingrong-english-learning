import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { learnersApi } from '@client/src/api';
import type { LearnerPreferences } from '@shared/api.interface';

// ─── 发音设置 ───
export type VoiceType =
  | 'britishMale'
  | 'britishFemale'
  | 'americanMale'
  | 'americanFemale';

export interface PronunciationSettings {
  voiceType: VoiceType;
  speechRate: number;
  volume: number;
  autoPronounce: boolean; // 切题后自动朗读
  pronounceOnCorrect: boolean; // 答题正确后朗读
  readCount: number; // 朗读次数 1-5
  readInterval: number; // 朗读间隔 1-5秒
  autoPlayAfterEvaluation: boolean; // 口语评测结束后自动播放发音
  // 兼容字段（保留旧数据）
  accent?: 'british' | 'american';
  voiceTypeLegacy?: string;
}

// ─── 音效设置 ───
export type TypingSoundType = 'original' | 'mechanical' | 'mute';
export type CorrectSoundType = 'clear' | 'dingdong' | 'mute';
export type WrongSoundType = 'alert' | 'buzz' | 'mute';
export type CompleteSoundType = 'curtain' | 'cheer' | 'mute';

export interface SoundEffectsSettings {
  switchQuestionSound: boolean; // 切题音效
  evaluationEndSound: boolean; // 口语评测结束音效
  typingSoundType: TypingSoundType; // 打字音效类型
  typingSoundVolume: number; // 打字音音量
  correctSoundType: CorrectSoundType; // 答题正确音效
  correctSoundVolume: number; // 正确音效音量
  wrongSoundType: WrongSoundType; // 答题错误音效
  wrongSoundVolume: number; // 错误音效音量
  completeSoundType: CompleteSoundType; // 课程完成音效
  completeSoundVolume: number; // 完成音效音量
  // 兼容旧字段
  keySound?: boolean;
  correctSound?: boolean;
  wrongSound?: boolean;
  victorySound?: boolean;
  starSound?: boolean;
  bgSound?: boolean;
  volume?: number;
}

// ─── 答题设置 ───
export interface AnswerSettings {
  showTranslation: boolean; // 显示翻译
  showEvaluationAfterAnswer: boolean; // 答题后显示口语评测
  autoNextOnCorrect: boolean; // 答题正确后自动下一题
  ignoreProperNouns: boolean; // 忽略人名
  ignoreCase: boolean; // 忽略大小写
  autoShowAnswer: boolean; // 答案自动显示
  showAnswerAfterErrors: number; // 错误几次时显示答案 1-5
  spaceInputMode: 'auto' | 'manual'; // 空格输入模式：auto=自动处理空格, manual=需要点击空格
  // 兼容旧字段
  autoSubmit?: boolean;
  spaceSubmit?: boolean;
  autoSlowDown?: boolean;
}

// ─── 听力设置 ───
export interface ListeningSettings {
  playCount: number; // 听力播放次数 1-5
  playInterval: number; // 听力播放间隔 1-5秒
  autoPlay: boolean; // 听力自动播放
  playRate: number; // 听力语速 0.5-2
  // 兼容旧字段
  dictationCount?: number;
  dictationInterval?: number;
}

// ─── 个性化设置 ───
export type ThemeMode = 'deepPurple' | 'dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large';
export type KeyboardStyle = 'neon' | 'classic' | 'minimal';

export interface PersonalizationSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  keyboardStyle: KeyboardStyle;
  showFingerGuide: boolean; // 指法引导
  autoPronounce: boolean; // 自动发音
  // 兼容旧字段
  showKeyboard?: boolean;
  showVirtualHands?: boolean;
  highlightTargetKey?: boolean;
  showIllustration?: boolean;
  defaultTextbookVersion?: string;
}

// ─── 快捷键设置 ───
export type ShortcutActionKey =
  | 'playRead'
  | 'markMastered'
  | 'markNewWord'
  | 'skipQuestion'
  | 'resetProgress';

export interface ShortcutsSettings {
  playRead: string; // 播放朗读
  markMastered: string; // 标记掌握
  markNewWord: string; // 标记生词
  skipQuestion: string; // 跳过题目
  resetProgress: string; // 重置进度
  // 兼容旧字段
  space?: string;
  tab?: string;
  arrowLeft?: string;
  arrowRight?: string;
  ctrlM?: string;
  ctrlQ?: string;
  r?: string;
  h?: string;
}

// ─── 系统设置 ───
export interface SystemSettings {
  lastSyncTime: string;
  version: string;
}

// ─── 学习偏好（与后端 LearnerPreferences 同步） ───
export type LearningPreferences = LearnerPreferences;

const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  dailyGoalMinutes: 30,
  reminderEnabled: false,
  reminderTime: '20:00',
  wordMode: 'recognition',
  wordDisplayMode: 'card',
  difficultyPreference: 'beginner',
  dailyNewWords: 20,
};

// ─── 全局设置 ───
export interface AppSettings {
  pronunciation: PronunciationSettings;
  soundEffects: SoundEffectsSettings;
  answer: AnswerSettings;
  listening: ListeningSettings;
  personalization: PersonalizationSettings;
  shortcuts: ShortcutsSettings;
  system: SystemSettings;
  learning: LearningPreferences;
  // 兼容旧分组（保留数据不丢失）
  animations?: Record<string, unknown>;
}

const DEFAULT_SETTINGS: AppSettings = {
  pronunciation: {
    voiceType: 'americanFemale',
    speechRate: 1.0,
    volume: 70,
    autoPronounce: true,
    pronounceOnCorrect: true,
    readCount: 1,
    readInterval: 2,
    autoPlayAfterEvaluation: false,
  },
  soundEffects: {
    switchQuestionSound: true,
    evaluationEndSound: true,
    typingSoundType: 'original',
    typingSoundVolume: 60,
    correctSoundType: 'dingdong',
    correctSoundVolume: 70,
    wrongSoundType: 'alert',
    wrongSoundVolume: 70,
    completeSoundType: 'cheer',
    completeSoundVolume: 75,
  },
  answer: {
    showTranslation: true,
    showEvaluationAfterAnswer: true,
    autoNextOnCorrect: false,
    ignoreProperNouns: false,
    ignoreCase: true,
    autoShowAnswer: true,
    showAnswerAfterErrors: 3,
    spaceInputMode: 'auto',
  },
  listening: {
    playCount: 2,
    playInterval: 2,
    autoPlay: true,
    playRate: 1.0,
  },
  personalization: {
    theme: 'deepPurple',
    fontSize: 'medium',
    keyboardStyle: 'neon',
    showFingerGuide: true,
    autoPronounce: true,
  },
  shortcuts: {
    playRead: 'Ctrl+A',
    markMastered: 'Ctrl+M',
    markNewWord: 'Ctrl+Q',
    skipQuestion: 'Ctrl+ArrowRight',
    resetProgress: 'Ctrl+R',
  },
  system: {
    lastSyncTime: '',
    version: '1.0.0',
  },
  learning: DEFAULT_LEARNING_PREFERENCES,
};

interface SettingsState extends AppSettings {
  setPronunciation: (patch: Partial<PronunciationSettings>) => void;
  setSoundEffects: (patch: Partial<SoundEffectsSettings>) => void;
  setAnswer: (patch: Partial<AnswerSettings>) => void;
  setListening: (patch: Partial<ListeningSettings>) => void;
  setPersonalization: (patch: Partial<PersonalizationSettings>) => void;
  setShortcuts: (patch: Partial<ShortcutsSettings>) => void;
  setSystem: (patch: Partial<SystemSettings>) => void;
  setLearning: (patch: Partial<LearningPreferences>) => Promise<void>;
  syncFromBackend: () => Promise<void>;
  backendSynced: boolean;
  resetAllSettings: () => void;
}

function deepMergeLearning(
  target: LearningPreferences,
  source: Partial<LearningPreferences>,
): LearningPreferences {
  const result: LearningPreferences = { ...target, ...source };
  (Object.keys(result) as Array<keyof LearningPreferences>).forEach(
    (key: keyof LearningPreferences) => {
      if (result[key] === undefined) {
        delete result[key];
      }
    },
  );
  return result;
}

/**
 * 迁移旧数据到新结构，保持向后兼容。
 * 从 localStorage 反序列化时调用，确保旧版本数据不丢失。
 */
function migrateSettings(loaded: unknown): AppSettings {
  const raw = (loaded ?? {}) as Record<string, Record<string, unknown>>;

  // ── 发音设置迁移 ──
  const oldPron = raw.pronunciation ?? {};
  const pronunciation: PronunciationSettings = {
    ...DEFAULT_SETTINGS.pronunciation,
    ...oldPron,
  };
  // 旧 voiceType + accent 迁移到新 voiceType
  const oldVoice = oldPron.voiceType as string | undefined;
  const oldAccent = oldPron.accent as string | undefined;
  if (oldVoice && oldAccent && !isNewVoiceType(pronunciation.voiceType)) {
    if (oldAccent === 'british') {
      if (oldVoice.includes('Female') || oldVoice === 'youngFemale' || oldVoice === 'child') {
        pronunciation.voiceType = 'britishFemale';
      } else {
        pronunciation.voiceType = 'britishMale';
      }
    } else {
      if (oldVoice.includes('Female') || oldVoice === 'youngFemale' || oldVoice === 'child') {
        pronunciation.voiceType = 'americanFemale';
      } else {
        pronunciation.voiceType = 'americanMale';
      }
    }
  }
  // 旧 autoPronounce 映射
  if (typeof oldPron.autoPronounce === 'boolean') {
    pronunciation.pronounceOnCorrect = oldPron.autoPronounce as boolean;
  }

  // ── 音效设置迁移 ──
  const oldSe = raw.soundEffects ?? {};
  const soundEffects: SoundEffectsSettings = {
    ...DEFAULT_SETTINGS.soundEffects,
    ...oldSe,
  };
  // 旧全局 volume 作为各类音量默认
  if (typeof oldSe.volume === 'number') {
    if (typeof oldSe.typingSoundVolume !== 'number') {
      soundEffects.typingSoundVolume = oldSe.volume as number;
    }
    if (typeof oldSe.correctSoundVolume !== 'number') {
      soundEffects.correctSoundVolume = oldSe.volume as number;
    }
    if (typeof oldSe.wrongSoundVolume !== 'number') {
      soundEffects.wrongSoundVolume = oldSe.volume as number;
    }
    if (typeof oldSe.completeSoundVolume !== 'number') {
      soundEffects.completeSoundVolume = oldSe.volume as number;
    }
  }

  // ── 答题设置迁移 ──
  const oldAns = raw.answer ?? {};
  const answer: AnswerSettings = {
    ...DEFAULT_SETTINGS.answer,
    ...oldAns,
  };

  // ── 听力设置迁移 ──
  const oldLis = raw.listening ?? {};
  const listening: ListeningSettings = {
    ...DEFAULT_SETTINGS.listening,
    ...oldLis,
  };
  if (typeof oldLis.dictationCount === 'number' && typeof oldLis.playCount !== 'number') {
    listening.playCount = oldLis.dictationCount as number;
  }
  if (typeof oldLis.dictationInterval === 'number' && typeof oldLis.playInterval !== 'number') {
    listening.playInterval = oldLis.dictationInterval as number;
  }

  // ── 个性化设置迁移 ──
  const oldPer = raw.personalization ?? {};
  const personalization: PersonalizationSettings = {
    ...DEFAULT_SETTINGS.personalization,
    ...oldPer,
  };

  // ── 快捷键设置迁移 ──
  const oldSc = raw.shortcuts ?? {};
  const shortcuts: ShortcutsSettings = {
    ...DEFAULT_SETTINGS.shortcuts,
    ...oldSc,
  };

  // ── 系统设置迁移 ──
  const oldSys = raw.system ?? {};
  const system: SystemSettings = {
    ...DEFAULT_SETTINGS.system,
    ...oldSys,
  };

  // ── 学习偏好 ──
  const learning: LearningPreferences = {
    ...DEFAULT_LEARNING_PREFERENCES,
    ...(raw.learning ?? {}),
  } as LearningPreferences;

  return {
    pronunciation,
    soundEffects,
    answer,
    listening,
    personalization,
    shortcuts,
    system,
    learning,
    animations: raw.animations,
  };
}

function isNewVoiceType(v: string): v is VoiceType {
  return (
    v === 'britishMale' ||
    v === 'britishFemale' ||
    v === 'americanMale' ||
    v === 'americanFemale'
  );
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      backendSynced: false,

      setPronunciation: (patch) =>
        set((state) => ({
          pronunciation: { ...state.pronunciation, ...patch },
        })),

      setSoundEffects: (patch) =>
        set((state) => ({
          soundEffects: { ...state.soundEffects, ...patch },
        })),

      setAnswer: (patch) =>
        set((state) => ({
          answer: { ...state.answer, ...patch },
        })),

      setListening: (patch) =>
        set((state) => ({
          listening: { ...state.listening, ...patch },
        })),

      setPersonalization: (patch) =>
        set((state) => ({
          personalization: { ...state.personalization, ...patch },
        })),

      setShortcuts: (patch) =>
        set((state) => ({
          shortcuts: { ...state.shortcuts, ...patch },
        })),

      setSystem: (patch) =>
        set((state) => ({
          system: { ...state.system, ...patch },
        })),

      setLearning: async (patch: Partial<LearningPreferences>) => {
        const currentLearning: LearningPreferences = get().learning;
        const nextLearning: LearningPreferences = deepMergeLearning(
          currentLearning,
          patch,
        );

        set({ learning: nextLearning });

        try {
          await learnersApi.updateMe({ preferences: nextLearning });
        } catch (err) {
          logger.error({
            level: 'error',
            args: ['同步学习偏好到后端失败', err],
          });
        }
      },

      syncFromBackend: async () => {
        try {
          const profile = await learnersApi.getMe();
          if (profile.preferences) {
            const merged: LearningPreferences = deepMergeLearning(
              DEFAULT_LEARNING_PREFERENCES,
              profile.preferences,
            );
            set({
              learning: merged,
              backendSynced: true,
              system: { ...get().system, lastSyncTime: new Date().toISOString() },
            });
          } else {
            set({
              backendSynced: true,
              system: { ...get().system, lastSyncTime: new Date().toISOString() },
            });
          }
        } catch (err) {
          logger.error({
            level: 'error',
            args: ['从后端拉取学习偏好失败，使用本地缓存', err],
          });
        }
      },

      resetAllSettings: () => {
        const currentLearning = get().learning;
        set({
          ...DEFAULT_SETTINGS,
          learning: currentLearning, // 保留学习偏好
          backendSynced: get().backendSynced,
        });
      },
    }),
    {
      name: 'xr-settings-v2',
      partialize: (state) => ({
        pronunciation: state.pronunciation,
        soundEffects: state.soundEffects,
        answer: state.answer,
        listening: state.listening,
        personalization: state.personalization,
        shortcuts: state.shortcuts,
        system: state.system,
        learning: state.learning,
        animations: state.animations,
      }),
      // 版本迁移：加载时自动迁移旧字段到新结构
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try {
          const migrated = migrateSettings(state as unknown as Record<string, unknown>);
          Object.assign(state, migrated);
        } catch (err) {
          logger.error({
            level: 'error',
            args: ['设置数据迁移失败', err],
          });
        }
      },
    },
  ),
);
