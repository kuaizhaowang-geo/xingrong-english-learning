import React, { useMemo } from 'react';

export interface UnderlineInputProps {
  /** 当前已输入内容 */
  value: string;
  /** 目标句子（用于显示完整短横线布局，即使未输入也能看到全部单词的短横线） */
  target?: string;
  /** 反馈状态 */
  feedback: 'none' | 'correct' | 'wrong';
  /** 正确答案（错误时显示在下方对照） */
  correctAnswer?: string;
  /** 已正确完成的单词数（逐词模式下，前 N 个单词显示为绿色已完成态） */
  completedWordCount?: number;
  /** 是否实时校验已输入字符的正确性（输入过程中错字标红） */
  realtimeValidate?: boolean;
  /** 是否显示光标（答题进行中默认 true） */
  showCursor?: boolean;
  /** 字体大小档位 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 对齐方式 */
  align?: 'left' | 'center';
  /** 额外类名 */
  className?: string;
  /** 占位符（空态时在横线上方显示的浅灰提示） */
  placeholder?: string;
}

const SIZE_MAP = {
  sm: { text: 'text-base', underline: 'border-b', wordGap: 'gap-5', charGap: 'gap-0.5', minH: 'min-h-8' },
  md: { text: 'text-xl', underline: 'border-b-2', wordGap: 'gap-6', charGap: 'gap-1', minH: 'min-h-10' },
  lg: { text: 'text-2xl', underline: 'border-b-2', wordGap: 'gap-7', charGap: 'gap-1', minH: 'min-h-12' },
  xl: { text: 'text-3xl', underline: 'border-b-3', wordGap: 'gap-8', charGap: 'gap-1.5', minH: 'min-h-14' },
};

interface CharSlot {
  char: string;
  correct: string;
  isSpace: boolean;
  index: number;
}

interface WordGroup {
  chars: CharSlot[];
  startIndex: number;
  width: number;
}

const UnderlineInput: React.FC<UnderlineInputProps> = ({
  value,
  target = '',
  feedback,
  correctAnswer = '',
  completedWordCount = 0,
  realtimeValidate = false,
  showCursor = true,
  size = 'lg',
  align = 'center',
  className = '',
  placeholder = '',
}) => {
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.lg;

  const reference = useMemo(() => {
    if (feedback === 'wrong' && correctAnswer) return correctAnswer;
    if (target) return target;
    return value;
  }, [feedback, correctAnswer, target, value]);

  const completedCharCount = useMemo(() => {
    if (completedWordCount <= 0 || !reference) return 0;
    const words = reference.split(' ');
    const completed = words.slice(0, completedWordCount);
    return completed.join(' ').length + (completedWordCount > 0 && completedWordCount < words.length ? 1 : 0);
  }, [completedWordCount, reference]);

  const chars: CharSlot[] = useMemo(() => {
    if (!reference) return [];
    const arr: CharSlot[] = [];
    for (let i = 0; i < reference.length; i += 1) {
      const isCompleted = i < completedCharCount;
      let ch: string;
      if (isCompleted) {
        ch = reference[i] ?? '';
      } else {
        const offset = completedCharCount;
        ch = value[i - offset] ?? '';
      }
      const corr = reference[i] ?? '';
      const isSpace = corr === ' ' || (ch === ' ' && corr !== ' ');
      arr.push({ char: ch, correct: corr, isSpace, index: i });
    }
    return arr;
  }, [value, reference, completedCharCount]);

  const wordGroups: WordGroup[] = useMemo(() => {
    const groups: WordGroup[] = [];
    let current: CharSlot[] = [];
    let startIdx = 0;
    for (let i = 0; i < chars.length; i += 1) {
      const c = chars[i];
      if (c.isSpace) {
        if (current.length > 0) {
          groups.push({ chars: current, startIndex: startIdx, width: current.length });
          current = [];
        }
      } else {
        if (current.length === 0) startIdx = i;
        current.push(c);
      }
    }
    if (current.length > 0) {
      groups.push({ chars: current, startIndex: startIdx, width: current.length });
    }
    return groups;
  }, [chars]);

  const cursorIndex = value.length + completedCharCount;
  const totalChars = chars.length;

  let underlineColor = 'border-gray-400';
  let textColor = 'text-gray-800';

  if (feedback === 'correct') {
    underlineColor = 'border-green-500';
    textColor = 'text-green-600';
  } else if (feedback === 'wrong') {
    underlineColor = 'border-red-300';
    textColor = 'text-red-500';
  }

  const alignClass = align === 'left' ? 'justify-start' : 'justify-center';

  const { cursorWordIdx, cursorInWordIdx } = useMemo(() => {
    let wordIdx = 0;
    let accumulated = 0;
    for (let i = 0; i < wordGroups.length; i += 1) {
      const g = wordGroups[i];
      if (cursorIndex <= accumulated + g.chars.length) {
        wordIdx = i;
        return { cursorWordIdx: wordIdx, cursorInWordIdx: cursorIndex - accumulated };
      }
      accumulated += g.chars.length;
      accumulated += 1;
    }
    return { cursorWordIdx: Math.max(0, wordGroups.length - 1), cursorInWordIdx: 0 };
  }, [wordGroups, cursorIndex]);

  const renderChar = (c: CharSlot, globalIdx: number) => {
    const isCursor =
      showCursor && globalIdx === cursorIndex && feedback === 'none';
    const isCompletedWord = globalIdx < completedCharCount;
    const wrongCharMatch = feedback === 'wrong' && c.char && c.correct && c.char.toLowerCase() !== c.correct.toLowerCase();
    const realtimeWrong = realtimeValidate && feedback === 'none' && !isCompletedWord
      && c.char && c.correct && c.char.toLowerCase() !== c.correct.toLowerCase() && globalIdx < cursorIndex;
    const isWrongChar = wrongCharMatch || realtimeWrong;
    const isUnfilledWrong =
      feedback === 'wrong' && !c.char && c.correct && c.correct !== ' ';

    let charColor = 'text-transparent';
    let lineColor = 'border-gray-300'; // 下划线默认可见，灰色

    if (isCompletedWord && feedback === 'none') {
      charColor = 'text-green-600 font-semibold';
      lineColor = 'border-green-500';
    } else if (feedback === 'none') {
      if (globalIdx < cursorIndex) {
        charColor = 'text-gray-800 font-semibold';
        lineColor = 'border-gray-400';
      }
    } else if (isWrongChar) {
      charColor = 'text-red-500 line-through decoration-2';
      lineColor = 'border-red-500';
    } else if (isUnfilledWrong) {
      lineColor = 'border-red-300';
      charColor = 'text-green-500 font-semibold';
    } else if (feedback === 'correct') {
      charColor = 'text-green-600';
      lineColor = 'border-green-500';
    }

    if (isCursor) {
      lineColor = 'border-orange-500';
    }

    const displayChar = feedback === 'wrong' && !c.char && c.correct
      ? c.correct
      : feedback === 'correct'
        ? c.correct
        : isCompletedWord && feedback === 'none'
          ? c.correct
          : c.char || '\u00A0';

    return (
      <span
        key={`c-${globalIdx}`}
        className={`relative inline-flex flex-col items-center min-w-[0.6em] ${sizeClasses.minH}`}
      >
        <span className={`${sizeClasses.text} font-semibold leading-none ${charColor}`}>
          {displayChar}
        </span>
        <span className={`absolute bottom-0 left-0 right-0 ${sizeClasses.underline} ${lineColor}`} />
        {isCursor && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <span className="w-0.5 h-5 bg-orange-500 animate-pulse" />
          </span>
        )}
      </span>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`flex items-end flex-wrap ${alignClass} ${sizeClasses.wordGap} ${sizeClasses.minH}`}
        role="textbox"
        aria-readonly="true"
        aria-label="答题区"
      >
        {wordGroups.map((group, gIdx) => (
          <div
            key={`g-${gIdx}`}
            className={`flex items-end ${sizeClasses.charGap}`}
          >
            {group.chars.map((c) => renderChar(c, c.index))}
          </div>
        ))}

        {!wordGroups.length && placeholder ? (
          <div className={`relative flex-1 ${sizeClasses.minH}`}>
            <span
              className={`absolute bottom-1 left-0 right-0 ${sizeClasses.text} text-gray-300 ${align === 'center' ? 'text-center' : 'text-left'}`}
            >
              {placeholder}
            </span>
            <span className={`absolute bottom-0 left-0 right-0 ${sizeClasses.underline} ${underlineColor}`} />
          </div>
        ) : null}

        {wordGroups.length > 0 &&
          showCursor &&
          feedback === 'none' &&
          cursorIndex >= totalChars && (
            <span
              key="cursor-end"
              className="relative inline-flex flex-col items-center w-1"
              aria-hidden="true"
            >
              <span className={`absolute bottom-0 left-0 right-0 ${sizeClasses.underline} border-transparent`} />
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                <span className="w-0.5 h-5 bg-orange-500 animate-pulse" />
              </span>
            </span>
          )}
      </div>

      {feedback === 'wrong' && correctAnswer && (
        <div className={`mt-3 ${align === 'center' ? 'text-center' : 'text-left'}`}>
          <span className="text-lg font-semibold text-green-600">{correctAnswer}</span>
        </div>
      )}
    </div>
  );
};

export default UnderlineInput;
