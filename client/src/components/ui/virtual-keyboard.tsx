import React from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

type Finger =
  | 'l-pinky'
  | 'l-ring'
  | 'l-middle'
  | 'l-index'
  | 'r-index'
  | 'r-middle'
  | 'r-ring'
  | 'r-pinky'
  | 'thumb';

const FINGER_COLORS: Record<Finger, string> = {
  'l-pinky': 'bg-red-100 hover:bg-red-200',
  'l-ring': 'bg-orange-100 hover:bg-orange-200',
  'l-middle': 'bg-yellow-100 hover:bg-yellow-200',
  'l-index': 'bg-green-100 hover:bg-green-200',
  'r-index': 'bg-cyan-100 hover:bg-cyan-200',
  'r-middle': 'bg-blue-100 hover:bg-blue-200',
  'r-ring': 'bg-indigo-100 hover:bg-indigo-200',
  'r-pinky': 'bg-purple-100 hover:bg-purple-200',
  thumb: 'bg-gray-200 hover:bg-gray-300',
};

interface KeyDef {
  label: string;
  value: string;
  finger: Finger;
  width?: string; // tailwind width class override
}

// ─── English keyboard layout (5 rows) ───────────────────────────────────────

const EN_ROW_1: KeyDef[] = [
  { label: '`', value: '`', finger: 'l-pinky' },
  { label: '1', value: '1', finger: 'l-pinky' },
  { label: '2', value: '2', finger: 'l-ring' },
  { label: '3', value: '3', finger: 'l-middle' },
  { label: '4', value: '4', finger: 'l-index' },
  { label: '5', value: '5', finger: 'l-index' },
  { label: '6', value: '6', finger: 'r-index' },
  { label: '7', value: '7', finger: 'r-index' },
  { label: '8', value: '8', finger: 'r-middle' },
  { label: '9', value: '9', finger: 'r-ring' },
  { label: '0', value: '0', finger: 'r-pinky' },
  { label: '-', value: '-', finger: 'r-pinky' },
  { label: '=', value: '=', finger: 'r-pinky' },
  { label: 'Backspace', value: 'Backspace', finger: 'r-pinky', width: 'w-20' },
];

const EN_ROW_2: KeyDef[] = [
  { label: 'Tab', value: 'Tab', finger: 'l-pinky', width: 'w-14' },
  { label: 'Q', value: 'q', finger: 'l-pinky' },
  { label: 'W', value: 'w', finger: 'l-ring' },
  { label: 'E', value: 'e', finger: 'l-middle' },
  { label: 'R', value: 'r', finger: 'l-index' },
  { label: 'T', value: 't', finger: 'l-index' },
  { label: 'Y', value: 'y', finger: 'r-index' },
  { label: 'U', value: 'u', finger: 'r-index' },
  { label: 'I', value: 'i', finger: 'r-middle' },
  { label: 'O', value: 'o', finger: 'r-ring' },
  { label: 'P', value: 'p', finger: 'r-pinky' },
  { label: '[', value: '[', finger: 'r-pinky' },
  { label: ']', value: ']', finger: 'r-pinky' },
  { label: '\\', value: '\\', finger: 'r-pinky', width: 'w-12' },
];

const EN_ROW_3: KeyDef[] = [
  { label: 'Caps', value: 'CapsLock', finger: 'l-pinky', width: 'w-16' },
  { label: 'A', value: 'a', finger: 'l-pinky' },
  { label: 'S', value: 's', finger: 'l-ring' },
  { label: 'D', value: 'd', finger: 'l-middle' },
  { label: 'F', value: 'f', finger: 'l-index' },
  { label: 'G', value: 'g', finger: 'l-index' },
  { label: 'H', value: 'h', finger: 'r-index' },
  { label: 'J', value: 'j', finger: 'r-index' },
  { label: 'K', value: 'k', finger: 'r-middle' },
  { label: 'L', value: 'l', finger: 'r-ring' },
  { label: ';', value: ';', finger: 'r-pinky' },
  { label: "'", value: "'", finger: 'r-pinky' },
  { label: 'Enter', value: 'Enter', finger: 'r-pinky', width: 'w-20' },
];

const EN_ROW_4: KeyDef[] = [
  { label: 'Shift', value: 'Shift', finger: 'l-pinky', width: 'w-20' },
  { label: 'Z', value: 'z', finger: 'l-pinky' },
  { label: 'X', value: 'x', finger: 'l-ring' },
  { label: 'C', value: 'c', finger: 'l-middle' },
  { label: 'V', value: 'v', finger: 'l-index' },
  { label: 'B', value: 'b', finger: 'l-index' },
  { label: 'N', value: 'n', finger: 'r-index' },
  { label: 'M', value: 'm', finger: 'r-index' },
  { label: ',', value: ',', finger: 'r-middle' },
  { label: '.', value: '.', finger: 'r-ring' },
  { label: '/', value: '/', finger: 'r-pinky' },
  { label: 'Shift', value: 'Shift', finger: 'r-pinky', width: 'w-24' },
];

const EN_ROW_5: KeyDef[] = [
  { label: 'Ctrl', value: 'Control', finger: 'l-pinky', width: 'w-12' },
  { label: 'Alt', value: 'Alt', finger: 'l-pinky', width: 'w-12' },
  { label: '', value: ' ', finger: 'thumb', width: 'w-72' },
  { label: 'Alt', value: 'Alt', finger: 'r-pinky', width: 'w-12' },
  { label: 'Ctrl', value: 'Control', finger: 'r-pinky', width: 'w-12' },
];

const EN_LAYOUT: KeyDef[][] = [EN_ROW_1, EN_ROW_2, EN_ROW_3, EN_ROW_4, EN_ROW_5];

// ─── Pinyin keyboard layout ────────────────────────────────────────────────
// Same letter rows + a top tone row (simplified: tone numbers 1-5)

const TONE_ROW: KeyDef[] = [
  { label: '阴平 ˉ', value: '1', finger: 'l-pinky', width: 'w-16' },
  { label: '阳平 ˊ', value: '2', finger: 'l-ring', width: 'w-16' },
  { label: '上声 ˇ', value: '3', finger: 'l-middle', width: 'w-16' },
  { label: '去声 ˋ', value: '4', finger: 'r-middle', width: 'w-16' },
  { label: '轻声 ·', value: '5', finger: 'r-pinky', width: 'w-16' },
];

const PINYIN_LAYOUT: KeyDef[][] = [
  TONE_ROW,
  EN_ROW_2.map((k: KeyDef) =>
    k.value.length === 1 && /[a-z]/.test(k.value) ? k : k,
  ),
  EN_ROW_3.map((k: KeyDef) =>
    k.value.length === 1 && /[a-z]/.test(k.value) ? k : k,
  ),
  EN_ROW_4.map((k: KeyDef) =>
    k.value.length === 1 && /[a-z]/.test(k.value) ? k : k,
  ),
  EN_ROW_5,
];

// ─── Component ─────────────────────────────────────────────────────────────

export interface VirtualKeyboardProps {
  mode?: 'en' | 'pinyin' | 'simplified';
  onKeyPress?: (key: string) => void;
  highlightKey?: string;
  errorKey?: string;
  targetKey?: string;
  showGuide?: boolean;
  disabled?: boolean;
  uppercase?: boolean;
  theme?: 'light' | 'neon';
}

// ─── Simplified keyboard layout (26 letters + Backspace + Enter) ──────────

const SIMPLIFIED_ROW_1: KeyDef[] = EN_ROW_2.filter(
  (k: KeyDef) => k.value.length === 1 && /[a-z]/.test(k.value),
);

const SIMPLIFIED_ROW_2: KeyDef[] = EN_ROW_3.filter(
  (k: KeyDef) => k.value.length === 1 && /[a-z]/.test(k.value),
).concat([
  { label: 'Enter', value: 'Enter', finger: 'r-pinky', width: 'w-20' },
]);

const SIMPLIFIED_ROW_3: KeyDef[] = [
  { label: 'Backspace', value: 'Backspace', finger: 'l-pinky', width: 'w-20' },
  ...EN_ROW_4.filter(
    (k: KeyDef) => k.value.length === 1 && /[a-z]/.test(k.value),
  ),
];

const SIMPLIFIED_LAYOUT: KeyDef[][] = [
  SIMPLIFIED_ROW_1,
  SIMPLIFIED_ROW_2,
  SIMPLIFIED_ROW_3,
];

// ─── Component ─────────────────────────────────────────────────────────────

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  mode = 'en',
  onKeyPress,
  highlightKey,
  errorKey,
  targetKey,
  showGuide = false,
  disabled = false,
  uppercase = false,
  theme = 'light',
}) => {
  const layout =
    mode === 'pinyin'
      ? PINYIN_LAYOUT
      : mode === 'simplified'
        ? SIMPLIFIED_LAYOUT
        : EN_LAYOUT;

  const handleKeyClick = (key: string) => {
    if (disabled) return;
    try {
      onKeyPress?.(key);
    } catch (err) {
      logger.error(`VirtualKeyboard onKeyPress error: ${String(err)}`);
    }
  };

  const isHighlight = (keyValue: string): boolean => {
    if (!highlightKey) return false;
    const target = highlightKey.toLowerCase();
    return keyValue.toLowerCase() === target;
  };

  const isError = (keyValue: string): boolean => {
    if (!errorKey) return false;
    const target = errorKey.toLowerCase();
    return keyValue.toLowerCase() === target;
  };

  const isTarget = (keyValue: string): boolean => {
    if (!targetKey) return false;
    const t = targetKey.toLowerCase();
    return keyValue.toLowerCase() === t;
  };

  const displayLabel = (key: KeyDef): string => {
    // Single letter: respect uppercase flag
    if (key.value.length === 1 && /[a-zA-Z]/.test(key.value)) {
      return uppercase ? key.value.toUpperCase() : key.value.toLowerCase();
    }
    return key.label;
  };

  const isNeon = theme === 'neon';

  return (
    <div
      className={`w-fit select-none rounded-xl p-3 shadow-md ${
        isNeon
          ? 'bg-slate-900 border border-slate-700/50'
          : 'bg-white'
      }`}
      style={isNeon ? { boxShadow: '0 0 30px rgba(99,102,241,0.15), inset 0 1px 0 rgba(148,163,184,0.1)' } : undefined}
    >
      {layout.map((row: KeyDef[], rowIdx: number) => (
        <div
          key={`row-${rowIdx}`}
          className="flex justify-center gap-1.5 mb-1.5 last:mb-0"
        >
          {row.map((key: KeyDef, keyIdx: number) => {
            const widthCls = key.width ?? 'w-9';
            const fingerCls = FINGER_COLORS[key.finger];
            const highlighted = isHighlight(key.value);
            const errored = isError(key.value);
            const targeted = isTarget(key.value);

            return (
              <button
                key={`${key.value}-${keyIdx}`}
                type="button"
                disabled={disabled}
                onClick={() => handleKeyClick(key.value)}
                className={[
                  widthCls,
                  'h-9 rounded-lg text-sm font-medium',
                  'flex items-center justify-center relative',
                  'transition-all duration-150 active:scale-95',
                  disabled
                    ? isNeon
                      ? 'bg-slate-800/60 text-slate-500 border border-slate-700/50 opacity-50 cursor-not-allowed'
                      : `${fingerCls} opacity-50 cursor-not-allowed`
                    : isNeon
                      ? 'bg-slate-800 text-slate-200 border border-slate-600/70 hover:bg-slate-700 cursor-pointer'
                      : `${fingerCls} cursor-pointer`,
                  highlighted
                    ? isNeon
                      ? '!bg-emerald-900/60 !text-emerald-300 !border-emerald-400 scale-105 z-10'
                      : 'ring-2 ring-green-500 scale-110 z-10 shadow-lg animate-pulse'
                    : '',
                  targeted
                    ? isNeon
                      ? '!border-purple-400 !bg-purple-900/40 !text-purple-200 scale-105 z-10 animate-pulse'
                      : 'ring-2 ring-purple-500 scale-105 z-10 animate-pulse'
                    : '',
                  errored
                    ? isNeon
                      ? '!bg-red-900/60 !text-red-300 !border-red-400 animate-pulse'
                      : 'ring-2 ring-red-400 animate-pulse'
                    : '',
                ].join(' ')}
                style={isNeon && targeted
                  ? { boxShadow: '0 0 18px rgba(168,85,247,0.8), inset 0 0 8px rgba(168,85,247,0.4)' }
                  : isNeon && highlighted
                    ? { boxShadow: '0 0 16px rgba(16,185,129,0.7), inset 0 0 6px rgba(16,185,129,0.3)' }
                    : isNeon && errored
                      ? { boxShadow: '0 0 14px rgba(239,68,68,0.7), inset 0 0 6px rgba(239,68,68,0.3)' }
                      : isNeon
                        ? { boxShadow: 'inset 0 1px 0 rgba(148,163,184,0.08)' }
                        : undefined}
              >
                {/* 指法标记：目标键上显示手指颜色小圆点 */}
                {showGuide && targeted && key.finger && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white z-20"
                    style={{
                      backgroundColor: key.finger.startsWith('l-')
                        ? '#60a5fa'
                        : key.finger.startsWith('r-')
                          ? '#fb923c'
                          : '#9ca3af',
                    }}
                  />
                )}
                {displayLabel(key)}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default VirtualKeyboard;
