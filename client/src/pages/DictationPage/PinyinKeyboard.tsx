import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface PinyinKeyboardProps {
  onInput: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** 当前输入中可用的声调元音（根据最后输入的字母显示对应声调） */
  activeVowel?: string | null;
  className?: string;
}

const ROW1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

const TONE_MAP: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  v: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

const PinyinKeyboard: React.FC<PinyinKeyboardProps> = ({
  onInput,
  onBackspace,
  onSubmit,
  disabled = false,
  activeVowel = null,
  className = '',
}) => {
  const toneOptions = activeVowel ? TONE_MAP[activeVowel] || [] : [];

  return (
    <div
      className={`w-full max-w-2xl mx-auto space-y-2 select-none ${className}`}
      role="keyboard"
      aria-label="拼音虚拟键盘"
    >
      {/* 声调行（有元音激活时显示） */}
      {toneOptions.length > 0 && (
        <div className="flex justify-center gap-2 mb-2">
          {toneOptions.map((toneChar) => (
            <button
              key={toneChar}
              type="button"
              disabled={disabled}
              onClick={() => onInput(toneChar)}
              className="w-14 h-12 rounded-lg text-lg font-semibold transition-all
                bg-[#E0E7FF] text-[#06B6D4] border border-[#06B6D4]/40
                hover:bg-[#06B6D4]/20 hover:border-[#06B6D4]
                hover:shadow-[0_0_12px_rgba(34_211_238_0.4)]
                active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {toneChar}
            </button>
          ))}
        </div>
      )}

      {/* 第一行 */}
      <div className="flex justify-center gap-1.5">
        {ROW1.map((key) => (
          <KeyButton
            key={key}
            label={key}
            disabled={disabled}
            onClick={() => onInput(key)}
          />
        ))}
      </div>

      {/* 第二行 */}
      <div className="flex justify-center gap-1.5">
        {ROW2.map((key) => (
          <KeyButton
            key={key}
            label={key}
            disabled={disabled}
            onClick={() => onInput(key)}
          />
        ))}
      </div>

      {/* 第三行 */}
      <div className="flex justify-center gap-1.5 items-center">
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="h-12 px-4 rounded-lg text-sm font-medium transition-all
            bg-[#F8FAFC] text-slate-700 border border-indigo-200
            hover:bg-[#E0E7FF] hover:border-[#6366F1]/60
            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-1.5"
          aria-label="退格"
        >
          <Delete size={18} />
          <span>删除</span>
        </button>
        {ROW3.map((key) => (
          <KeyButton
            key={key}
            label={key}
            disabled={disabled}
            onClick={() => onInput(key)}
          />
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className="h-12 px-4 rounded-lg text-sm font-medium transition-all
            bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white
            hover:shadow-[0_0_16px_rgba(124_58_237_0.5)]
            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-1.5"
          aria-label="提交"
        >
          <CornerDownLeft size={18} />
          <span>提交</span>
        </button>
      </div>
    </div>
  );
};

interface KeyButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const KeyButton: React.FC<KeyButtonProps> = ({
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-10 h-12 sm:w-11 rounded-lg text-base font-semibold transition-all
        bg-[#F8FAFC] text-slate-700 border border-indigo-200
        hover:bg-[#E0E7FF] hover:border-[#6366F1]/60
        hover:shadow-[0_0_8px_rgba(124_58_237_0.3)]
        active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
        uppercase"
    >
      {label}
    </button>
  );
};

export default PinyinKeyboard;
