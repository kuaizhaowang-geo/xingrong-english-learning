import React, { useState, useMemo, useRef, useEffect } from 'react';
import SpeechButton from '@client/src/components/ui/speech-button';
import { UnderlineInput } from '@client/src/components/underline-input';

interface DictationQuestion {
  sentence: string;
  translation: string;
  hint?: string;
}

interface UnitDictationPracticeProps {
  questions: DictationQuestion[];
  onComplete: (correctCount: number, total: number) => void;
}

const UnitDictationPractice: React.FC<UnitDictationPracticeProps> = ({
  questions,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_WRONG_ATTEMPTS = 3;
  const currentQ = questions[currentIndex];

  const handleSubmit = (): void => {
    if (!input.trim()) return;
    if (showResult && isCorrect) return;
    if (showResult && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;

    const normalized = input.trim().replace(/\s+/g, ' ').toLowerCase();
    const target = currentQ.sentence.trim().replace(/\s+/g, ' ').toLowerCase();
    const correct = normalized === target;
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
  };

  const goToNext = (): void => {
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      onComplete(correctCount, questions.length);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
    setHintShown(false);
    setWrongAttempts(0);
  };

  const handleNext = goToNext;

  // 正确后自动下一题；错误达到上限后显示答案并自动下一题
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
  }, [showResult, isCorrect, wrongAttempts, currentIndex, questions.length]);

  const handleRestart = (): void => {
    setCurrentIndex(0);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setFinished(false);
    setShowHint(false);
    setHintShown(false);
    setWrongAttempts(0);
  };

  // 输入变化时，如果当前是错误状态且未达上限，清除反馈
  const handleInputChange = (val: string): void => {
    if (showResult && !isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS) {
      setShowResult(false);
    }
    setInput(val);
  };

  const hintText = useMemo(() => {
    if (!currentQ) return '';
    if (currentQ.hint) return currentQ.hint;
    const words = currentQ.sentence.split(' ');
    return words.map((w) => w[0] + '_'.repeat(Math.max(0, w.length - 1))).join(' ');
  }, [currentQ]);

  if (finished) {
    return (
      <div className="text-center py-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
          <span className="text-4xl">🎧</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">听写完成</h3>
        <p className="text-gray-500 mb-6">
          共 {questions.length} 题，答对 <span className="text-green-500 font-semibold">{correctCount}</span> 题
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          再练一轮
        </button>
      </div>
    );
  }

  if (!currentQ) {
    return <div className="py-8 text-center text-gray-400">暂无听写题目</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>第 {currentIndex + 1} / {questions.length} 题</span>
        <span>答对：{correctCount}</span>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">请根据中文意思写出英文句子</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-xl font-semibold text-gray-800">{currentQ.translation}</p>
          <SpeechButton text={currentQ.sentence} size="md" variant="outline" />
        </div>
        <p className="text-xs text-gray-400 mt-2">点击小喇叭听发音，帮助你听写</p>
      </div>

      <div className="space-y-3">
        <div
          className="cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <UnderlineInput
            value={input}
            feedback={!showResult ? 'none' : isCorrect ? 'correct' : 'wrong'}
            correctAnswer={currentQ.sentence}
            showCursor={!showResult || (!isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS)}
            size="lg"
            align="left"
            placeholder="请输入英文句子..."
          />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === ' ' ) {
              e.preventDefault();
              if (!showResult || (!isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS)) {
                handleSubmit();
              } else if (showResult) {
                handleNext();
              }
            } else if (e.key === 'Enter' && !showResult) {
              handleSubmit();
            } else if (e.key === 'Enter' && showResult) {
              handleNext();
            }
          }}
          disabled={showResult && (isCorrect || wrongAttempts >= MAX_WRONG_ATTEMPTS)}
          className="sr-only"
          aria-label="听写输入"
        />
        {showResult && isCorrect && (
          <div className="text-green-600 font-medium text-center">
            回答正确！
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
              {currentQ.sentence}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!showResult && !showHint && (
          <button
            onClick={() => {
              setShowHint(true);
              setHintShown(true);
            }}
            className="px-4 py-2.5 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
          >
            首字母提示
          </button>
        )}
        {showHint && !showResult && (
          <span className="px-4 py-2.5 text-sm text-blue-500 bg-blue-50 rounded-full">
            💡 {hintText}
          </span>
        )}
        <div className="flex-1" />
        {(!showResult || (!isCorrect && wrongAttempts < MAX_WRONG_ATTEMPTS)) ? (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-6 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交
          </button>
        ) : (
          <span className="text-sm text-gray-400">
            {currentIndex >= questions.length - 1 ? '练习完成' : '自动进入下一题...'}
          </span>
        )}
      </div>
    </div>
  );
};

export default UnitDictationPractice;
