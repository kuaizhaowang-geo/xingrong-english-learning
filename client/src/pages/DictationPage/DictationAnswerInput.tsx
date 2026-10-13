import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { DictationSessionWord } from '@shared/api.interface';

interface DictationAnswerInputProps {
  isCharMode: boolean;
  word: DictationSessionWord;
  userInput: string;
  feedback: 'none' | 'correct' | 'wrong';
  inputRef: React.RefObject<HTMLInputElement>;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * 听写答题输入区
 * - 汉字模式：大下划线输入框
 * - 拼音模式：大字显示 + 下划线反馈
 */
const DictationAnswerInput: React.FC<DictationAnswerInputProps> = ({
  isCharMode,
  word,
  userInput,
  feedback,
  inputRef,
  onInputChange,
  onKeyDown,
}) => {
  const borderColor =
    feedback === 'correct'
      ? '#06B6D4'
      : feedback === 'wrong'
        ? '#EF476F'
        : 'rgba(99, 102, 241, 0.35)';

  const glowColor =
    feedback === 'correct'
      ? 'rgba(34, 211, 238, 0.3)'
      : feedback === 'wrong'
        ? 'rgba(239, 71, 111, 0.3)'
        : 'none';

  return (
    <div className="w-full max-w-md">
      {isCharMode ? (
        // 汉字模式：大下划线输入框
        <div>
          <div
            onClick={() => inputRef.current?.focus()}
            className="cursor-text text-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={feedback !== 'none'}
              className="w-full text-center bg-transparent text-5xl font-bold
                text-slate-800 border-b-4 pb-3 outline-none
                placeholder-[#94A3B8]/30
                focus:border-[#6366F1] transition-colors"
              style={{
                borderColor,
                boxShadow: `0 4px 20px ${glowColor}`,
              }}
              placeholder="请输入汉字"
              autoFocus
            />
          </div>
          {feedback === 'wrong' && (
            <p className="text-center mt-4 text-xl text-[#06B6D4] font-semibold">
              正确答案：{word.word}
            </p>
          )}
        </div>
      ) : (
        // 拼音模式：大字显示 + 下划线反馈
        <div className="text-center">
          <div className="text-5xl font-bold text-slate-800 mb-2 min-h-[60px]">
            {userInput || (
              <span className="text-slate-300">请输入拼音</span>
            )}
          </div>
          <div
            className="h-1 rounded-full mx-auto transition-all"
            style={{
              width: userInput ? '100%' : '60%',
              background: borderColor,
              boxShadow:
                feedback !== 'none'
                  ? `0 0 10px ${glowColor}`
                  : 'none',
            }}
          />
          {feedback === 'wrong' && (
            <p className="mt-4 text-xl text-[#06B6D4] font-semibold">
              正确答案：{word.pinyin}
            </p>
          )}
        </div>
      )}

      {/* 反馈图标 */}
      {feedback !== 'none' && (
        <div className="flex justify-center mt-4">
          {feedback === 'correct' ? (
            <div className="flex items-center gap-2 text-[#06B6D4]">
              <CheckCircle size={28} />
              <span className="font-semibold text-lg">回答正确！</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#EF476F]">
              <XCircle size={28} />
              <span className="font-semibold text-lg">回答错误</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DictationAnswerInput;
