import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { speak } from '../speak';

interface TypingModeProps {
  targetText: string;
  displayText?: string;
  imageEmoji?: string;
  onComplete: (result: { correct: boolean; time: number }) => void;
  onBack: () => void;
  accentColor?: string;
}

const TypingMode: React.FC<TypingModeProps> = ({
  targetText,
  displayText,
  imageEmoji,
  onComplete,
  onBack,
  accentColor = '#818CF8',
}) => {
  const [input, setInput] = useState<string>('');
  const [startTime] = useState<number>(Date.now());
  const [completed, setCompleted] = useState<boolean>(false);
  const [showStars, setShowStars] = useState<boolean>(false);

  const display = displayText || targetText;

  const handleComplete = useCallback(() => {
    if (completed) return;
    setCompleted(true);
    setShowStars(true);
    const time = (Date.now() - startTime) / 1000;
    const correct = input.toLowerCase().trim() === targetText.toLowerCase().trim();
    setTimeout(() => {
      onComplete({ correct, time });
    }, 600);
  }, [completed, input, targetText, startTime, onComplete]);

  useEffect(() => {
    if (input.length >= targetText.length && !completed) {
      handleComplete();
    }
  }, [input, targetText, completed, handleComplete]);

  const renderTargetText = (): React.ReactNode => {
    return display.split('').map((char: string, idx: number) => {
      const typedChar = input[idx];
      let className = 'inline-block transition-all duration-200 ';
      if (typedChar === undefined) {
        className += 'text-gray-500';
      } else if (typedChar.toLowerCase() === char.toLowerCase()) {
        className += 'text-green-500';
      } else {
        className += 'text-red-500';
      }
      return (
        <span key={idx} className={className}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4 flex justify-center gap-2">
            {showStars && (
              <>
                <Star
                  className="text-yellow-400 fill-yellow-400 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                  size={48}
                />
                <Star
                  className="text-yellow-400 fill-yellow-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                  size={48}
                />
                <Star
                  className="text-yellow-400 fill-yellow-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                  size={48}
                />
              </>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">太棒啦！🎉</div>
          <div className="text-gray-500">你完成得非常好！</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-purple-600 font-medium"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="text-gray-500 text-sm">打字练习</div>
        <div className="w-16" />
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {imageEmoji && (
          <div className="text-7xl mb-4">{imageEmoji}</div>
        )}

        <button
          onClick={() => speak(targetText, 0.7)}
          className="mb-4 px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform"
        >
          🔊 听发音
        </button>

        <div className="text-5xl font-bold tracking-wide font-mono">
          {renderTargetText()}
        </div>

        <div className="mt-6 text-lg text-gray-600 min-h-[2rem] font-mono">
          {input || <span className="text-gray-600">开始输入...</span>}
          <span className="animate-pulse text-purple-400">|</span>
        </div>
      </div>

      {/* 键盘 */}
      <div className="px-2 pb-3">
        <VirtualKeyboard
          layout="qwerty"
          value={input}
          onChange={setInput}
          fullWidth
          targetText={targetText}
          showNextGuide
          showTypedHighlight
          theme="light"
        />
      </div>
    </div>
  );
};

export default TypingMode;
