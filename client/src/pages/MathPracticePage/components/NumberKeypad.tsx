import React from 'react';
import { Delete, Check } from 'lucide-react';

interface NumberKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onBackspace?: () => void;
  disabled?: boolean;
  maxLength?: number;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  className?: string;
}

const NumberKeypad: React.FC<NumberKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  onBackspace,
  disabled = false,
  maxLength = 10,
  allowNegative = false,
  allowDecimal = true,
  className = '',
}) => {
  const handleKeyPress = (key: string): void => {
    if (disabled) return;

    if (key === 'backspace') {
      if (onBackspace) {
        onBackspace();
      } else {
        onChange(value.slice(0, -1));
      }
      return;
    }

    if (key === 'submit') {
      onSubmit?.();
      return;
    }

    if (key === 'clear') {
      onChange('');
      return;
    }

    // 限制长度
    if (value.length >= maxLength) return;

    // 负号处理
    if (key === '-') {
      if (!allowNegative) return;
      if (value.startsWith('-')) {
        onChange(value.slice(1));
      } else {
        onChange('-' + value);
      }
      return;
    }

    // 小数点处理
    if (key === '.') {
      if (!allowDecimal) return;
      if (value.includes('.')) return;
      if (value === '' || value === '-') {
        onChange(value + '0.');
      } else {
        onChange(value + '.');
      }
      return;
    }

    // 数字键
    if (value === '0') {
      onChange(key);
    } else if (value === '-0') {
      onChange('-' + key);
    } else {
      onChange(value + key);
    }
  };

  const keys: Array<{
    label: string;
    value: string;
    span?: number;
    variant?: 'number' | 'action' | 'submit' | 'clear';
  }> = [
    { label: '7', value: '7', variant: 'number' },
    { label: '8', value: '8', variant: 'number' },
    { label: '9', value: '9', variant: 'number' },
    { label: '←', value: 'backspace', variant: 'action' },
    { label: '4', value: '4', variant: 'number' },
    { label: '5', value: '5', variant: 'number' },
    { label: '6', value: '6', variant: 'number' },
    { label: '清空', value: 'clear', variant: 'clear' },
    { label: '1', value: '1', variant: 'number' },
    { label: '2', value: '2', variant: 'number' },
    { label: '3', value: '3', variant: 'number' },
    { label: '确定', value: 'submit', variant: 'submit', span: 2 },
    { label: '0', value: '0', variant: 'number', span: 2 },
    ...(allowDecimal
      ? [{ label: '.', value: '.', variant: 'number' as const }]
      : []),
  ];

  const getKeyStyle = (variant?: string): string => {
    switch (variant) {
      case 'submit':
        return 'bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-md hover:shadow-lg active:scale-95';
      case 'clear':
        return 'bg-white/5 text-slate-300 hover:bg-white/15 active:scale-95 font-medium';
      case 'action':
        return 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 active:scale-95';
      default:
        return 'bg-white/10 text-white hover:bg-white/20 active:scale-95 border border-white/15 font-semibold';
    }
  };

  return (
    <div
      className={`grid grid-cols-4 gap-2 p-3 bg-white/5 border border-white/10 rounded-xl ${className}`}
    >
      {keys.map((key, idx) => (
        <button
          key={idx}
          onClick={() => handleKeyPress(key.value)}
          disabled={disabled}
          className={`
            h-12 rounded-xl text-lg transition-all
            flex items-center justify-center
            ${getKeyStyle(key.variant)}
            ${key.span === 2 ? 'col-span-2' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {key.value === 'backspace' ? (
            <Delete size={20} />
          ) : key.value === 'submit' ? (
            <span className="flex items-center gap-1">
              <Check size={18} />
              {key.label}
            </span>
          ) : (
            key.label
          )}
        </button>
      ))}
    </div>
  );
};

export default NumberKeypad;
