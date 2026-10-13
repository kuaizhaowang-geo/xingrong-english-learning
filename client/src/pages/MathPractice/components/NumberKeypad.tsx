import React from 'react';
import { Delete, Eraser, Check, Divide } from 'lucide-react';

export interface NumberKeypadProps {
  value: string;
  onInput: (value: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
  /** 高亮目标键（紫光），用于指法引导 */
  targetKey?: string | null;
  /** 反馈状态：正确青光 / 错误红光 */
  feedback?: 'none' | 'correct' | 'wrong';
  className?: string;
}

/**
 * 虚拟数字键盘（4 列 × 4 行）
 * 布局：
 *   7  8  9  删
 *   4  5  6  清
 *   1  2  3  确
 *   .  0  -  ÷
 *
 * 主题：深蓝紫科技感
 */
const NumberKeypad: React.FC<NumberKeypadProps> = ({
  value,
  onInput,
  onSubmit,
  onDelete,
  onClear,
  disabled = false,
  targetKey = null,
  feedback = 'none',
  className = '',
}) => {
  const handleNumber = (num: string): void => {
    if (disabled) return;
    onInput(value + num);
  };

  const handleDot = (): void => {
    if (disabled) return;
    if (value.includes('.')) return;
    if (value === '' || value === '-') {
      onInput(value + '0.');
    } else {
      onInput(value + '.');
    }
  };

  const handleMinus = (): void => {
    if (disabled) return;
    if (value.startsWith('-')) {
      onInput(value.slice(1));
    } else {
      onInput('-' + value);
    }
  };

  const isTarget = (key: string): boolean => {
    if (!targetKey) return false;
    return targetKey === key;
  };

  // 反馈整体边框色
  const feedbackRing =
    feedback === 'correct'
      ? 'ring-2 ring-cyan-400/60 shadow-[0_0_30px_rgba(34_211_238_0.25)]'
      : feedback === 'wrong'
        ? 'ring-2 ring-rose-500/60 shadow-[0_0_30px_rgba(239_71_111_0.25)]'
        : '';

  const keyBase =
    'relative h-14 rounded-xl text-xl font-semibold transition-all duration-150 flex items-center justify-center select-none';
  const keyNormal =
    'bg-white/10 text-white hover:bg-white/20 active:scale-95 border border-white/10';
  const keyAction =
    'bg-white/5 text-slate-300 hover:bg-white/15 active:scale-95 border border-white/10';
  const keySubmit =
    'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_4px_20px_rgba(124_58_237_0.4)] hover:shadow-[0_4px_28px_rgba(124_58_237_0.55)] active:scale-95';
  const keyTarget =
    'bg-[#6366F1] text-white shadow-[0_0_20px_rgba(124_58_237_0.6)] ring-2 ring-purple-400/70 animate-pulse';

  const getKeyClass = (
    variant: 'number' | 'action' | 'submit' | 'symbol',
    keyLabel: string,
  ): string => {
    const target = isTarget(keyLabel) ? keyTarget : '';
    if (target) return `${keyBase} ${target}`;
    switch (variant) {
      case 'submit':
        return `${keyBase} ${keySubmit}`;
      case 'action':
        return `${keyBase} ${keyAction}`;
      case 'symbol':
        return `${keyBase} ${keyAction}`;
      default:
        return `${keyBase} ${keyNormal}`;
    }
  };

  const btnDisabled = disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <div
      className={`w-full max-w-md mx-auto p-4 rounded-2xl glass-card ${feedbackRing} ${className}`}
    >
      {/* 当前输入显示 */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-white/5 backdrop-blur border border-white/10 text-right">
        <div className="text-xs text-slate-400 mb-1">你的答案</div>
        <div
          className={`text-3xl font-bold tracking-wider min-h-[40px] ${
            feedback === 'correct'
              ? 'text-cyan-400'
              : feedback === 'wrong'
                ? 'text-rose-400'
                : 'text-white'
          }`}
        >
          {value || <span className="text-slate-500">_</span>}
        </div>
      </div>

      {/* 键盘区 4x4 */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: 7 8 9 删 */}
        <button
          type="button"
          onClick={() => handleNumber('7')}
          disabled={disabled}
          className={`${getKeyClass('number', '7')} ${btnDisabled}`}
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleNumber('8')}
          disabled={disabled}
          className={`${getKeyClass('number', '8')} ${btnDisabled}`}
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleNumber('9')}
          disabled={disabled}
          className={`${getKeyClass('number', '9')} ${btnDisabled}`}
        >
          9
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className={`${getKeyClass('action', 'backspace')} ${btnDisabled}`}
          aria-label="删除"
        >
          <Delete size={20} />
        </button>

        {/* Row 2: 4 5 6 清 */}
        <button
          type="button"
          onClick={() => handleNumber('4')}
          disabled={disabled}
          className={`${getKeyClass('number', '4')} ${btnDisabled}`}
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleNumber('5')}
          disabled={disabled}
          className={`${getKeyClass('number', '5')} ${btnDisabled}`}
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleNumber('6')}
          disabled={disabled}
          className={`${getKeyClass('number', '6')} ${btnDisabled}`}
        >
          6
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className={`${getKeyClass('action', 'clear')} ${btnDisabled}`}
          aria-label="清空"
        >
          <Eraser size={20} />
        </button>

        {/* Row 3: 1 2 3 确 */}
        <button
          type="button"
          onClick={() => handleNumber('1')}
          disabled={disabled}
          className={`${getKeyClass('number', '1')} ${btnDisabled}`}
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleNumber('2')}
          disabled={disabled}
          className={`${getKeyClass('number', '2')} ${btnDisabled}`}
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleNumber('3')}
          disabled={disabled}
          className={`${getKeyClass('number', '3')} ${btnDisabled}`}
        >
          3
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || value.length === 0}
          className={`${getKeyClass('submit', 'submit')} ${
            disabled || value.length === 0
              ? 'opacity-50 cursor-not-allowed'
              : btnDisabled
          }`}
          aria-label="提交"
        >
          <Check size={22} />
        </button>

        {/* Row 4: . 0 - ÷ */}
        <button
          type="button"
          onClick={handleDot}
          disabled={disabled}
          className={`${getKeyClass('number', '.')} ${btnDisabled}`}
        >
          .
        </button>
        <button
          type="button"
          onClick={() => handleNumber('0')}
          disabled={disabled}
          className={`${getKeyClass('number', '0')} ${btnDisabled}`}
        >
          0
        </button>
        <button
          type="button"
          onClick={handleMinus}
          disabled={disabled}
          className={`${getKeyClass('symbol', '-')} ${btnDisabled}`}
        >
          −
        </button>
        <button
          type="button"
          disabled
          className={`${keyBase} ${keyAction} opacity-30 cursor-not-allowed`}
          aria-label="除号（预留）"
        >
          <Divide size={20} />
        </button>
      </div>
    </div>
  );
};

export default NumberKeypad;
