import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Volume2, RotateCcw, Zap } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { WordItem } from '@shared/api.interface';
import VirtualKeyboard from '@client/src/components/ui/virtual-keyboard';
import { useSpeech } from '@client/src/hooks/use-speech';
import { Image } from '@client/src/components/ui/image';
import { UnderlineInput } from '@client/src/components/underline-input';

interface UnitSpellingPracticeProps {
  words: WordItem[];
  onComplete?: (correctCount: number, total: number) => void;
}

interface Stats {
  totalKeystrokes: number;
  correctKeystrokes: number;
  consecutiveErrors: number;
  startTime: number | null;
}

const UnitSpellingPractice: React.FC<UnitSpellingPracticeProps> = ({
  words,
  onComplete,
}) => {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [highlightKey, setHighlightKey] = useState<string>('');
  const [errorKey, setErrorKey] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    consecutiveErrors: 0,
    startTime: null,
  });
  const [shakeInput, setShakeInput] = useState(false);
  const [keyboardSlim, setKeyboardSlim] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const shuffledWords = useMemo(
    () => [...words].sort(() => Math.random() - 0.5),
    [words],
  );

  const currentWord = shuffledWords[currentIndex];
  const targetWord = currentWord?.word || '';
  const targetLower = targetWord.toLowerCase();

  const MAX_WRONG_ATTEMPTS = 3;

  const nextExpectedKey = useMemo(() => {
    if (!targetLower || input.length >= targetLower.length) return '';
    return targetLower[input.length];
  }, [targetLower, input]);

  useEffect(() => {
    setHighlightKey(nextExpectedKey);
  }, [nextExpectedKey]);

  useEffect(() => {
    if (currentWord && !showResult) {
      setTimeout(() => speak(currentWord.word), 300);
      setStats((s) => ({ ...s, startTime: Date.now() }));
    }
  }, [currentIndex, currentWord, showResult, speak]);

  const handleKeyPress = useCallback(
    (key: string): void => {
      if (showResult && isCorrect) return;
      if (showResult && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;

      if (key === ' ') {
        // 空格提交
        if (input.length === targetLower.length) {
          handleSubmit();
        }
        return;
      }

      if (key === 'Backspace') {
        // 错误中且未达上限，删除时清掉反馈
        if (showResult && !isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS) {
          setShowResult(false);
        }
        setInput((prev) => prev.slice(0, -1));
        setErrorKey('');
        return;
      }

      if (key === 'Enter') {
        if (input.length === targetLower.length) {
          handleSubmit();
        }
        return;
      }

      if (key.length !== 1) return;
      if (/[a-z]/i.test(key)) {
        // 正在错误反馈中且未达上限，输入新字母时清掉反馈
        if (showResult && !isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS) {
          setShowResult(false);
        }
        const lowerKey = key.toLowerCase();
        const expected = targetLower[input.length];

        setStats((s) => ({
          ...s,
          totalKeystrokes: s.totalKeystrokes + 1,
          correctKeystrokes:
            s.correctKeystrokes + (lowerKey === expected ? 1 : 0),
          consecutiveErrors: lowerKey === expected ? 0 : s.consecutiveErrors + 1,
        }));

        if (lowerKey === expected) {
          setInput((prev) => prev + lowerKey);
          setErrorKey('');
        } else {
          setErrorKey(lowerKey);
          setShakeInput(true);
          setTimeout(() => setShakeInput(false), 400);
          setTimeout(() => setErrorKey(''), 500);
        }
      }
    },
    [showResult, isCorrect, wrongAttempts, input, targetLower],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === ' ') {
        e.preventDefault();
        handleKeyPress(' ');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('Backspace');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress('Enter');
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const handleSubmit = (): void => {
    if (!input.trim()) return;
    if (showResult && isCorrect) return;
    if (showResult && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;

    const correct = input.trim().toLowerCase() === targetLower;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      if (wrongAttempts === 0) {
        setCorrectCount((prev) => prev + 1);
      }
    } else {
      const next = wrongAttempts + 1;
      setWrongAttempts(next);
    }
    logger.info(`拼写练习：${targetWord} → ${correct ? '正确' : '错误'}`);
  };

  const goToNext = (): void => {
    if (currentIndex >= shuffledWords.length - 1) {
      setFinished(true);
      onComplete?.(correctCount, shuffledWords.length);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
    setErrorKey('');
    setWrongAttempts(0);
  };

  const handleNext = goToNext;

  // 正确后自动下一题；错误达到上限后自动下一题
  useEffect(() => {
    if (!showResult) return;
    let timer: number | null = null;
    if (isCorrect) {
      timer = window.setTimeout(() => {
        goToNext();
      }, 1000);
    } else if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      timer = window.setTimeout(() => {
        goToNext();
      }, 2500);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [showResult, isCorrect, wrongAttempts, currentIndex, shuffledWords.length]);

  const handleRestart = (): void => {
    setCurrentIndex(0);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setFinished(false);
    setWrongAttempts(0);
    setStats({
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      consecutiveErrors: 0,
      startTime: null,
    });
  };

  const accuracy =
    stats.totalKeystrokes > 0
      ? Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100)
      : 100;

  const wpm =
    stats.startTime && input.length > 0
      ? Math.round(
          (input.length / 5) /
            Math.max(1, (Date.now() - stats.startTime) / 60000),
        )
      : 0;

  if (finished) {
    return (
      <div className="text-center py-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
          <span className="text-4xl">🎉</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">练习完成</h3>
        <p className="text-gray-500 mb-6">
          共 {shuffledWords.length} 个单词，答对{' '}
          <span className="text-green-500 font-semibold">{correctCount}</span>{' '}
          个
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-400 mb-1">正确率</p>
            <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-xs text-orange-400 mb-1">打字速度</p>
            <p className="text-2xl font-bold text-orange-600">{wpm} WPM</p>
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={16} />
          再练一轮
        </button>
      </div>
    );
  }

  if (!currentWord) {
    return <div className="py-8 text-center text-gray-400">暂无单词可练习</div>;
  }

  const feedback: 'none' | 'correct' | 'wrong' = !showResult
    ? 'none'
    : isCorrect
      ? 'correct'
      : 'wrong';

  const canType = !showResult || (!isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>第 {currentIndex + 1} / {shuffledWords.length} 题</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Zap size={14} className="text-green-500" />
            正确率 {accuracy}%
          </span>
          <span>答对：{correctCount}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => speak(currentWord.word)}
             className="w-10 h-10 rounded-full glass-card shadow-md flex items-center justify-center text-cyan-400 hover:scale-105 transition-transform"
            aria-label="再听一遍"
          >
            <Volume2 size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-2">请听发音，拼写下面的单词</p>
        <p className="text-2xl font-semibold text-gray-800 mb-1">
          {currentWord.meaning}
        </p>
        {currentWord.partOfSpeech && (
          <p className="text-sm text-gray-400">{currentWord.partOfSpeech}</p>
        )}
        {currentWord.imageUrl && (
           <div className="w-20 h-20 mx-auto mt-4 rounded-lg glass-card overflow-hidden shadow-sm">
             <Image
              src={currentWord.imageUrl}
              alt={currentWord.word}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div
        className={`space-y-3 transition-transform ${
          shakeInput ? 'animate-pulse' : ''
        }`}
      >
        <div className="py-4">
          <UnderlineInput
            value={input}
            feedback={feedback}
            correctAnswer={targetWord}
            showCursor={canType}
            size="lg"
            align="center"
          />
        </div>

        <input
          type="text"
          value={input}
          readOnly
          className="sr-only"
          aria-label="拼写输入"
        />

        {showResult && isCorrect && (
          <div className="text-green-600 font-medium text-center">
            回答正确！
            {currentWord.phonetic && (
              <span className="ml-2 text-fuchsia-400/90 font-normal">
                {currentWord.phonetic}
              </span>
            )}
          </div>
        )}
        {showResult && !isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS && (
          <div className="text-center text-xs text-gray-400">
            {wrongAttempts} / {MAX_WRONG_ATTEMPTS}
          </div>
        )}
        {showResult && !isCorrect && wrongAttempts >= MAX_WRONG_ATTEMPTS && (
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentWord.word}
            </div>
          </div>
        )}
      </div>

      {(!showResult || (!isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS)) && (
        <>
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={() => setKeyboardSlim((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                keyboardSlim
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-white/5 text-slate-300 border border-white/10'
              }`}
            >
              {keyboardSlim ? '精简键盘' : '完整键盘'}
            </button>
          </div>
          <div className="flex justify-center">
            <VirtualKeyboard
              mode={keyboardSlim ? 'simplified' : 'en'}
              onKeyPress={handleKeyPress}
              highlightKey={highlightKey}
              errorKey={errorKey}
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {(!showResult || (!isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS)) ? (
          <button
            onClick={handleSubmit}
            disabled={input.length !== targetLower.length}
            className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交
          </button>
        ) : (
          <span className="text-sm text-gray-400">
            {currentIndex >= shuffledWords.length - 1 ? '练习完成' : '自动进入下一题...'}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-400 text-center">
        支持虚拟键盘点击和物理键盘输入 · 绿色字母提示下一个按键
      </div>
    </div>
  );
};

export default UnitSpellingPractice;
