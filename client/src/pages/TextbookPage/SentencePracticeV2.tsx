import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Check,
  X,
  Headphones,
  Mic,
  BookOpen,
  Lightbulb,
  Shuffle,
  Keyboard,
  Award,
  RotateCcw,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import SpeechButton from '@client/src/components/ui/speech-button';
import { Image } from '@client/src/components/ui/image';
import { useAutoSpeakSetting } from '@client/src/hooks/use-auto-speak-setting';

// ==================== Types ====================

export interface SentenceQuestionComponent {
  id: string;
  text: string;
  type: string;
  phonetic?: string;
  meaning?: string;
}

export interface SentenceQuestion {
  sentence: string;
  translation: string;
  imageUrl?: string;
  components: SentenceQuestionComponent[];
  analysis?: string;
}

export interface SentencePracticeV2Props {
  questions: SentenceQuestion[];
  mode: 'translation' | 'listening' | 'speaking';
  onComplete: (correctCount: number, total: number) => void;
  onMarkMastered?: (questionIndex: number) => void;
  onMarkUnfamiliar?: (questionIndex: number) => void;
  onSpeakingEvaluate?: (questionIndex: number) => void;
}

// ==================== Helpers ====================

const POS_COLOR_MAP: Record<string, string> = {
  名词: 'bg-blue-100 text-blue-700 border-blue-200',
  动词: 'bg-orange-100 text-orange-700 border-orange-200',
  代词: 'bg-purple-100 text-purple-700 border-purple-200',
  介词: 'bg-green-100 text-green-700 border-green-200',
  连词: 'bg-pink-100 text-pink-700 border-pink-200',
  副词: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  标点: 'bg-gray-100 text-gray-500 border-gray-200',
  形容词: 'bg-teal-100 text-teal-700 border-teal-200',
  限定词: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  主语: 'bg-rose-100 text-rose-700 border-rose-200',
  专有名词: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const getPosColor = (type: string): string => {
  return POS_COLOR_MAP[type] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const compareSentences = (a: string, b: string): boolean => {
  return a.replace(/\s+/g, ' ').trim().toLowerCase() ===
    b.replace(/\s+/g, ' ').trim().toLowerCase();
};

const countCorrectChars = (userInput: string, target: string): number => {
  const userChars = userInput.split('');
  const targetChars = target.split('');
  let correct = 0;
  for (let i = 0; i < userChars.length && i < targetChars.length; i += 1) {
    if (userChars[i].toLowerCase() === targetChars[i].toLowerCase()) {
      correct += 1;
    }
  }
  return correct;
};

// ==================== Component ====================

const SentencePracticeV2: React.FC<SentencePracticeV2Props> = ({
  questions,
  mode,
  onComplete,
  onMarkMastered,
  onMarkUnfamiliar,
  onSpeakingEvaluate,
}) => {
  // Navigation & submission state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // Input modes
  const [showImage, setShowImage] = useState(true);
  const [wordScramble, setWordScramble] = useState(false);

  // Keyboard input state
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Word scramble state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState<SentenceQuestionComponent[]>([]);

  // Mastery feedback (visual only)
  const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set());
  const [unfamiliarSet, setUnfamiliarSet] = useState<Set<number>>(new Set());

  // Detail expand state
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Speaking simulation state
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const currentQ = questions[currentIndex];

  // --- Reset per question ---
  useEffect(() => {
    if (currentQ) {
      setUserInput('');
      setSelectedIds([]);
      setShowResult(false);
      setIsCorrect(false);
      setShowAnalysis(false);
      setSpeakingScore(null);
      setIsRecording(false);
      setHasPlayed(false);
      setShuffled(shuffle(currentQ.components));
    }
  }, [currentIndex, currentQ]);

  // --- Focus input on mode change / question change ---
  useEffect(() => {
    if (!wordScramble && mode !== 'speaking' && inputRef.current) {
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, wordScramble, mode]);

  // --- Statistics ---
  const stats = useMemo(() => {
    if (mode === 'speaking') {
      return { typed: 0, correctChars: 0, accuracy: 0 };
    }
    const typed = userInput.length;
    const correctChars = showResult
      ? countCorrectChars(userInput, currentQ?.sentence ?? '')
      : 0;
    const accuracy = typed > 0 && showResult
      ? Math.round((correctChars / (currentQ?.sentence.length || 1)) * 100)
      : 0;
    return { typed, correctChars, accuracy };
  }, [userInput, showResult, currentQ, mode]);

  // --- Scramble composed text ---
  const composedText = useMemo(() => {
    return selectedIds
      .map((id) => shuffled.find((c) => c.id === id)?.text || '')
      .join(' ');
  }, [selectedIds, shuffled]);

  // --- Submit handler ---
  const handleSubmit = useCallback((): void => {
    if (!currentQ || showResult) return;

    if (mode === 'speaking') {
      // Speaking mode: simulate evaluation
      setIsRecording(true);
      window.setTimeout(() => {
        const score = 75 + Math.floor(Math.random() * 20);
        setSpeakingScore(score);
        setIsRecording(false);
        const correct = score >= 80;
        setIsCorrect(correct);
        setShowResult(true);
        if (correct) {
          setCorrectCount((prev) => prev + 1);
        }
        onSpeakingEvaluate?.(currentIndex);
      }, 1500);
      return;
    }

    const answer = wordScramble ? composedText : userInput;
    const correct = compareSentences(answer, currentQ.sentence);
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
  }, [currentQ, showResult, mode, wordScramble, composedText, userInput, currentIndex, onSpeakingEvaluate]);

  // --- Navigation handlers ---
  const handleNext = useCallback((): void => {
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      onComplete(correctCount, questions.length);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, questions.length, correctCount, onComplete]);

  const handlePrev = useCallback((): void => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setFinished(false);
    setUserInput('');
    setSelectedIds([]);
    setShowResult(false);
    setIsCorrect(false);
    setMasteredSet(new Set());
    setUnfamiliarSet(new Set());
  }, []);

  // --- Mastery handlers ---
  const handleMarkMastered = useCallback((): void => {
    setMasteredSet((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    setUnfamiliarSet((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    onMarkMastered?.(currentIndex);
  }, [currentIndex, onMarkMastered]);

  const handleMarkUnfamiliar = useCallback((): void => {
    setUnfamiliarSet((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    setMasteredSet((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    onMarkUnfamiliar?.(currentIndex);
  }, [currentIndex, onMarkUnfamiliar]);

  const [hasPlayed, setHasPlayed] = useState(false);
  const { enabled: autoSpeakEnabled } = useAutoSpeakSetting();

  const speakText = useCallback((text: string, rate = 0.9): void => {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
    } catch {
      /* ignore */
    }
  }, []);

  const handlePlayListening = useCallback((): void => {
    setHasPlayed(true);
    if (currentQ) speakText(currentQ.sentence, 0.85);
  }, [currentQ, speakText]);

  // --- Scramble select handler ---
  const handleScrambleSelect = useCallback((id: string): void => {
    if (showResult) return;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((s) => s !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
      const comp = shuffled.find((c) => c.id === id);
      if (comp) speakText(comp.text, 0.9);
    }
  }, [showResult, selectedIds, shuffled, speakText]);

  const handleScrambleReset = useCallback((): void => {
    setSelectedIds([]);
  }, []);

  // --- Auto-speak on new question (translation + word scramble mode) ---
  useEffect(() => {
    if (!currentQ || !autoSpeakEnabled) return;
    if (mode !== 'translation') return;
    const timer = window.setTimeout(() => {
      speakText(currentQ.sentence, 0.85);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [currentIndex, currentQ, autoSpeakEnabled, mode, speakText]);

  // --- Speak correct answer after submission ---
  useEffect(() => {
    if (!showResult || !currentQ || !autoSpeakEnabled) return;
    if (mode === 'speaking') return;
    const timer = window.setTimeout(() => {
      speakText(currentQ.sentence, 0.85);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [showResult, currentQ, autoSpeakEnabled, mode, speakText]);

  // --- Speaking mic handler ---
  const handleMicClick = useCallback((): void => {
    if (!currentQ) return;
    handleSubmit();
  }, [currentQ, handleSubmit]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!currentQ) return;

      // Skip if user is typing in an input/textarea and shortcut needs modifier
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Shift + ArrowLeft / ArrowRight: prev / next
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
          handlePrev();
        } else {
          if (showResult) {
            handleNext();
          }
        }
        return;
      }

      // Tab: focus input (jump)
      if (e.key === 'Tab' && !isEditing && mode !== 'speaking') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      {/* Ctrl + A: read aloud */}
      if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        speakText(currentQ.sentence, 0.9);
        return;
      }

      // Ctrl + M: mark mastered
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleMarkMastered();
        return;
      }

      // Ctrl + Q: mark unfamiliar
      if (e.ctrlKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handleMarkUnfamiliar();
        return;
      }

      // Space / Enter: submit (when not editing text, or Enter from input)
      if (e.key === 'Enter' && isEditing) {
        e.preventDefault();
        if (!showResult) {
          handleSubmit();
        } else {
          handleNext();
        }
        return;
      }

      if (e.key === ' ' && !isEditing && mode !== 'speaking') {
        e.preventDefault();
        if (!showResult) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, showResult, handlePrev, handleNext, handleSubmit, handleMarkMastered, handleMarkUnfamiliar, mode]);

  // ==================== Render ====================

  if (finished) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-orange-500/30 to-yellow-500/30 flex items-center justify-center border border-orange-500/30">
          <Award size={40} className="text-orange-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">练习完成！</h3>
        <p className="text-slate-400 mb-6">
          共 {questions.length} 题，答对{' '}
          <span className="text-orange-400 font-semibold">{correctCount}</span> 题
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="default"
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
            onClick={handleRestart}
          >
            <RotateCcw size={16} />
            再练一轮
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return <div className="py-8 text-center text-slate-500">暂无句子练习题</div>;
  }

  const isMastered = masteredSet.has(currentIndex);
  const isUnfamiliar = unfamiliarSet.has(currentIndex);

  return (
    <div className="space-y-5">
      {/* Header: progress + toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="font-medium text-slate-200">
            第 {currentIndex + 1} / {questions.length} 题
          </span>
          <span className="text-slate-600">|</span>
          <span>
            答对：<span className="text-emerald-400 font-medium">{correctCount}</span>
          </span>
          {mode === 'translation' && (
            <>
              <span className="text-slate-600">|</span>
              <span>
                字数：{stats.typed} / 正确：{stats.correctChars} / 正确率：{stats.accuracy}%
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode !== 'speaking' && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setWordScramble((prev) => !prev);
                setUserInput('');
                setSelectedIds([]);
                setShowResult(false);
              }}
              title={wordScramble ? '切换到键盘输入' : '切换到拆句重组'}
            >
              {wordScramble ? <Keyboard size={16} /> : <Shuffle size={16} />}
              <span className="text-xs">{wordScramble ? '键盘输入' : '拆句重组'}</span>
            </Button>
          )}
          {currentQ.imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setShowImage((prev) => !prev)}
              title={showImage ? '隐藏图片' : '显示图片'}
            >
              {showImage ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          )}
        </div>
      </div>

      {/* Question area */}
      <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-500/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {mode === 'listening' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  {hasPlayed ? '请根据音频写出英文句子' : '先听音频，再作答'}
                </p>
                <button
                  type="button"
                  onClick={handlePlayListening}
                  className="flex items-center gap-3 px-5 py-4 rounded-full bg-white/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all shadow-sm"
                >
                  <Headphones size={24} />
                  <span className="font-medium">
                    {hasPlayed ? '再听一遍' : '点击播放音频'}
                  </span>
                </button>
              </div>
            ) : mode === 'speaking' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">跟读并评测你的发音</p>
                <p className="text-xl font-bold text-white">{currentQ.sentence}</p>
                <p className="text-base text-slate-400">{currentQ.translation}</p>
                <SpeechButton text={currentQ.sentence} size="sm" variant="ghost" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">
                    {wordScramble ? '点击下方单词卡片，按正确顺序组成句子' : '请根据中文翻译，写出对应的英文句子'}
                  </p>
                  <SpeechButton text={currentQ.sentence} size="sm" variant="ghost" aria-label="朗读整句" />
                </div>
                <p className="text-xl font-bold text-white leading-relaxed">
                  {currentQ.translation}
                </p>
              </div>
            )}
          </div>

          {currentQ.imageUrl && showImage && mode !== 'speaking' && (
            <div className="w-28 h-28 rounded-xl bg-white/10 overflow-hidden shadow-sm flex-shrink-0 border border-white/10">
              <Image
                src={currentQ.imageUrl}
                alt={currentQ.translation}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Input / Interaction area */}
      {mode === 'speaking' ? (
        <div className="flex flex-col items-center justify-center py-8 bg-white/5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isRecording || (showResult && speakingScore !== null)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? 'bg-red-500 animate-pulse text-white'
                : speakingScore !== null
                ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white hover:shadow-xl hover:scale-105'
            }`}
          >
            <Mic size={36} />
          </button>
          <p className="mt-4 text-sm text-slate-400">
            {isRecording ? '正在录音...' : speakingScore !== null ? '评测完成' : '点击开始跟读'}
          </p>
          {speakingScore !== null && (
            <div className="mt-3 px-5 py-2 bg-orange-50 border border-orange-200 rounded-full text-orange-600 font-bold text-lg">
              跟读得分 {speakingScore} 分
            </div>
          )}
        </div>
      ) : wordScramble ? (
        <div className="space-y-4">
          {/* Composed area */}
          <div className="min-h-[72px] p-4 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
            {selectedIds.length === 0 ? (
              <p className="text-center text-gray-300 text-sm">点击下方卡片组合句子</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedIds.map((id, idx) => {
                  const comp = shuffled.find((c) => c.id === id);
                  if (!comp) return null;
                  return (
                    <span
                      key={id}
                      onClick={() => handleScrambleSelect(id)}
                      className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium cursor-pointer hover:bg-orange-200 transition-colors select-none"
                    >
                      {idx + 1}. {comp.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shuffled cards */}
          <div className="flex flex-wrap gap-2">
            {shuffled.map((comp) => {
              const isSelected = selectedIds.includes(comp.id);
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleScrambleSelect(comp.id)}
                  disabled={showResult || isSelected}
                  className={`relative inline-flex flex-col items-start px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-gray-100 text-gray-300 border border-gray-200 opacity-50 line-through'
                       : 'bg-white/5 text-slate-200 border border-white/10 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10 hover:text-fuchsia-300 shadow-sm'
                  }`}
                >
                  <span className="font-semibold text-base">{comp.text}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] border mt-0.5 ${getPosColor(comp.type)}`}
                  >
                    {comp.type}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="请输入英文句子..."
            className="h-14 text-lg px-4 rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-200"
            disabled={showResult}
          />
          {showResult && (
            <div className="text-xs text-gray-400">
              字数：{stats.typed} · 正确：{stats.correctChars} · 正确率：{stats.accuracy}%
            </div>
          )}
        </div>
      )}

      {/* Result feedback */}
      {showResult && mode !== 'speaking' && (
        <div
          className={`p-4 rounded-xl text-sm ${
            isCorrect
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          {isCorrect ? (
            <div className="flex items-center gap-2">
              <Check size={18} />
              <span className="font-medium">回答正确！太棒了 🎉</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <X size={18} />
                <span className="font-medium">回答有误，正确答案是：</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">{currentQ.sentence}</span>
                <SpeechButton text={currentQ.sentence} size="sm" variant="ghost" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail: word-by-word breakdown */}
      {showResult && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-500" />
              逐词解析
            </h4>
            <div className="flex items-center gap-2">
              {isMastered && (
                <Badge className="bg-green-100 text-green-700 border-green-200">已掌握</Badge>
              )}
              {isUnfamiliar && (
                <Badge className="bg-red-100 text-red-700 border-red-200">不熟悉</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {currentQ.components.map((comp) => (
              <div
                key={comp.id}
                 className="flex flex-col items-start px-3 py-2 glass-card rounded-lg shadow-sm min-w-[80px]"
              >
                <span className="text-base font-semibold text-gray-800">{comp.text}</span>
                {comp.phonetic && (
                  <span className="text-xs text-fuchsia-400/90">{comp.phonetic}</span>
                )}
                <Badge
                  variant="outline"
                  className={`mt-1 text-[10px] border ${getPosColor(comp.type)}`}
                >
                  {comp.type}
                </Badge>
                {comp.meaning && (
                  <span className="text-xs text-gray-500 mt-1">{comp.meaning}</span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="text-gray-400 mr-2">整句翻译：</span>
              {currentQ.translation}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-gray-600 hover:bg-gray-100"
              onClick={() => setShowAnalysis((prev) => !prev)}
            >
              <Lightbulb size={16} className="text-yellow-500" />
              {showAnalysis ? '收起句子解析' : '句子解析'}
            </Button>
            {showAnalysis && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700 leading-relaxed">
                {currentQ.analysis || '暂无解析内容'}
              </div>
            )}
          </div>

          {/* Speaking evaluate CTA */}
          {mode !== 'speaking' && (
            <div className="pt-3">
              <Button
                variant="default"
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                onClick={() => {
                  onSpeakingEvaluate?.(currentIndex);
                  logger.info(`触发口语评测：第${currentIndex + 1}题`);
                }}
              >
                <Mic size={16} />
                口语评测 (Enter)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={handleMarkMastered}
          >
            <Check size={16} className={isMastered ? 'text-green-500' : ''} />
            掌握
            <span className="text-[10px] text-gray-400 ml-1">Ctrl+M</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={handleMarkUnfamiliar}
          >
            <X size={16} className={isUnfamiliar ? 'text-red-500' : ''} />
            不熟悉
            <span className="text-[10px] text-gray-400 ml-1">Ctrl+Q</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {wordScramble && !showResult && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={handleScrambleReset}
              disabled={selectedIds.length === 0}
            >
              <RotateCcw size={14} />
              重置
            </Button>
          )}
          {!showResult ? (
            mode === 'speaking' ? null : (
              <Button
                variant="default"
                size="default"
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                onClick={handleSubmit}
                disabled={
                  wordScramble
                    ? selectedIds.length !== currentQ.components.length
                    : userInput.trim().length === 0
                }
              >
                提交答案
                <span className="text-[10px] text-white/70 ml-1">Space</span>
              </Button>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} />
                上一题
              </Button>
              <Button
                variant="default"
                size="default"
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                onClick={handleNext}
              >
                {currentIndex >= questions.length - 1 ? '查看结果' : '下一题'}
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Shortcut hint bar (bottom fixed style, but inline for component) */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
          <span>Shift+←/→ 上/下一题</span>
          <span>·</span>
          <span>Tab 聚焦输入</span>
          <span>·</span>
          <span>Ctrl+A 朗读</span>
          <span>·</span>
          <span>Ctrl+M 掌握</span>
          <span>·</span>
          <span>Ctrl+Q 不熟悉</span>
          <span>·</span>
          <span>Space/Enter 提交</span>
        </div>
      </div>
    </div>
  );
};

export default SentencePracticeV2;
