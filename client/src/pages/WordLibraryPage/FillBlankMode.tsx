import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Volume2, SkipForward, Lightbulb, RotateCcw, Check, Home } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { WordItem } from '@shared/api.interface';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { useSpeech } from '@client/src/hooks/use-speech';
import { Image } from '@client/src/components/ui/image';

interface FillBlankModeProps {
  words: WordItem[];
  startIndex?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  onClose: () => void;
  onRecordUpdate?: (wordId: string, isCorrect: boolean, practiceType: string) => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const FillBlankMode: React.FC<FillBlankModeProps> = ({
  words,
  startIndex = 0,
  difficulty = 'medium',
  onClose,
  onRecordUpdate,
}) => {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [typed, setTyped] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const wrongFlashRef = useRef<number | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const current: WordItem | undefined = words[currentIndex];
  const targetWord = current?.word || '';
  const exampleSentence = current?.exampleSentence || '';

  // 找到目标词在例句中的位置（不区分大小写，整词匹配）
  const { beforeText, targetInSentence, afterText } = useMemo(() => {
    if (!exampleSentence || !targetWord) {
      return { beforeText: '', targetInSentence: '', afterText: '' };
    }
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    const match = exampleSentence.match(regex);
    if (!match || match.index === undefined) {
      // 回退：直接查找子串
      const lower = exampleSentence.toLowerCase();
      const idx = lower.indexOf(targetWord.toLowerCase());
      if (idx >= 0) {
        return {
          beforeText: exampleSentence.slice(0, idx),
          targetInSentence: exampleSentence.slice(idx, idx + targetWord.length),
          afterText: exampleSentence.slice(idx + targetWord.length),
        };
      }
      return { beforeText: exampleSentence, targetInSentence: '', afterText: '' };
    }
    return {
      beforeText: exampleSentence.slice(0, match.index),
      targetInSentence: match[0],
      afterText: exampleSentence.slice(match.index + match[0].length),
    };
  }, [exampleSentence, targetWord]);

  // 自动播放例句发音
  useEffect(() => {
    if (!isFinished && exampleSentence) {
      const timer = window.setTimeout(() => {
        speak(exampleSentence, { lang: 'en-US' });
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, exampleSentence, isFinished, speak]);

  useEffect(() => {
    setTyped('');
    setShowFeedback(null);
    setWrongKey(null);
    setHintCount(0);
    if (wrongFlashRef.current) {
      window.clearTimeout(wrongFlashRef.current);
      wrongFlashRef.current = null;
    }
  }, [currentIndex]);

  const handleSpeakSentence = useCallback((): void => {
    if (exampleSentence) {
      speak(exampleSentence, { lang: 'en-US' });
    }
  }, [exampleSentence, speak]);

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
              onRecordUpdate(current.id, true, 'fill');
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
        if (onRecordUpdate && current) {
          try {
            onRecordUpdate(current.id, false, 'fill');
          } catch (err) {
            logger.error('更新单词记录失败', err as Error);
          }
        }
      }
    } else if (newValue.length < typed.length) {
      setTyped(newValue);
    }
  }, [typed, targetWord, showFeedback, isFinished, current, onRecordUpdate, goNext]);

  const handleSkip = useCallback((): void => {
    if (isFinished) return;
    if (current && onRecordUpdate) {
      try {
        onRecordUpdate(current.id, false, 'fill');
      } catch (err) {
        logger.error('更新单词记录失败', err as Error);
      }
    }
    goNext();
  }, [current, isFinished, onRecordUpdate, goNext]);

  const handleHint = useCallback((): void => {
    if (showFeedback || isFinished) return;
    const nextPos = typed.length;
    const targetChar = targetWord[nextPos];
    if (targetChar) {
      setTyped(typed + targetChar);
      setHintCount((c) => c + 1);
      // 如果提示后完成了
      if ((typed + targetChar).length === targetWord.length) {
        setShowFeedback('correct');
        setCorrectCount((c) => c + 1);
        if (onRecordUpdate && current) {
          try {
            onRecordUpdate(current.id, true, 'fill');
          } catch (err) {
            logger.error('更新单词记录失败', err as Error);
          }
        }
        setTimeout(() => {
          goNext();
        }, 1500);
      }
    }
  }, [typed, targetWord, showFeedback, isFinished, current, onRecordUpdate, goNext]);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setTyped('');
    setCorrectCount(0);
    setWrongCount(0);
    setHintCount(0);
    setIsFinished(false);
    setShowFeedback(null);
  }, []);

  const renderBlank = (): React.ReactNode => {
    const chars: string[] = targetWord.split('');
    return (
      <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded-md
        bg-violet-500/20 border-b-2 border-violet-400 align-middle">
        {chars.map((_ch: string, idx: number) => {
          const typedChar = typed[idx];
          const isCorrect = typedChar !== undefined;
          const isCurrent = idx === typed.length && !showFeedback;

          return (
            <span
              key={idx}
              className={`inline-block w-7 h-10 sm:w-8 sm:h-11 mx-0.5 text-center text-xl sm:text-2xl font-bold leading-10
                transition-all duration-200
                ${isCorrect
                  ? 'text-white drop-shadow-[0_0_8px_rgba(255_255_255_0.4)]'
                  : isCurrent
                    ? 'text-violet-300 animate-pulse'
                    : 'text-violet-400/60'
                }
                ${showFeedback === 'correct' ? 'text-white drop-shadow-[0_0_8px_rgba(255_255_255_0.4)]' : ''}
                ${showFeedback === 'wrong' ? 'text-rose-400' : ''}
              `}
            >
              {typedChar || (showFeedback ? targetInSentence[idx] || '_' : '_')}
            </span>
          );
        })}
      </span>
    );
  };

  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 0;

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#EEF2FF]">
      {/* ===== 顶部栏 ===== */}
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
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">例句填空</span>
              <span className="px-2 py-0.5 rounded-full text-xs
                bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {DIFFICULTY_LABELS[difficulty]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-cyan-400">✓ {correctCount}</span>
          <span className="text-rose-400">✗ {wrongCount}</span>
        </div>
      </div>

      {/* ===== 中部内容区 ===== */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start items-center pt-4 px-6">
        {isFinished ? (
          <div className="text-center max-w-md w-full">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full
              bg-gradient-to-br from-violet-500/30 to-cyan-500/30
              border-2 border-violet-500/50 flex items-center justify-center">
              <Check size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">练习完成！</h2>
            <p className="text-slate-400 mb-2">
              完成 <span className="text-violet-400 font-medium">{words.length}</span> 道填空题
            </p>
            <p className="text-slate-400 mb-6">
              正确 <span className="text-cyan-400 font-medium">{correctCount}</span> 个 ·{' '}
              错误 <span className="text-rose-400 font-medium">{wrongCount}</span> 个 ·{' '}
              正确率 <span className="text-violet-400 font-medium">{accuracy}%</span>
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-5 py-3 rounded-xl
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  text-white font-medium shadow-lg shadow-violet-500/30 transition-all duration-300"
              >
                <RotateCcw size={18} />
                再来一遍
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-3 rounded-xl
                  bg-slate-800/70 border border-slate-600/50 text-slate-300
                  hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Home size={18} />
                返回单词库
              </button>
            </div>
          </div>
        ) : (
           <div className="w-full max-w-2xl text-center flex-shrink-0">
            {/* 配图（仅 easy） */}
            {difficulty === 'easy' && current.imageUrl && (
               <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden
                border-2 border-violet-500/30 shadow-lg shadow-violet-500/20">
                <Image
                  src={current.imageUrl}
                  alt={current.word}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 例句 */}
             <div className="mb-3">
              <p className="text-2xl sm:text-3xl font-medium text-white leading-relaxed">
                {beforeText}
                {showFeedback ? (
                  <span className={`mx-1 px-2 py-0.5 rounded-md font-bold
                    ${showFeedback === 'correct'
                      ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400'
                      : 'bg-rose-500/20 text-rose-300 border-b-2 border-rose-400'
                    }`}>
                    {targetInSentence}
                  </span>
                ) : (
                  renderBlank()
                )}
                {afterText}
              </p>
            </div>

            {/* 中文翻译（easy / medium 显示） */}
            {difficulty !== 'hard' && current.exampleTranslation && (
               <p className="text-base text-white/70 mb-2">{current.exampleTranslation}</p>
            )}

            {/* 困难模式：仅显示中文翻译 */}
            {difficulty === 'hard' && current.exampleTranslation && (
               <p className="text-lg text-white/80 mb-3 italic">"{current.exampleTranslation}"</p>
            )}

            {/* 释义提示（easy 显示霓虹青） */}
            {difficulty === 'easy' && (
               <p className="text-base text-cyan-300 mb-3">
                释义：{current.meaning}
              </p>
            )}

            {/* 发音按钮 */}
             <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={handleSpeakSentence}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                  bg-cyan-500/20 border border-cyan-500/40
                  text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm"
                aria-label="播放例句"
              >
                <Volume2 size={16} />
                播放例句
              </button>
            </div>

            {/* 首字母提示（easy） */}
            {difficulty === 'easy' && typed.length === 0 && !showFeedback && (
               <p className="text-sm text-white/70 mb-1">
                首字母：<span className="text-violet-400 font-medium">{targetWord[0]?.toUpperCase()}</span>
                {' · '}共 <span className="text-violet-400 font-medium">{targetWord.length}</span> 个字母
              </p>
            )}

            {/* 正确反馈 */}
            {showFeedback === 'correct' && (
              <div className="mb-2">
                <p className="text-emerald-400 font-medium text-lg animate-pulse">
                  ✓ 正确！
                </p>
                <p className="text-sm text-cyan-400">{current.meaning}</p>
              </div>
            )}

            {/* 错误反馈 */}
            {showFeedback === 'wrong' && (
              <div className="mb-2">
                <p className="text-rose-400 font-medium text-lg animate-pulse">
                  ✗ 错误，正确答案：<span className="font-bold">{targetWord}</span>
                </p>
                <p className="text-sm text-slate-400">{current.meaning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== 底部控制栏 + 虚拟键盘 ===== */}
      {!isFinished && (
        <div className="border-t border-purple-900/30">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                bg-slate-800/70 border border-slate-600/50 text-slate-400
                hover:text-white hover:bg-slate-700 transition-colors"
            >
              <SkipForward size={16} />
              跳过
            </button>
            <span className="text-xs text-slate-500">
              提示已用 <span className="text-amber-400">{hintCount}</span> 次
            </span>
            <button
              onClick={handleHint}
              disabled={typed.length >= targetWord.length}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                bg-amber-500/20 border border-amber-500/40 text-amber-400
                hover:bg-amber-500/30
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb size={16} />
              提示
            </button>
          </div>

          <div className="pb-4 px-2">
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

export default FillBlankMode;
