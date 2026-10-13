import { useMemo } from 'react';

export interface AnswerSlotsProps {
  /** 当前已输入内容 */
  value: string;
  /** 正确答案总长度（决定格子数量） */
  totalLength: number;
  /** 反馈状态 */
  feedback: 'none' | 'correct' | 'wrong';
  /** 正确答案（错误时显示） */
  correctAnswer?: string;
  /** 额外类名 */
  className?: string;
}

const AnswerSlots: React.FC<AnswerSlotsProps> = ({
  value,
  totalLength,
  feedback,
  correctAnswer = '',
  className = '',
}) => {
  const slots = useMemo(() => {
    const result: Array<{
      char: string;
      correctChar: string;
      isSpace: boolean;
      index: number;
    }> = [];
    for (let i = 0; i < totalLength; i++) {
      const char = value[i] ?? '';
      const correctChar = correctAnswer[i] ?? '';
      const isSpace = correctChar === ' ';
      result.push({ char, correctChar: isSpace ? '' : correctChar, isSpace, index: i });
    }
    return result;
  }, [value, totalLength, correctAnswer]);

  // 超长时格子变小，保证在一屏内能看到
  const slotSize = useMemo(() => {
    if (totalLength <= 8) return { w: 'w-12', h: 'h-14', text: 'text-2xl' };
    if (totalLength <= 12) return { w: 'w-10', h: 'h-12', text: 'text-xl' };
    if (totalLength <= 20) return { w: 'w-8', h: 'h-10', text: 'text-lg' };
    return { w: 'w-7', h: 'h-9', text: 'text-base' };
  }, [totalLength]);

  const cursorIndex = value.length;

  return (
    <div
      className={`flex items-center justify-center gap-1.5 flex-wrap ${className}`}
      role="textbox"
      aria-readonly="true"
    >
      {slots.map((slot, i) => {
        const isCursor = i === cursorIndex && feedback === 'none';
        const isFilled = slot.char !== '';
        const isCorrect = feedback === 'correct' && isFilled;
        const isWrong =
          feedback === 'wrong' &&
          isFilled &&
          slot.char.toLowerCase() !== slot.correctChar.toLowerCase();

        // 空格位：窄分隔
        if (slot.isSpace) {
          return (
            <div
              key={`slot-${i}`}
              className={`${slotSize.h} w-3 flex items-center justify-center`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          );
        }

        let borderClass = 'border-b-4 border-gray-300 bg-gray-50';
        let textClass = 'text-gray-800';
        let bgClass = '';

        if (feedback === 'none') {
          if (isFilled) {
            borderClass = 'border-b-4 border-orange-400 bg-orange-50';
          } else if (isCursor) {
            borderClass = 'border-b-4 border-orange-500 bg-white';
          }
        } else if (isCorrect) {
          borderClass = 'border-b-4 border-green-400 bg-green-50';
          textClass = 'text-green-600';
        } else if (isWrong) {
          borderClass = 'border-b-4 border-red-400 bg-red-50';
          textClass = 'text-red-500 line-through decoration-2';
          bgClass = 'bg-red-50';
        } else if (feedback === 'wrong' && !isFilled) {
          borderClass = 'border-b-4 border-red-300 bg-red-50/50';
        } else if (feedback === 'correct' && !isFilled) {
          borderClass = 'border-b-4 border-green-300 bg-green-50/50';
        }

        return (
          <div
            key={`slot-${i}`}
            className={`relative ${slotSize.w} ${slotSize.h} ${slotSize.text} font-bold flex items-center justify-center rounded-t-lg transition-colors ${borderClass} ${bgClass} ${textClass}`}
          >
            {/* 已输入字母 */}
            {isFilled && <span className="uppercase">{slot.char}</span>}

            {/* 光标闪烁 */}
            {isCursor && !isFilled && (
              <span className="absolute inset-x-0 bottom-1 flex justify-center">
                <span className="w-0.5 h-6 bg-orange-500 animate-pulse" />
              </span>
            )}

            {/* 错误时显示正确答案（小字体在格子底部） */}
            {feedback === 'wrong' && slot.correctChar && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-green-600 uppercase whitespace-nowrap">
                {slot.correctChar}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnswerSlots;
