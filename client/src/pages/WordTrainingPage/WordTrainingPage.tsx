import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePracticeBack from '@client/src/hooks/use-practice-back';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Loader2, Pause, Volume2, AlertTriangle } from 'lucide-react';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import { useSettingsStore } from '@client/src/pages/SettingsPage/store/settingsStore';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { getWords } from '@client/src/api/user-created-courses';
import type { UnitWord } from '@client/src/api/user-created-courses';

import WordPracticeTopBar from './components/WordPracticeTopBar';
import WordPracticeContentArea from './components/WordPracticeContentArea';
import WordPracticeKeyboardArea from './components/WordPracticeKeyboardArea';
import CompletionModal from '../SentencePracticePage/modals/CompletionModal';

interface WordItem {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
}

const MOCK_WORDS: WordItem[] = [
  { word: 'abandon', phonetic: '/əˈbændən/', pos: 'v.', meaning: '放弃；抛弃；遗弃', example: 'He abandoned his car in the snow.' },
  { word: 'brilliant', phonetic: '/ˈbrɪliənt/', pos: 'adj.', meaning: '杰出的；明亮的；才华横溢的', example: 'She had a brilliant idea.' },
  { word: 'consequence', phonetic: '/ˈkɒnsɪkwəns/', pos: 'n.', meaning: '结果；后果；重要性', example: 'You must accept the consequences.' },
  { word: 'diligent', phonetic: '/ˈdɪlɪdʒənt/', pos: 'adj.', meaning: '勤奋的；勤勉的；用功的', example: 'She is a diligent student.' },
  { word: 'endeavor', phonetic: '/ɪnˈdevər/', pos: 'v./n.', meaning: '努力；尽力；尝试', example: 'We endeavor to provide the best service.' },
];

const MODE_LIST: PracticeMode[] = ['watch-speak', 'dictation', 'typing', 'shadowing'];

// URL mode 参数 → 内部 PracticeMode 映射
const URL_MODE_TO_PRACTICE_MODE: Record<string, PracticeMode> = {
  typing: 'typing',
  dictation: 'dictation',
  follow: 'shadowing',
  speak: 'watch-speak',
};

// 内部 PracticeMode → URL mode 参数映射
const PRACTICE_MODE_TO_URL_MODE: Record<PracticeMode, string> = {
  typing: 'typing',
  dictation: 'dictation',
  shadowing: 'follow',
  'watch-speak': 'speak',
};

function mapUnitWordToWordItem(uw: UnitWord): WordItem {
  return {
    word: uw.word,
    phonetic: uw.phonetic ?? '',
    pos: uw.partOfSpeech ?? '',
    meaning: uw.meaning,
    example: uw.example ?? '',
  };
}

const WordTrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const handleBack = usePracticeBack();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── 单词列表（URL 参数驱动） ─────────────────────────
  const unitId = searchParams.get('unitId');
  const [wordList, setWordList] = useState<WordItem[]>(MOCK_WORDS);
  const [wordLoading, setWordLoading] = useState<boolean>(false);
  const [wordLoadError, setWordLoadError] = useState<string | null>(null);

  // 从 URL 读取 mode 参数作为初始模式
  const urlMode = searchParams.get('mode');
  const initialMode: PracticeMode = URL_MODE_TO_PRACTICE_MODE[urlMode ?? ''] ?? 'typing';

  // ─── 状态 ─────────────────────────────────────────
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(initialMode);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // 设置开关
  const [letterBreakdown, setLetterBreakdown] = useState<boolean>(true);
  const [showIllustration, setShowIllustration] = useState<boolean>(true);
  const [letterScramble, setLetterScramble] = useState<boolean>(false);

  // 控制栏开关（哇学社风格）
  const [showMeaning, setShowMeaning] = useState<boolean>(true);
  const [showExample, setShowExample] = useState<boolean>(true);

  // 音标显示模式
  const [phoneticMode, setPhoneticMode] = useState<'none' | 'default' | 'breakdown' | 'phonics'>('default');

  // 设置
  const spaceInputMode = useSettingsStore((s) => s.answer.spaceInputMode);

  // 答题状态
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [userInput, setUserInput] = useState<string>('');
  const [answerHidden, setAnswerHidden] = useState<boolean>(false);

  // 听写模式
  const [dictationShowAnswer, setDictationShowAnswer] = useState<boolean>(false);

  // 跟读模式
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [shadowingScore, setShadowingScore] = useState<number | null>(null);
  const [shadowingHasRecorded, setShadowingHasRecorded] = useState<boolean>(false);
  const [shadowingShowAnswer, setShadowingShowAnswer] = useState<boolean>(true);

  // 看说模式
  const [watchSpeakRecording, setWatchSpeakRecording] = useState<boolean>(false);
  const [watchSpeakScore, setWatchSpeakScore] = useState<number | null>(null);
  const [watchSpeakHasRecorded, setWatchSpeakHasRecorded] = useState<boolean>(false);
  const [watchSpeakShowAnswer, setWatchSpeakShowAnswer] = useState<boolean>(false);

  // 字母重组模式
  const [selectedLetterIndexes, setSelectedLetterIndexes] = useState<number[]>([]);
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);

  // 统计数据
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [masteredCount, setMasteredCount] = useState<number>(0);
  const [unfamiliarCount, setUnfamiliarCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  const [showReport, setShowReport] = useState<boolean>(false);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);

  // 加载单词列表（unitId 变化时）
  useEffect(() => {
    if (!unitId) {
      setWordList(MOCK_WORDS);
      setWordLoading(false);
      setWordLoadError(null);
      return;
    }

    let cancelled = false;
    setWordLoading(true);
    setWordLoadError(null);
    // 切换单元时重置进度
    setCurrentIndex(0);
    setFeedback('none');
    setUserInput('');
    setCorrectCount(0);
    setWrongCount(0);
    setMasteredCount(0);
    setUnfamiliarCount(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setScore(0);
    setElapsedSeconds(0);
    setMasteryMap({});
    setCompletedSet(new Set());
    setShowReport(false);
    setShowCompletion(false);

    getWords(unitId)
      .then((words: UnitWord[]) => {
        if (cancelled) return;
        if (words.length === 0) {
          setWordList(MOCK_WORDS);
          setWordLoadError('该单元暂无单词，使用示例单词');
          return;
        }
        const mapped: WordItem[] = words.map(mapUnitWordToWordItem);
        setWordList(mapped);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('加载单词列表失败', err);
        setWordList(MOCK_WORDS);
        setWordLoadError('加载单词失败，使用示例单词');
        toast.error('加载单词失败');
      })
      .finally(() => {
        if (!cancelled) setWordLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [unitId]);

  // URL mode 参数变化时同步内部模式
  useEffect(() => {
    const modeFromUrl = searchParams.get('mode');
    if (modeFromUrl && URL_MODE_TO_PRACTICE_MODE[modeFromUrl]) {
      setPracticeMode(URL_MODE_TO_PRACTICE_MODE[modeFromUrl]);
    }
  }, [searchParams]);

  const currentWord = wordList[currentIndex];
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 掌握/不熟 Map
  const [masteryMap, setMasteryMap] = useState<Record<string, 'mastered' | 'review'>>({});
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

  // 字母打乱
  const scrambleWord = useCallback((word: string): string[] => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // 确保打乱后和原单词不一样
    if (letters.join('') === word && word.length > 1) {
      return scrambleWord(word);
    }
    return letters;
  }, []);

  useEffect(() => {
    if (letterScramble && currentWord) {
      setScrambledLetters(scrambleWord(currentWord.word));
      setSelectedLetterIndexes([]);
    }
  }, [currentIndex, letterScramble, currentWord, scrambleWord]);

  // 练习计时器
  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const accuracy = useMemo(() => {
    const total = correctCount + wrongCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  }, [correctCount, wrongCount]);

  // 切换模式时重置状态
  useEffect(() => {
    setFeedback('none');
    setUserInput('');
    setAnswerHidden(false);
    setDictationShowAnswer(false);
    setShadowingScore(null);
    setShadowingHasRecorded(false);
    setShadowingShowAnswer(true);
    setWatchSpeakRecording(false);
    setWatchSpeakScore(null);
    setWatchSpeakHasRecorded(false);
    setWatchSpeakShowAnswer(false);
    setIsRecording(false);
    setSelectedLetterIndexes([]);
    if (currentWord && letterScramble) {
      setScrambledLetters(scrambleWord(currentWord.word));
    }
  }, [practiceMode, currentIndex, letterScramble, currentWord, scrambleWord]);

  // 自动下一题
  useEffect(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (
      feedback === 'correct' &&
      currentIndex < wordList.length - 1
    ) {
      autoNextTimerRef.current = setTimeout(() => {
        handleNext();
        autoNextTimerRef.current = null;
      }, 300);
    }
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, currentIndex]);

  // 判断是否完成
  const isFinished = useMemo(
    () =>
      currentIndex >= wordList.length - 1 && feedback === 'correct',
    [currentIndex, feedback, wordList.length],
  );

  useEffect(() => {
    if (isFinished) {
      setShowCompletion(true);
      setShowReport(true);
    }
  }, [isFinished]);

  // ─── 处理函数 ─────────────────────────────────────

  const markCorrect = useCallback(() => {
    setCorrectCount((c) => c + 1);
    setCurrentStreak((s) => {
      const next = s + 1;
      setBestStreak((b) => Math.max(b, next));
      return next;
    });
    setScore((s) => s + 10);
    if (currentWord) {
      setCompletedSet((prev) => new Set(prev).add(currentWord.word));
    }
    setFeedback('correct');
  }, [currentWord]);

  const markWrong = useCallback(() => {
    setWrongCount((c) => c + 1);
    setCurrentStreak(0);
    setFeedback('wrong');
  }, []);

  // 打字模式输入
  const handleTypingInput = (value: string) => {
    if (feedback === 'correct') return;
    setUserInput(value);
    if (feedback === 'wrong') setFeedback('none');

    // 检查是否完成输入
    if (currentWord && value.length >= currentWord.word.length) {
      const isCorrect = value.toLowerCase() === currentWord.word.toLowerCase();
      if (isCorrect) {
        markCorrect();
      } else {
        markWrong();
      }
    }
  };

  // 打字模式提交
  const handleTypingSubmit = () => {
    if (!currentWord || feedback === 'correct') return;
    const isCorrect = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    if (isCorrect) {
      markCorrect();
    } else {
      markWrong();
    }
  };

  const handleTypingBackspace = () => {
    if (feedback === 'correct') return;
    setUserInput((prev) => prev.slice(0, -1));
    if (feedback === 'wrong') setFeedback('none');
  };

  // 听写模式
  const handleDictationInput = (value: string) => {
    if (feedback === 'correct') return;
    setUserInput(value);
    if (feedback === 'wrong') setFeedback('none');
  };

  const handleDictationSubmit = () => {
    if (!currentWord || feedback === 'correct') return;
    const isCorrect = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    if (isCorrect) {
      markCorrect();
    } else {
      markWrong();
    }
  };

  const handleDictationSpeak = () => {
    if (!currentWord) return;
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(currentWord.word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  // 朗读（所有模式通用）
  const handleSpeak = () => {
    if (!currentWord) return;
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(currentWord.word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  // 跟读模式录音
  const handleShadowingRecordToggle = () => {
    if (isRecording) {
      // 停止录音（评分功能开发中，暂不显示分数）
      setIsRecording(false);
      setShadowingHasRecorded(true);
      setShadowingScore(null);
      markCorrect();
    } else {
      setIsRecording(true);
      setShadowingScore(null);
      setFeedback('none');
      // 模拟3秒后自动停止
      setTimeout(() => {
        setIsRecording((recording) => {
          if (recording) {
            setShadowingHasRecorded(true);
            setShadowingScore(null);
            markCorrect();
          }
          return false;
        });
      }, 3000);
    }
  };

  const handleShadowingRetry = () => {
    setShadowingHasRecorded(false);
    setShadowingScore(null);
    setFeedback('none');
  };

  // 看说模式
  const handleWatchSpeakRecordToggle = () => {
    if (watchSpeakRecording) {
      setWatchSpeakRecording(false);
      setWatchSpeakHasRecorded(true);
      setWatchSpeakScore(null);
      markCorrect();
    } else {
      setWatchSpeakRecording(true);
      setWatchSpeakScore(null);
      setFeedback('none');
      setTimeout(() => {
        setWatchSpeakRecording((recording) => {
          if (recording) {
            setWatchSpeakHasRecorded(true);
            setWatchSpeakScore(null);
            markCorrect();
          }
          return false;
        });
      }, 3000);
    }
  };

  // 字母重组
  const handleLetterClick = (idx: number) => {
    if (!currentWord || feedback !== 'none') return;
    const nextSelected = [...selectedLetterIndexes, idx];
    setSelectedLetterIndexes(nextSelected);

    // 选完所有字母后自动判定
    if (nextSelected.length === currentWord.word.length) {
      const spelledWord = nextSelected.map((i: number) => scrambledLetters[i]).join('');
      if (spelledWord.toLowerCase() === currentWord.word.toLowerCase()) {
        markCorrect();
      } else {
        markWrong();
      }
    }
  };

  const handleLetterReset = () => {
    setSelectedLetterIndexes([]);
    if (feedback !== 'none') setFeedback('none');
  };

  // 导航
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFeedback('none');
      setUserInput('');
    }
  };

  const handleNext = () => {
    if (currentIndex < wordList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFeedback('none');
      setUserInput('');
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
    setFeedback('none');
    setUserInput('');
  };

  // 掌握/不熟
  const handleMastered = () => {
    if (!currentWord) return;
    setMasteryMap((prev) => ({ ...prev, [currentWord.word]: 'mastered' }));
    setMasteredCount((c) => c + 1);
  };

  const handleUnfamiliar = () => {
    if (!currentWord) return;
    if (masteryMap[currentWord.word] === 'review') return;
    setMasteryMap((prev) => ({ ...prev, [currentWord.word]: 'review' }));
    setUnfamiliarCount((c) => c + 1);
    toast.success('已标记为不熟悉');
  };

  // 切换模式（同步到 URL）
  const handleModeChange = (mode: PracticeMode) => {
    setPracticeMode(mode);
    const urlModeName = PRACTICE_MODE_TO_URL_MODE[mode];
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', urlModeName);
      return next;
    }, { replace: true });
  };

  const handleSwitchMode = () => {
    const currentIdx = MODE_LIST.indexOf(practiceMode);
    const nextMode = MODE_LIST[(currentIdx + 1) % MODE_LIST.length];
    setPracticeMode(nextMode);
  };

  // 显示/隐藏答案
  const handleToggleAnswer = () => {
    if (practiceMode === 'typing') {
      setAnswerHidden((prev) => !prev);
    } else if (practiceMode === 'dictation') {
      setDictationShowAnswer((prev) => !prev);
    } else if (practiceMode === 'shadowing') {
      setShadowingShowAnswer((prev) => !prev);
    } else if (practiceMode === 'watch-speak') {
      setWatchSpeakShowAnswer((prev) => !prev);
    }
  };

  const answerVisible = (() => {
    if (practiceMode === 'typing') return !answerHidden;
    if (practiceMode === 'dictation') return dictationShowAnswer;
    if (practiceMode === 'shadowing') return shadowingShowAnswer;
    if (practiceMode === 'watch-speak') return watchSpeakShowAnswer;
    return false;
  })();

  // 暂停/继续
  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  // 重置进度
  const handleResetProgress = () => {
    setCurrentIndex(0);
    setFeedback('none');
    setUserInput('');
    setCorrectCount(0);
    setWrongCount(0);
    setMasteredCount(0);
    setUnfamiliarCount(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setScore(0);
    setElapsedSeconds(0);
    setMasteryMap({});
    setCompletedSet(new Set());
    setShowReport(false);
  };

  // 空格键行为
  const handleSpacePress = () => {
    if (practiceMode === 'typing') {
      handleTypingSubmit();
    } else if (practiceMode === 'dictation') {
      handleDictationSubmit();
    } else if (practiceMode === 'shadowing') {
      handleShadowingRecordToggle();
    } else if (practiceMode === 'watch-speak') {
      handleWatchSpeakRecordToggle();
    }
  };

  // 录音行为（底部按钮的record）
  const handleRecord = () => {
    if (practiceMode === 'shadowing') {
      handleShadowingRecordToggle();
    } else if (practiceMode === 'watch-speak') {
      handleWatchSpeakRecordToggle();
    }
  };

  const isCurrentlyRecording = isRecording || watchSpeakRecording;

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSwitchMode();
      } else if (e.key === ' ' && (practiceMode === 'shadowing' || practiceMode === 'watch-speak')) {
        e.preventDefault();
        handleRecord();
      } else if (e.key.toLowerCase() === 'r') {
        handleSpeak();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceMode, currentIndex, feedback]);

  // ─── 渲染 ─────────────────────────────────────────

  // 加载中状态
  if (wordLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 overflow-hidden">
        <Loader2 className="text-[#6366F1] animate-spin" size={40} />
        <p className="text-slate-500">加载单词中...</p>
      </div>
    );
  }

  if (isFinished && showReport) {
    return (
      <div className="h-screen flex items-center justify-center p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full rounded-3xl glass-card p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#6366F1] to-[#2563EB] flex items-center justify-center mb-6 shadow-neon-purple">
              <Trophy className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">练习完成</h2>
            <p className="text-slate-400 mb-6">本轮单词训练已结束</p>
            <div className="inline-block px-8 py-4 bg-white/5 rounded-2xl mb-8 border border-fuchsia-500/20 backdrop-blur-sm">
              <div className="text-sm text-cyan-400 mb-1">本轮得分</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {score}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div>
                <div className="text-xs text-slate-400">正确率</div>
                <div className="text-lg font-semibold text-cyan-400">{accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">掌握</div>
                <div className="text-lg font-semibold text-blue-400">{masteredCount}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">最高连对</div>
                <div className="text-lg font-semibold text-fuchsia-400">{bestStreak}</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleResetProgress}
                className="neon-btn flex items-center gap-2 px-5 py-2.5 rounded-full font-medium"
              >
                <RotateCcw size={18} />
                再来一次
              </button>
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium transition-all bg-gradient-to-r from-[#6366F1] to-[#2563EB] shadow-neon-purple hover:shadow-[0_0_30px_hsla(270_80%_65%_0.5)]"
              >
                返回列表
              </button>
            </div>
          </motion.div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 overflow-hidden">
        <Loader2 className="text-[#6366F1] animate-spin" size={40} />
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  // 单词列表为空
  if (wordList.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 overflow-hidden">
        <AlertTriangle className="text-[#EF476F]" size={40} />
        <p className="text-slate-500">暂无单词</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden items-stretch">
      {/* 第1层：顶部导航栏（单行布局） */}
      <WordPracticeTopBar
        onBack={handleBack}
         title={unitId ? '单元单词训练' : '单词训练'}
         textbookTitle={unitId ? `Unit ${unitId.slice(0, 8)}` : '核心词汇 · 高频单词'}
         progress={{ current: currentIndex + 1, total: wordList.length }}
         currentMode={practiceMode}
         onModeChange={handleModeChange}
         isPaused={isPaused}
         onPauseToggle={handlePauseToggle}
         showModeTabs
        onResetProgress={handleResetProgress}
        wordList={wordList}
        currentIndex={currentIndex}
        onJumpTo={handleJumpTo}
        currentWord={currentWord.word}
        currentMeaning={currentWord.meaning}
        masteryMap={masteryMap}
        completedSet={completedSet}
        elapsedSeconds={elapsedSeconds}
      />

      {/* 第3层：内容区（深紫大卡片，居中） */}
      <div className="flex-shrink min-h-0 w-full flex flex-col justify-start items-center py-2 overflow-hidden relative tech-bg">
        {/* 暂停遮罩 */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-[#0F0D24]/85 backdrop-blur-md flex flex-col items-center justify-center gap-4"
            >
              <div className="w-20 h-20 rounded-full border-2 border-fuchsia-400/60 flex items-center justify-center shadow-neon-purple">
                <Pause className="text-fuchsia-400" size={36} />
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-wider">已暂停</p>
              <p className="text-sm text-slate-400">点击上方继续按钮恢复练习</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${practiceMode}-${currentIndex}-${letterScramble}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl"
          >
            {/* 深紫大卡片 */}
            <div className="mx-4 rounded-2xl glass-card p-5">
              <WordPracticeContentArea
                mode={practiceMode}
                wordItem={currentWord}
                showMeaning={showMeaning}
                showExample={showExample}
                showIllustration={showIllustration}
                letterBreakdown={letterBreakdown}
                letterScramble={letterScramble}
                phoneticMode={phoneticMode}
                onPhoneticModeChange={setPhoneticMode}
                isUnfamiliar={masteryMap[currentWord.word] === 'review'}
                onMarkUnfamiliar={handleUnfamiliar}
                userInput={userInput}
                feedback={feedback}
                answerHidden={answerHidden}
                dictationInput={userInput}
                dictationShowAnswer={dictationShowAnswer}
                onDictationSpeak={handleDictationSpeak}
                onDictationReveal={() => setDictationShowAnswer(true)}
                isRecording={isRecording}
                shadowingScore={shadowingScore}
                shadowingHasRecorded={shadowingHasRecorded}
                shadowingShowAnswer={shadowingShowAnswer}
                onRecordToggle={handleShadowingRecordToggle}
                onRetryRecording={handleShadowingRetry}
                onShadowingReveal={() => setShadowingShowAnswer(true)}
                watchSpeakHasRecorded={watchSpeakHasRecorded}
                watchSpeakScore={watchSpeakScore}
                watchSpeakShowAnswer={watchSpeakShowAnswer}
                onWatchSpeakRecordToggle={handleWatchSpeakRecordToggle}
                onWatchSpeakReveal={() => setWatchSpeakShowAnswer(true)}
                isWatchSpeakRecording={watchSpeakRecording}
                scrambledLetters={scrambledLetters}
                selectedLetterIndexes={selectedLetterIndexes}
                onLetterClick={handleLetterClick}
                onLetterReset={handleLetterReset}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 第4层：键盘区 */}
      <WordPracticeKeyboardArea
        mode={practiceMode}
        keyboardVisible={true}
        spaceInputMode={spaceInputMode}
        userInput={practiceMode === 'dictation' ? userInput : userInput}
        onInputChange={
          practiceMode === 'typing' && !letterScramble
            ? handleTypingInput
            : practiceMode === 'dictation'
              ? handleDictationInput
              : undefined
        }
        onSubmit={
          practiceMode === 'typing' && !letterScramble
            ? handleTypingSubmit
            : practiceMode === 'dictation'
              ? handleDictationSubmit
              : undefined
        }
        onBackspace={
          practiceMode === 'typing' && !letterScramble
            ? handleTypingBackspace
            : practiceMode === 'dictation'
              ? () => {
                  if (feedback === 'correct') return;
                  setUserInput((prev) => prev.slice(0, -1));
                  if (feedback === 'wrong') setFeedback('none');
                }
              : undefined
        }
        targetWord={currentWord.word}
        feedback={feedback}
        onPrev={handlePrev}
        onNext={handleNext}
        onSpeak={handleSpeak}
        onMastered={handleMastered}
        onUnfamiliar={handleUnfamiliar}
        onSwitchMode={handleSwitchMode}
        onShowAnswer={handleToggleAnswer}
        answerVisible={answerVisible}
        onRecord={handleRecord}
        isRecording={isCurrentlyRecording}
        canPrev={currentIndex > 0}
        canNext={currentIndex < wordList.length - 1}
        spaceLabel={
          practiceMode === 'typing'
            ? letterScramble
              ? '拼字母'
              : '提交 / Enter'
            : practiceMode === 'dictation'
              ? '提交 / Enter'
              : practiceMode === 'shadowing'
                ? '跟读 / Space'
                : '识别 / Space'
        }
      />

      <CompletionModal
        open={showCompletion}
        onClose={() => setShowCompletion(false)}
        elapsedSeconds={elapsedSeconds}
        totalQuestions={wordList.length}
        hasNextChapter={false}
        onRetry={() => {
          handleResetProgress();
          setShowCompletion(false);
        }}
        onReturn={() => {
          setShowCompletion(false);
          handleBack();
        }}
      />
    </div>
  );
};

export default WordTrainingPage;
