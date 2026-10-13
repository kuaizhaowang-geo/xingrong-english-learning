import React from 'react';
import { motion } from 'framer-motion';
import {
  FINGER_COLORS,
  FINGER_LABELS,
  getFingerInfo,
  type FingerKey,
} from '../data/fingerMapping';

export interface VirtualKeyboardProps {
  targetChar: string;
  showKeyboard: boolean;
  pressedKey: string | null;
  wrongKey: string | null;
  /** 是否开启手指引导 */
  fingerGuideEnabled?: boolean;
}

const KEYBOARD_ROWS: string[][] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  [' '],
];

const getDisplayKey = (char: string): string => {
  if (char === ' ') return 'SPACE';
  return char.toUpperCase();
};

const getKeyWidth = (key: string): string => {
  if (key === ' ') return 'w-64 md:w-80';
  return 'w-9 md:w-11';
};

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  targetChar,
  showKeyboard,
  pressedKey,
  wrongKey,
  fingerGuideEnabled = false,
}) => {
  if (!showKeyboard) return null;

  const targetKey = getDisplayKey(targetChar);
  const targetFingerKey: FingerKey | null = targetChar
    ? getFingerInfo(targetChar).finger
    : null;

  return (
    <div className="mt-1 select-none">
      <div className="flex flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row: string[], rowIdx: number) => (
          <div
            key={`row-${rowIdx}`}
            className="flex gap-1.5 md:gap-2 justify-center relative"
            style={{ paddingLeft: rowIdx === 1 ? '1rem' : rowIdx === 2 ? '2.5rem' : 0 }}
          >
            {row.map((key: string) => {
              const keyChar = key === ' ' ? ' ' : key.toLowerCase();
              const isTarget = key === targetKey;
              const isPressed = pressedKey && pressedKey.toUpperCase() === key;
              const isWrong = wrongKey && wrongKey.toUpperCase() === key;

              const fingerInfo = getFingerInfo(keyChar);
              const fingerKey: FingerKey = fingerInfo.finger;
              const fingerColors = FINGER_COLORS[fingerKey];

              const isSameFingerAsTarget =
                fingerGuideEnabled && targetFingerKey && fingerKey === targetFingerKey;

              let keyStyle =
                'bg-[#F8FAFC] text-slate-600 border border-[rgba(124_58_237_0.2)]';
              let shadowStyle = '';
              let extraStyle = '';

              if (isTarget) {
                keyStyle = 'bg-[#6366F1] text-white border-2 border-[#818CF8]';
                shadowStyle =
                  'shadow-[0_0_20px_rgba(124_58_237_0.8),0_0_40px_rgba(124_58_237_0.4)]';
              } else if (isWrong) {
                keyStyle =
                  'bg-[#EF476F] text-white border border-[#F87171]';
                shadowStyle =
                  'shadow-[0_0_15px_rgba(239_71_111_0.6)]';
              } else if (isPressed) {
                keyStyle =
                  'bg-[#06B6D4] text-[#EEF2FF] border border-[#67E8F9]';
                shadowStyle =
                  'shadow-[0_0_15px_rgba(34_211_238_0.6)]';
              } else if (fingerGuideEnabled) {
                // 手指引导开启时，每个键有淡淡的归属颜色
                if (isSameFingerAsTarget) {
                  // 目标键同手指区域：淡描边提示
                  keyStyle =
                    'bg-[#F8FAFC] text-slate-700 border-2';
                  extraStyle = '';
                  shadowStyle = '';
                } else {
                  // 其他键：超淡底色标识
                  keyStyle =
                    'bg-[#F8FAFC] text-slate-600 border border-indigo-200';
                }
              }

              return (
                <motion.div
                  key={key}
                  animate={
                    isTarget
                      ? {
                          scale: [1, 1.06, 1],
                          boxShadow: [
                            '0 0 16px rgba(99, 102, 241, 0.3), 0 0 32px rgba(99, 102, 241, 0.2)',
                            '0 0 28px rgba(99, 102, 241, 0.7), 0 0 56px rgba(99, 102, 241, 0.35)',
                            '0 0 16px rgba(99, 102, 241, 0.3), 0 0 32px rgba(99, 102, 241, 0.2)',
                          ],
                        }
                      : isSameFingerAsTarget && !isWrong && !isPressed
                      ? {
                          boxShadow: [
                            `0 0 8px ${fingerColors.glow}`,
                            `0 0 14px ${fingerColors.glow}`,
                            `0 0 8px ${fingerColors.glow}`,
                          ],
                        }
                      : { scale: 1, boxShadow: 'none' }
                  }
                  transition={{
                    duration: isTarget ? 2 : 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={`
                    relative
                    ${getKeyWidth(key)}
                    h-10 md:h-12
                    rounded-lg
                    flex items-center justify-center
                    text-xs md:text-sm font-medium
                    transition-all duration-150
                    ${keyStyle}
                    ${shadowStyle}
                    ${extraStyle}
                  `}
                  style={{
                    ...(fingerGuideEnabled && !isTarget && !isWrong && !isPressed && isSameFingerAsTarget
                      ? {
                          borderColor: fingerColors.neon,
                          backgroundColor: fingerColors.bgTint,
                        }
                      : {}),
                    ...(fingerGuideEnabled && !isTarget && !isWrong && !isPressed && !isSameFingerAsTarget
                      ? {
                          backgroundColor: fingerColors.bgTint,
                        }
                      : {}),
                  }}
                >
                  {key === ' ' ? 'SPACE' : key}

                  {/* 手指引导：目标键上方的手指名称标签 */}
                  {fingerGuideEnabled && isTarget && targetFingerKey && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-medium pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.6)',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      {FINGER_LABELS[targetFingerKey]}
                    </motion.div>
                  )}

                  {/* 手指引导：非目标键右下角手指短标签（超淡） */}
                  {fingerGuideEnabled && !isTarget && !isWrong && !isPressed && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[8px] font-normal opacity-30 pointer-events-none"
                      style={{ color: fingerColors.neon }}
                    >
                      {fingerKey === 'thumb' ? '' : getShortLabel(fingerKey)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* 手指引导：底部手指色图例 */}
        {fingerGuideEnabled && (
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-[#64748B]">
            <FingerLegend finger="left-pinky" />
            <FingerLegend finger="left-ring" />
            <FingerLegend finger="left-middle" />
            <FingerLegend finger="left-index" />
            <span className="mx-1 opacity-40">|</span>
            <FingerLegend finger="right-index" />
            <FingerLegend finger="right-middle" />
            <FingerLegend finger="right-ring" />
            <FingerLegend finger="right-pinky" />
          </div>
        )}
      </div>
    </div>
  );
};

function getShortLabel(finger: FingerKey): string {
  const map: Record<FingerKey, string> = {
    'left-pinky': '小',
    'left-ring': '无',
    'left-middle': '中',
    'left-index': '食',
    'right-index': '食',
    'right-middle': '中',
    'right-ring': '无',
    'right-pinky': '小',
    thumb: '',
  };
  return map[finger];
}

const FingerLegend: React.FC<{ finger: FingerKey }> = ({ finger }) => {
  const colors = FINGER_COLORS[finger];
  const labels: Record<FingerKey, string> = {
    'left-pinky': '左小指',
    'left-ring': '左无名',
    'left-middle': '左中指',
    'left-index': '左食指',
    'right-index': '右食指',
    'right-middle': '右中指',
    'right-ring': '右无名',
    'right-pinky': '右小指',
    thumb: '拇指',
  };
  return (
    <div className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: colors.neon,
          boxShadow: `0 0 4px ${colors.glow}`,
        }}
      />
      <span style={{ color: colors.neon, opacity: 0.7 }}>{labels[finger]}</span>
    </div>
  );
};

export default VirtualKeyboard;
