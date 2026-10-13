import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Volume2, SkipForward, Lightbulb, RotateCcw, Check, XCircle } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { WordItem } from '@shared/api.interface';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { useSpeech } from '@client/src/hooks/use-speech';
import { Image } from '@client/src/components/ui/image';

interface SpellingModeProps {
  words: WordItem[];
  startIndex?: number;
  onClose: () => void;
  onRecordUpdate?: (wordId: string, isCorrect: boolean) => void;
}

const SpellingMode: React.FC<SpellingModeProps> = ({
  words,
  startIndex = 0,
  onClose,
  onRecordUpdate,
}) => {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [typed, setTyped] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongWords, setWrongWords] = useState<WordItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const wrongFlashRef = useRef<number | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const current: WordItem | undefined = words[currentIndex];
  const targetWord = current?.word || '';

  const handleSpeak = useCallback((): void => {
    if (current) {
      speak(current.word, { lang: 'en-US' });
    }
  }, [current, speak]);

  useEffect(() => {
    setTyped('');
    setHintUsed(false);
    setShowFeedback(null);
    setWrongKey(null);
    if (wrongFlashRef.current) {
      window.clearTimeout(wrongFlashRef.current);
      wrongFlashRef.current = null;
    }
  }, [currentIndex]);

  const goNext = useCallback((): void => {
    if (currentIndex >= words.length - 1) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, words.length]);

  const handleChange = useCallback((newValue: string): void => {
    if (showFeedback || isFinished) return;
    if (newValue.length > typed.length) {
      const newChar = newValue[newValue.length - 1];
      const nextPos = typed.length;
      const targetChar = targetWord[nextPos];
      if (!targetChar) return;

      const lowerKey = newChar.toLowerCase();
      const lowerTarget = targetChar.toLowerCase();

      if (lowerKey === lowerTarget) {
        const newTyped = typed + targetChar;
        setTyped(newTyped);
        if (newTyped.length === targetWord.length) {
          setShowFeedback('correct');
          setCorrectCount((c) => c + 1);
          if (onRecordUpdate && current) {
            try {
              onRecordUpdate(current.id, true);
            } catch (err) {
              logger.error('更新单词记录失败', err as Error);
            }
          }
          setTimeout(() => {
            goNext();
          }, 1500);
        }
      } else {
        setWrongKey(lowerKey);
        if (wrongFlashRef.current) window.clearTimeout(wrongFlashRef.current);
        wrongFlashRef.current = window.setTimeout(() => {
          setWrongKey(null);
        }, 500);
        setWrongCount((c) => c + 1);
        const alreadyWrong = wrongWords.some((w: WordItem) => w.id === current?.id);
        if (!alreadyWrong && current) {
          setWrongWords((prev) => [...prev, current]);
        }
        if (onRecordUpdate && current) {
          try {
            onRecordUpdate(current.id, false);
          } catch (err) {
            logger.error('更新单词记录失败', err as Error);
          }
        }
      }
    } else if (newValue.length < typed.length) {
      setTyped(newValue);
    }
  }, [typed, targetWord, showFeedback, isFinished, current, onRecordUpdate, wrongWords, goNext]);

  const handleSkip = useCallback((): void => {
    if (isFinished) return;
    if (current) {
      const alreadyWrong = wrongWords.some((w: WordItem) => w.id === current.id);
      if (!alreadyWrong) {
        setWrongWords((prev) => [...prev, current]);
      }
      if (onRecordUpdate) {
        try {
          onRecordUpdate(current.id, false);
        } catch (err) {
          logger.error('更新单词记录失败', err as Error);
        }
      }
    }
    goNext();
  }, [current, isFinished, wrongWords, onRecordUpdate, goNext]);

  const handleHint = useCallback((): void => {
    if (hintUsed || showFeedback || isFinished) return;
    const nextPos = typed.length;
    const targetChar = targetWord[nextPos];
    if (targetChar) {
      setTyped(typed + targetChar);
      setHintUsed(true);
    }
  }, [hintUsed, typed, targetWord, showFeedback, isFinished]);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setTyped('');
    setCorrectCount(0);
    setWrongCount(0);
    setWrongWords([]);
    setIsFinished(false);
    setHintUsed(false);
    setShowFeedback(null);
  }, []);

  const handleRetryWrong = useCallback((word: WordItem): void => {
    const idx = words.findIndex((w: WordItem) => w.id === word.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setTyped('');
      setCorrectCount(0);
      setWrongCount(0);
      setWrongWords([]);
      setIsFinished(false);
      setHintUsed(false);
      setShowFeedback(null);
    }
  }, [words]);

  if (!current) return null;

  const renderPlaceholders = (): React.ReactNode => {
    const chars: string[] = targetWord.split('');
    return chars.map((ch: string, idx: number) => {
      const isSpace = ch === ' ';
      const typedChar = typed[idx];
      const isCorrect = typedChar !== undefined;
      const isCurrent = idx === typed.length && !showFeedback;

      if (isSpace) {
        return <span key={`sp-${idx}`} className="w-4 inline-block" />;
      }

      return (
        <div
          key={idx}
          className={`w-11 h-14 sm:w-14 sm:h-16 mx-0.5 sm:mx-1 flex items-center justify-center
            text-2xl sm:text-3xl font-bold rounded-lg border-2 transition-all duration-200
            ${isCorrect
              ? 'border-white text-white bg-white/10 shadow-lg shadow-white/20'
              : isCurrent
                ? 'border-violet-400 bg-violet-500/10 text-transparent animate-pulse'
                : 'border-slate-600/50 bg-slate-800/30 text-transparent'
            }
            ${showFeedback === 'correct' ? 'border-white text-white bg-white/10 shadow-lg shadow-white/20' : ''}
          `}
        >
          {typedChar || (isCurrent ? '|' : '')}
        </div>
      );
    });
  };

  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#EEF2FF]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/70 text-slate-400
            hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
        <div className="flex-1 mx-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">拼写练习</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-cyan-400">✓ {correctCount}</span>
          <span className="text-rose-400">✗ {wrongCount}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start items-center pt-4 px-6">
        {isFinished ? (
          <div className="text-center max-w-md w-full">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full
              bg-gradient-to-br from-violet-500/30 to-cyan-500/30
              border-2 border-violet-500/50 flex items-center justify-center">
              <Check size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">练习完成！</h2>
            <p className="text-slate-400 mb-6">
              正确 <span className="text-cyan-400 font-medium">{correctCount}</span> 个 ·{' '}
              错误 <span className="text-rose-400 font-medium">{wrongCount}</span> 个 ·{' '}
              正确率 <span className="text-violet-400 font-medium">{accuracy}%</span>
            </p>

            {wrongWords.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={16} className="text-rose-400" />
                  <span className="text-sm font-medium text-slate-300">错词列表</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {wrongWords.map((w: WordItem) => (
                    <div
                      key={w.id}
                      onClick={() => handleRetryWrong(w)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg
                        bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-white font-medium">{w.word}</span>
                      <span className="text-xs text-slate-400">{w.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-3 mx-auto rounded-xl
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                text-white font-medium shadow-lg shadow-violet-500/30 transition-all duration-300"
            >
              <RotateCcw size={18} />
              再来一遍
            </button>
          </div>
        ) : (
           <div className="w-full max-w-2xl text-center flex-shrink-0">
            {current.imageUrl && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden
                border-2 border-violet-500/30 shadow-lg shadow-violet-500/20">
                <Image
                  src={current.imageUrl}
                  alt={current.word}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

             <div className="flex items-center justify-center gap-3 mb-2">
              {current.partOfSpeech && (
                <span className="text-sm px-3 py-1 rounded-full
                  bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {current.partOfSpeech}
                </span>
              )}
              <button
                onClick={handleSpeak}
                className="p-2 rounded-full bg-cyan-500/20 border border-cyan-500/40
                  text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                aria-label="发音"
              >
                <Volume2 size={16} />
              </button>
            </div>

              <h2 className="text-3xl font-bold text-white mb-4
              bg-clip-text text-transparent
              bg-gradient-to-r from-violet-300 via-white to-cyan-300">
              {current.meaning}
            </h2>

             <div className="flex items-center justify-center flex-wrap mb-3">
              {renderPlaceholders()}
            </div>

            {showFeedback === 'correct' && (
               <p className="text-emerald-400 font-medium animate-pulse mb-1">正确！</p>
            )}
          </div>
        )}
      </div>

      {!isFinished && (
        <div className="border-t border-purple-900/30">
          <div className="flex items-center justify-center gap-3 px-6 py-3">
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                bg-slate-800/70 border border-slate-600/50 text-slate-400
                hover:text-white hover:bg-slate-700 transition-colors"
            >
              <SkipForward size={16} />
              跳过
            </button>
            <button
              onClick={handleHint}
              disabled={hintUsed}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                bg-amber-500/20 border border-amber-500/40 text-amber-400
                hover:bg-amber-500/30
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb size={16} />
              提示
            </button>
          </div>

          <div className="px-2 pb-2">
            <VirtualKeyboard
              layout="qwerty"
              value={typed}
              onChange={handleChange}
              theme="neon"
              targetWord={targetWord}
              showTypedHighlight={false}
              filterByTarget={false}
              wrongKey={wrongKey}
              disabled={!!showFeedback}
              fullWidth
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellingMode;
