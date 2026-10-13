// 打字练习核心逻辑 Hook
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { soundManager } from '@client/src/utils/soundManager';
import {
  CHINESE_CHARS,
  CHINESE_WORDS,
  CHINESE_SENTENCES,
  ENGLISH_LETTERS,
  ENGLISH_WORDS,
  ENGLISH_SENTENCES,
  CHINESE_MODES,
  ENGLISH_MODES,
  type ChineseMode,
  type EnglishMode,
  type Language,
} from '../data/typingData';
import { removeTones, calcSpeed, calcAccuracy, isPunctuation, getPinyinForChar, getPinyinForText } from './pinyinUtils';

export interface UseTypingEngineOptions {
  language: Language;
  zhMode: ChineseMode;
  enMode: EnglishMode;
  soundEnabled: boolean;
  isPaused: boolean;
  viewActive: boolean;
  customWordList?: string[];
  /** 课程内容字符串，有值时优先用它生成练习列表 */
  courseContent?: string;
}

export interface UseTypingEngineReturn {
  // 内容
  currentList: any[];
  targetText: string;
  // 导航
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  handlePrev: () => void;
  handleNext: () => void;
  handleJumpTo: (index: number) => void;
  // 输入
  userInput: string;
  charStates: Array<'correct' | 'wrong' | 'pending'>;
  feedback: 'none' | 'correct' | 'wrong';
  handleInputChange: (value: string) => void;
  handleBackspace: () => void;
  handleSpacePress: () => void;
  // 统计
  correctCount: number;
  wrongCount: number;
  masteredCount: number;
  unfamiliarCount: number;
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  elapsedSeconds: number;
  freeSpeed: number;
  freeAccuracy: number;
  wpm: number;
  cpm: number;
  wpmHistory: number[];
  totalCorrectChars: number;
  totalTypedChars: number;
  // 操作
  handleMastered: () => void;
  handleUnfamiliar: () => void;
  handleResetProgress: () => void;
  handleSwitchMode: () => void;
  handleSpeak: () => void;
  // 工具
  isFreeMode: boolean;
  totalItems: number;
}

export function useTypingEngine({
  language,
  zhMode,
  enMode,
  soundEnabled,
  isPaused,
  viewActive,
  customWordList,
  courseContent,
}: UseTypingEngineOptions): UseTypingEngineReturn {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [userInput, setUserInput] = useState<string>('');
  const [charStates, setCharStates] = useState<Array<'correct' | 'wrong' | 'pending'>>([]);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [masteredCount, setMasteredCount] = useState<number>(0);
  const [unfamiliarCount, setUnfamiliarCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [freeTotalKeystrokes, setFreeTotalKeystrokes] = useState<number>(0);
  const [freeCorrectChars, setFreeCorrectChars] = useState<number>(0);
  const [totalCorrectChars, setTotalCorrectChars] = useState<number>(0);
  const [totalTypedChars, setTotalTypedChars] = useState<number>(0);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);

  const timerRef = useRef<number | null>(null);

  const isFreeMode = language === 'zh' && zhMode === 'ziyou';

  // ─── 从课程内容生成列表 ──────────────────────────────
  const courseDerivedList = useMemo(() => {
    if (!courseContent || courseContent.trim().length === 0) return null;
    const trimmed = courseContent.trim();
    if (language === 'zh') {
      // 中文：每个字符作为一个汉字项，用内置拼音库填充拼音
      const chars = Array.from(trimmed).filter((c) => c.trim() !== '');
      return chars.map((char) => {
        const py = getPinyinForChar(char);
        return {
          char,
          pinyin: py,
          radical: '',
          strokes: 0,
        };
      });
    }
    // 英文
    switch (enMode) {
      case 'letter': {
        const letters = trimmed.split('').filter((c) => /[a-zA-Z]/.test(c));
        return letters.map((l) => l.toLowerCase());
      }
      case 'word': {
        if (customWordList && customWordList.length > 0) {
          return customWordList.map((w) => ({ word: w, meaning: '', phonetic: '' }));
        }
        const words = trimmed.split(/[\s\n]+/).filter((w) => w.length > 0);
        return words.map((w) => ({ word: w, meaning: '', phonetic: '' }));
      }
      case 'sentence': {
        const sentences = trimmed
          .split(/[.!？。！\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        return sentences.map((s) => ({ sentence: s, meaning: '' }));
      }
      default:
        return [];
    }
  }, [courseContent, language, zhMode, enMode, customWordList]);

  // ─── 当前练习内容列表 ────────────────────────────────
  const currentList = useMemo(() => {
    if (courseDerivedList && courseDerivedList.length > 0) {
      return courseDerivedList;
    }
    if (language === 'zh') {
      switch (zhMode) {
        case 'pinyin':
        case 'hanzi':
          return CHINESE_CHARS;
        case 'ciyu':
          return CHINESE_WORDS;
        case 'juzi':
          return CHINESE_SENTENCES;
        case 'ziyou':
          return [];
        default:
          return [];
      }
    } else {
      switch (enMode) {
        case 'letter':
          return ENGLISH_LETTERS;
        case 'word':
          if (customWordList && customWordList.length > 0) {
            return customWordList.map((w) => ({ word: w, meaning: '', phonetic: '' }));
          }
          return ENGLISH_WORDS;
        case 'sentence':
          return ENGLISH_SENTENCES;
        default:
          return [];
      }
    }
  }, [language, zhMode, enMode, customWordList, courseDerivedList]);

  // ─── 当前目标文本 ──────────────────────────────────
  const targetText = useMemo(() => {
    const item: any = currentList[currentIndex];
    if (!item) return '';

    if (language === 'zh') {
      // 中文模式
      if (typeof item === 'object' && 'char' in item) {
        const py = item.pinyin || getPinyinForChar(item.char);
        return removeTones(py).toLowerCase();
      }
      if (typeof item === 'object' && 'word' in item && Array.isArray(item.pinyin)) {
        return item.pinyin.map((p: string) => removeTones(p).toLowerCase()).join('');
      }
      if (typeof item === 'object' && 'sentence' in item && Array.isArray(item.pinyin)) {
        return item.pinyin
          .map((p: string) => (isPunctuation(p) ? p : removeTones(p).toLowerCase()))
          .join('');
      }
      return '';
    } else {
      // 英文
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && 'word' in item) return item.word ?? '';
      if (typeof item === 'object' && 'sentence' in item) return item.sentence ?? '';
      return '';
    }
  }, [currentList, currentIndex, language]);

  // ─── 计时器 ───────────────────────────────────
  useEffect(() => {
    if (isPaused || !viewActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, viewActive]);

  // ─── 正确率计算 ─────────────────────────────────
  const accuracy = useMemo(() => {
    const total = correctCount + wrongCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 1000) / 10;
  }, [correctCount, wrongCount]);

  const freeAccuracy = useMemo(
    () => calcAccuracy(freeCorrectChars, freeTotalKeystrokes),
    [freeCorrectChars, freeTotalKeystrokes],
  );
  const freeSpeed = useMemo(
    () => calcSpeed(freeCorrectChars, elapsedSeconds),
    [freeCorrectChars, elapsedSeconds],
  );

  const minutes = useMemo(
    () => Math.max(elapsedSeconds / 60, 0.01),
    [elapsedSeconds],
  );

  const wpm = useMemo(() => {
    if (language === 'zh') {
      if (isFreeMode) return 0;
      return 0;
    }
    if (isFreeMode) {
      return Math.round((freeCorrectChars / 5 / minutes) * 10) / 10;
    }
    return Math.round((correctCount / minutes) * 10) / 10;
  }, [language, isFreeMode, correctCount, freeCorrectChars, minutes]);

  const cpm = useMemo(() => {
    if (isFreeMode) {
      return Math.round((freeCorrectChars / minutes) * 10) / 10;
    }
    return Math.round((totalCorrectChars / minutes) * 10) / 10;
  }, [isFreeMode, freeCorrectChars, totalCorrectChars, minutes]);

  // ─── 速度历史（每 5 秒记录一次） ────────────────────
  useEffect(() => {
    if (elapsedSeconds === 0) return;
    if (elapsedSeconds % 5 !== 0) return;
    const speedValue = language === 'zh' ? cpm : wpm;
    setWpmHistory((prev) => [...prev, speedValue]);
  }, [elapsedSeconds, language, cpm, wpm]);

  // ─── 重置当前题状态 ───────────────────────────────
  const resetCurrentItem = useCallback(() => {
    setUserInput('');
    setFeedback('none');
    const targetLen = targetText.length;
    setCharStates(new Array(targetLen).fill('pending'));
  }, [targetText]);

  // 切换时重置
  useEffect(() => {
    resetCurrentItem();
  }, [currentIndex, language, zhMode, enMode, resetCurrentItem]);

  // ─── 标记正误 ───────────────────────────────────
  const markCorrect = useCallback(() => {
    setCorrectCount((c) => c + 1);
    setCurrentStreak((s) => {
      const next = s + 1;
      setBestStreak((b) => Math.max(b, next));
      return next;
    });
    setFeedback('correct');
    const tLen = targetText.length;
    setTotalCorrectChars((n) => n + tLen);
    setTotalTypedChars((n) => n + tLen);
    if (soundEnabled) {
      soundManager.ensureContext();
      soundManager.playComplete();
    }
  }, [soundEnabled, targetText]);

  const markWrong = useCallback(() => {
    setWrongCount((c) => c + 1);
    setCurrentStreak(0);
    setFeedback('wrong');
    setTotalTypedChars((n) => n + targetText.length);
    if (soundEnabled) {
      soundManager.ensureContext();
      soundManager.playWrong();
    }
  }, [soundEnabled, targetText]);

  // ─── 输入处理 ───────────────────────────────────
  const handleInputChange = useCallback(
    (value: string) => {
      if (feedback === 'correct') return;

      if (isFreeMode) {
        const prevLen = userInput.length;
        if (value.length > prevLen) {
          const diff = value.length - prevLen;
          setFreeTotalKeystrokes((t) => t + diff);
          setFreeCorrectChars((c) => c + diff);
          setTotalTypedChars((n) => n + diff);
          setTotalCorrectChars((n) => n + diff);
        }
        setUserInput(value);
        return;
      }

      setUserInput(value);
      if (feedback === 'wrong') setFeedback('none');

      const target = targetText.toLowerCase();
      const inputLower = value.toLowerCase();

      // 目标文本为空（如中文课程无拼音库）时跳过校验，状态全部 pending
      if (target.length === 0) {
        setCharStates([]);
        return;
      }

      const states: Array<'correct' | 'wrong' | 'pending'> = [];
      let correct = 0;
      let wrong = 0;

      for (let i = 0; i < target.length; i += 1) {
        if (i >= inputLower.length) {
          states.push('pending');
        } else if (inputLower[i] === target[i]) {
          states.push('correct');
          correct += 1;
        } else {
          states.push('wrong');
          wrong += 1;
        }
      }
      setCharStates(states);

      if (value.length >= target.length) {
        const isCorrect = correct === target.length && wrong === 0;
        if (isCorrect) {
          markCorrect();
        } else {
          markWrong();
        }
      }
    },
    [feedback, targetText, userInput.length, isFreeMode, markCorrect, markWrong],
  );

  const handleBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    setUserInput((prev) => prev.slice(0, -1));
    if (feedback === 'wrong') setFeedback('none');
  }, [feedback]);

  // ─── 导航 ─────────────────────────────────────
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < currentList.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, currentList.length]);

  const handleJumpTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleMastered = useCallback(() => {
    setMasteredCount((c) => c + 1);
    handleNext();
  }, [handleNext]);

  const handleUnfamiliar = useCallback(() => {
    setUnfamiliarCount((c) => c + 1);
    handleNext();
  }, [handleNext]);

  const handleSwitchMode = useCallback(() => {
    // 由外部控制切换，这里仅提供重置入口（通过 zhMode/enMode 变化触发 reset）
  }, []);

  const handleResetProgress = useCallback(() => {
    setCurrentIndex(0);
    setFeedback('none');
    setUserInput('');
    setCorrectCount(0);
    setWrongCount(0);
    setMasteredCount(0);
    setUnfamiliarCount(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setElapsedSeconds(0);
    setFreeTotalKeystrokes(0);
    setFreeCorrectChars(0);
    setTotalCorrectChars(0);
    setTotalTypedChars(0);
    setWpmHistory([]);
    resetCurrentItem();
  }, [resetCurrentItem]);

  // ─── 朗读 ─────────────────────────────────────
  const handleSpeak = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const item: any = currentList[currentIndex];
    if (!item) return;

    let text = '';
    const lang = language === 'zh' ? 'zh-CN' : 'en-US';

    if (typeof item === 'string') {
      text = item;
    } else if (typeof item === 'object') {
      if ('char' in item) text = item.char ?? '';
      else if ('word' in item) text = item.word ?? '';
      else if ('sentence' in item) text = item.sentence ?? '';
    }

    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }, [currentList, currentIndex, language]);

  // ─── 空格键 ────────────────────────────────────
  const handleSpacePress = useCallback(() => {
    if (isFreeMode) {
      setUserInput((prev) => prev + ' ');
      return;
    }
    if (feedback === 'correct') {
      handleNext();
    }
  }, [isFreeMode, feedback, handleNext]);

  return {
    currentList,
    targetText,
    currentIndex,
    setCurrentIndex,
    handlePrev,
    handleNext,
    handleJumpTo,
    userInput,
    charStates,
    feedback,
    handleInputChange,
    handleBackspace,
    handleSpacePress,
    correctCount,
    wrongCount,
    masteredCount,
    unfamiliarCount,
    currentStreak,
    bestStreak,
    accuracy,
    elapsedSeconds,
    freeSpeed,
    freeAccuracy,
    wpm,
    cpm,
    wpmHistory,
    totalCorrectChars,
    totalTypedChars,
    handleMastered,
    handleUnfamiliar,
    handleResetProgress,
    handleSwitchMode,
    handleSpeak,
    isFreeMode,
    totalItems: currentList.length,
  };
}
