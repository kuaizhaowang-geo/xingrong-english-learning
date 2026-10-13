import React from 'react';
import { Delete, Check } from 'lucide-react';

interface PinyinKeyboardProps {
  onInput: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** 指法引导：高亮目标按键 */
  targetKey?: string | null;
}

// 声母
const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];

// 韵母
const FINALS = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er', 'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'];

// 声调
const TONES = [
  { label: 'ˉ', value: '1' },
  { label: 'ˊ', value: '2' },
  { label: 'ˇ', value: '3' },
  { label: 'ˋ', value: '4' },
  { label: '轻声', value: '5' },
];

const PinyinKeyboard: React.FC<PinyinKeyboardProps> = ({
  onInput,
  onBackspace,
  onSubmit,
  disabled = false,
  targetKey = null,
}) => {
  const isTarget = (key: string): boolean => targetKey === key;

  return (
    <div
      className="w-full space-y-3 select-none"
      role="keyboard"
      aria-label="拼音虚拟键盘"
    >
      {/* 声母行 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {INITIALS.map((key) => (
          <button
            key={`initial-${key}`}
            type="button"
            disabled={disabled}
            onClick={() => onInput(key)}
            className={`rounded-lg py-2.5 px-3 text-sm font-medium transition-colors
              ${isTarget(key)
                ? 'bg-[#FF6B35] text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-gray-200'
              }
              disabled:opacity-40 disabled:cursor-not-allowed min-w-[2.25rem]`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* 韵母行 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {FINALS.map((key) => (
          <button
            key={`final-${key}`}
            type="button"
            disabled={disabled}
            onClick={() => onInput(key)}
            className={`rounded-lg py-2.5 px-3 text-sm font-medium transition-colors
              ${isTarget(key)
                ? 'bg-[#4361EE] text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-gray-200'
              }
              disabled:opacity-40 disabled:cursor-not-allowed min-w-[2.25rem]`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* 声调 + 操作行 */}
      <div className="flex flex-wrap justify-center items-center gap-1.5">
        {TONES.map((tone) => (
          <button
            key={tone.value}
            type="button"
            disabled={disabled}
            onClick={() => onInput(tone.value)}
            className="rounded-lg py-2.5 px-3 text-sm font-semibold transition-colors
              bg-[#FFF4EF] text-[#FF6B35] hover:bg-[#FFE8DB] active:bg-[#FFDBC4]
              border border-[#FFD4B8]
              disabled:opacity-40 disabled:cursor-not-allowed min-w-[2.5rem]"
          >
            {tone.label}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="rounded-lg py-2.5 px-3.5 text-sm font-medium transition-colors
            bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-1.5"
          aria-label="删除"
        >
          <Delete size={16} />
          <span>删除</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className="rounded-lg py-2.5 px-4 text-sm font-medium transition-colors
            bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white
            hover:from-[#FF5A20] hover:to-[#FF7A40]
            shadow-md hover:shadow-lg
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-1.5"
          aria-label="确认"
        >
          <Check size={16} />
          <span>确认</span>
        </button>
      </div>
    </div>
  );
};

export default PinyinKeyboard;
