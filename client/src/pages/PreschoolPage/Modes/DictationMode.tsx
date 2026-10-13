import React, { useState } from 'react';
import { ArrowLeft, Volume2, Lightbulb, Star } from 'lucide-react';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { speak } from '../speak';

interface DictationModeProps {
  targetText: string;
  translation?: string;
  imageEmoji?: string;
  onComplete: (result: { correct: boolean; attempts: number }) => void;
  onBack: () => void;
  accentColor?: string;
}

const DictationMode: React.FC<DictationModeProps> = ({
  targetText,
  translation,
  imageEmoji,
  onComplete,
  onBack,
  accentColor = '#F472B6',
}) => {
  const [input, setInput] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [showStars, setShowStars] = useState<boolean>(false);

  const handlePlay = (): void => {
    speak(targetText, 0.7);
  };

  const handleSubmit = (): void => {
    if (!input.trim()) return;
    const correct = input.toLowerCase().trim() === targetText.toLowerCase().trim();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      setResult('correct');
      setShowAnswer(true);
      setShowStars(true);
      setTimeout(() => {
        onComplete({ correct: true, attempts: newAttempts });
      }, 600);
    } else {
      setResult('wrong');
      setTimeout(() => setResult(null), 500);
    }
  };

  const handleShowAnswer = (): void => {
    setShowAnswer(true);
    setResult('wrong');
      setTimeout(() => {
        onComplete({ correct: false, attempts });
      }, 1500);
  };

  const firstLetter = targetText.charAt(0);
  const hintText = showHint
    ? `首字母: ${firstLetter.toUpperCase()}（共 ${targetText.length} 个字母）`
    : '';

  return (
    <div className="h-full flex flex-col">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-pink-600 font-medium"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="text-gray-500 text-sm">听写练习</div>
        <div className="w-16 text-right text-sm text-gray-500">
          第 {attempts + 1} 次
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {imageEmoji && (
          <div className="text-6xl mb-4 opacity-60">{imageEmoji}</div>
        )}

        {/* 播放按钮 */}
        <button
          onClick={handlePlay}
          className="w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform mb-4"
          style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #FB7185 100%)` }}
        >
          <Volume2 size={40} className="text-white" />
          <span className="text-white text-sm font-bold mt-1">点我听</span>
        </button>

        {translation && (
          <div className="text-gray-600 text-lg mb-2">💡 {translation}</div>
        )}

        {showHint && (
          <div className="text-pink-500 text-sm font-medium mb-2">
            {hintText}
          </div>
        )}

        {/* 输入显示 */}
        <div
          className={`mt-4 w-full max-w-md px-6 py-4 rounded-2xl text-center text-2xl font-bold font-mono transition-all ${
            result === 'correct'
              ? 'bg-green-100 text-green-600'
              : result === 'wrong'
                ? 'bg-red-100 text-red-500'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {input || <span className="text-gray-600 text-lg">输入你听到的内容...</span>}
          {!showAnswer && <span className="animate-pulse text-pink-400">|</span>}
        </div>

        {/* 正确答案 */}
        {showAnswer && (
          <div className="mt-3 text-center">
            <div className="text-sm text-gray-500 mb-1">正确答案</div>
            <div className="text-xl font-bold text-green-600">{targetText}</div>
          </div>
        )}

        {/* 星星动画 */}
        {showStars && (
          <div className="mt-4 flex gap-2">
            {[0, 1, 2].map((i: number) => (
              <Star
                key={i}
                className="text-yellow-400 fill-yellow-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
                size={32}
              />
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        {!showAnswer && (
          <div className="flex gap-3 mt-4">
            {!showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Lightbulb size={16} />
                提示
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-pink-500 text-white rounded-full text-sm font-bold active:scale-95 transition-transform shadow-md"
            >
              提交
            </button>
            <button
              onClick={handleShowAnswer}
              className="px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-sm font-medium active:scale-95 transition-transform"
            >
              看答案
            </button>
          </div>
        )}
      </div>

      {/* 键盘 */}
      <div className="px-2 pb-3">
        <VirtualKeyboard
          layout="qwerty"
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          fullWidth
          disabled={showAnswer}
          theme="light"
        />
      </div>
    </div>
  );
};

export default DictationMode;
