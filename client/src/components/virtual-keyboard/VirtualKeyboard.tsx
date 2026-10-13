// 虚拟键盘主组件
import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, SkipForward, Lightbulb, Send, Hand } from 'lucide-react';
import {
  FINGER_COLORS,
  FINGER_COLORS_NEON,
  type KeyDefinition,
  filterLayoutByTarget,
} from './keyboard-layouts';
import { useVirtualKeyboard, type KeyboardLayoutType } from './use-virtual-keyboard';
import { useTypingFeedback } from './use-typing-feedback';
import FingerAnimation from './FingerAnimation';

export interface SpaceActionButton {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'accent' | 'success' | 'danger';
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}

export interface KeyboardToolbarConfig {
  fingerGuide?: { active: boolean; onToggle: () => void; label?: string };
  reset?: { onClick: () => void; label?: string };
  skip?: { onClick: () => void; label?: string };
  hint?: { onClick: () => void; label?: string; disabled?: boolean };
  submit?: { onClick: () => void; label?: string };
}

export interface VirtualKeyboardProps {
  layout: KeyboardLayoutType;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onSpacePress?: () => boolean | void;
  onBackspace?: () => void;
  showFingerGuide?: boolean;
  fingerSpeed?: 'slow' | 'normal' | 'fast';
  showFingerLabels?: boolean;
  highlightKey?: string | null;
  wrongKey?: string | null;
  targetWord?: string;
  showTypedHighlight?: boolean;
  showNextGuide?: boolean;
  disabled?: boolean;
  className?: string;
  colorScheme?: 'default' | 'pinyin' | 'number';
  fullWidth?: boolean;
  theme?: 'light' | 'neon';
  filterByTarget?: boolean;
  filterThreshold?: number;
  spaceSubmit?: boolean;
  targetText?: string;
  spaceLeftActions?: SpaceActionButton[];
  spaceRightActions?: SpaceActionButton[];
  spaceLabel?: string;
  toolbar?: KeyboardToolbarConfig;
  soundEnabled?: boolean;
  /** 禁用内部点击音效，由外部精确控制 */
  suppressInternalSound?: boolean;
}

// 按键尺寸配置
const KEY_WIDTH = 36;
const KEY_HEIGHT = 32;
const KEY_GAP = 3;
const ACTION_BTN_WIDTH = 1.5;

interface KeyButtonProps {
  keyDef: KeyDefinition;
  style: React.CSSProperties;
  label: string;
  showFingerLabel: boolean;
  isCorrect: boolean;
  isTarget: boolean;
  isNextGuide: boolean;
  isWrong: boolean;
  fullWidth: boolean;
  disabled: boolean;
  theme: 'light' | 'neon';
  onClick: () => void;
}

const KeyButton: React.FC<KeyButtonProps> = ({
  keyDef,
  style,
  label,
  showFingerLabel,
  isCorrect,
  isTarget,
  isNextGuide,
  isWrong,
  fullWidth,
  disabled,
  theme,
  onClick,
}) => (
  <motion.button
    type="button"
    whileTap={disabled ? {} : { scale: 0.88, y: 2 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    onClick={onClick}
    disabled={disabled}
    style={style}
      className={`relative font-medium flex items-center justify-center select-none focus:outline-none active:brightness-90 ${
      fullWidth ? 'rounded-md' : 'rounded-md'
    }`}
  >
    <span className={fullWidth ? 'text-xs' : 'text-sm'}>{label}</span>

    {showFingerLabel && keyDef.finger && !keyDef.isSpecial && (
      <span
        className={`absolute bottom-0.5 right-1 opacity-60 font-normal ${
          fullWidth ? 'text-[10px]' : 'text-[9px]'
        }`}
        style={{
          color: theme === 'neon'
            ? FINGER_COLORS_NEON[keyDef.finger].neon
            : FINGER_COLORS[keyDef.finger].main,
        }}
      >
        {FINGER_COLORS[keyDef.finger].label}
      </span>
    )}

    <AnimatePresence>
      {isCorrect && (
        <motion.span
          key={`correct-${keyDef.value}`}
          className={`absolute inset-0 pointer-events-none ${
            fullWidth ? 'rounded-xl' : 'rounded-lg'
          }`}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.08, opacity: 1 }}
          exit={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>

    {isTarget && (
      <motion.span
        className={`absolute inset-0 pointer-events-none overflow-hidden ${
          fullWidth ? 'rounded-xl' : 'rounded-lg'
        }`}
        style={{
          boxShadow: theme === 'neon'
            ? '0 0 15px rgba(0, 212, 255, 0.8), 0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.25)'
            : '0 0 0 3px #FF6B35',
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}

    {isNextGuide && (
      <>
        <motion.span
          className={`absolute inset-0 pointer-events-none ${
            fullWidth ? 'rounded-xl' : 'rounded-lg'
          }`}
          style={{ boxShadow: '0 0 0 3px #10B981' }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className={`absolute -inset-1 pointer-events-none ${
            fullWidth ? 'rounded-2xl' : 'rounded-xl'
          }`}
          style={{ boxShadow: '0 0 20px 6px rgba(16,185,129,0.45)' }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </>
    )}

    {isWrong && (
      <motion.span
        key={`wrong-${keyDef.value}`}
        className={`absolute inset-0 bg-red-500/50 pointer-events-none ${
          fullWidth ? 'rounded-xl' : 'rounded-lg'
        }`}
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 1, 0],
          x: [0, -4, 4, -3, 3, -2, 2, 0],
        }}
        transition={{ duration: 0.5, times: [0, 0.15, 0.5, 1] }}
      />
    )}
  </motion.button>
);

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  layout: layoutType,
  value,
  onChange,
  onSubmit,
  onSpacePress,
  onBackspace,
  showFingerGuide = false,
  fingerSpeed = 'normal',
  showFingerLabels = false,
  highlightKey = null,
  wrongKey: wrongKeyProp = null,
  targetWord = '',
  showTypedHighlight = true,
  showNextGuide = true,
  disabled = false,
  className = '',
  colorScheme = 'default',
  fullWidth = false,
  theme = 'light',
  filterByTarget = false,
  filterThreshold = 0.6,
  spaceSubmit = false,
  targetText = '',
  spaceLeftActions = [],
  spaceRightActions = [],
  spaceLabel,
  toolbar,
  soundEnabled = false,
  suppressInternalSound = false,
}) => {
  const {
    layout,
    activeKeys,
    shiftActive,
    capsActive,
    wrongKey: wrongKeyInternal,
    pressKey,
    releaseKey,
  } = useVirtualKeyboard({
    layout: layoutType,
    value,
    onChange,
    onSubmit,
    onSpacePress,
    disabled,
    spaceSubmit,
    targetText: targetText || targetWord,
    suppressInternalSound,
  });

  const visibleLayout = useMemo(() => {
    if (!filterByTarget || !targetWord) return layout;
    return filterLayoutByTarget(layout, targetWord, layoutType, filterThreshold);
  }, [layout, targetWord, layoutType, filterByTarget, filterThreshold]);

  const wrongKey = wrongKeyProp || wrongKeyInternal;

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    nextKeyVal,
    targetKeyDef,
    correctKey,
  } = useTypingFeedback({
    layout,
    value,
    targetWord,
    showTypedHighlight,
    showNextGuide,
    highlightKey,
  });

  // 音效由 useVirtualKeyboard 内部的 useKeyboardSound 统一管理（全局设置）
  // soundEnabled prop 预留用于外部额外控制

  const activeKeyVal = useMemo(() => {
    for (const v of activeKeys) {
      if (v !== 'Shift' && v !== 'CapsLock' && v !== 'Tab' && v !== 'Control' && v !== 'Alt') {
        return v;
      }
    }
    return null;
  }, [activeKeys]);

  const totalWidth = useMemo(() => {
    let maxColEnd = 0;
    for (const row of visibleLayout) {
      let colEnd = 0;
      for (const k of row) {
        colEnd = k.col + (k.width ?? 1);
      }
      maxColEnd = Math.max(maxColEnd, colEnd);
    }
    return maxColEnd * KEY_WIDTH + (maxColEnd - 1) * KEY_GAP;
  }, [visibleLayout]);

  const FULL_WIDTH_KEY_HEIGHT = theme === 'neon' ? 36 : 40;

  const handleKeyDown = (keyDef: KeyDefinition) => {
    if (disabled) return;
    pressKey(keyDef);

    if (
      keyDef.specialType !== 'shift' &&
      keyDef.specialType !== 'caps'
    ) {
      setTimeout(() => {
        releaseKey(keyDef);
      }, 120);
    }

    if (keyDef.specialType === 'backspace') {
      onBackspace?.();
    }
  };

  const effectiveShowFingerLabels = false;

  const getKeyStyle = (keyDef: KeyDefinition): React.CSSProperties => {
    const keyFlex = keyDef.width ?? 1;
    const finger = keyDef.finger;
    const isActive = activeKeys.has(keyDef.value);
    const isTarget = targetKeyDef?.value === keyDef.value;
    const isWrong = wrongKey === keyDef.value;
    const isCorrect = correctKey === keyDef.value;
    const isShiftHighlight =
      shiftActive && keyDef.specialType === 'shift';
    const isCapsHighlight =
      capsActive && keyDef.specialType === 'caps';
    const isNextGuide = showNextGuide && nextKeyVal === keyDef.value && !highlightKey;

    const style: React.CSSProperties = {
      height: fullWidth ? FULL_WIDTH_KEY_HEIGHT : KEY_HEIGHT,
      transition: 'all 0.12s ease-out',
    };

    if (fullWidth) {
      style.flex = keyFlex;
      style.minWidth = 0;
    } else {
      style.width = KEY_WIDTH * keyFlex + KEY_GAP * (keyFlex - 1);
    }

    if (theme === 'neon') {
      style.backgroundColor = '#2a2a4a';
      style.color = '#ffffff';
      style.borderRadius = '8px';
      style.border = '1px solid';

      const fingerZoneColors: Record<string, string> = {
        'l-pinky': 'rgba(239,68,68,0.4)',
        'l-ring': 'rgba(249,115,22,0.4)',
        'l-middle': 'rgba(234,179,8,0.4)',
        'l-index': 'rgba(34,197,94,0.4)',
        'r-index': 'rgba(6,182,212,0.4)',
        'r-middle': 'rgba(59,130,246,0.4)',
        'r-ring': 'rgba(168,85,247,0.4)',
        'r-pinky': 'rgba(236,72,153,0.4)',
        'thumb': 'rgba(0,212,255,0.4)',
      };

      if (keyDef.specialType === 'space') {
        style.border = '1.5px solid';
        style.borderImage = 'linear-gradient(135deg, #00d4ff, #a855f7, #00d4ff) 1';
        style.color = '#e0f2ff';
      } else if (keyDef.specialType === 'enter') {
        style.borderColor = 'rgba(34,197,94,0.5)';
        style.color = '#bbf7d0';
      } else if (keyDef.specialType === 'backspace') {
        style.borderColor = 'rgba(239,68,68,0.5)';
        style.color = '#fecaca';
      } else if (keyDef.isSpecial) {
        style.borderColor = 'rgba(59,130,246,0.4)';
        style.color = '#bfdbfe';
        style.fontSize = '11px';
      } else if (finger && fingerZoneColors[finger]) {
        style.borderColor = fingerZoneColors[finger];
      } else {
        style.borderColor = 'rgba(255,255,255,0.08)';
      }
    } else if (finger && FINGER_COLORS[finger]) {
      style.backgroundColor = FINGER_COLORS[finger].light;
      style.color = '#1F2937';
    } else {
      style.backgroundColor = '#F3F4F6';
      style.color = '#374151';
    }

    if (colorScheme === 'pinyin' && theme !== 'neon') {
      if (keyDef.row === 0) {
        style.backgroundColor = '#FFF7ED';
      } else if (keyDef.row === 1) {
        style.backgroundColor = '#EFF6FF';
      } else if (keyDef.specialType === 'tone') {
        style.backgroundColor = '#FAF5FF';
      }
    }

    if (isCorrect) {
      style.backgroundColor = '#052e1b';
      style.color = '#22c55e';
      style.borderColor = '#22c55e';
      style.transform = 'scale(1.08)';
      style.boxShadow = '0 0 16px rgba(34,197,94,0.8), inset 0 0 8px rgba(34,197,94,0.3)';
      return style;
    }

    if (isActive || isShiftHighlight || isCapsHighlight) {
      if (theme === 'neon') {
        style.backgroundColor = '#3a3a5a';
        style.color = '#ffffff';
        style.borderColor = 'rgba(0, 212, 255, 0.6)';
        style.boxShadow = '0 0 10px rgba(0,212,255,0.4), inset 0 0 6px rgba(0,212,255,0.15)';
      } else {
        if (finger && FINGER_COLORS[finger]) {
          style.backgroundColor = FINGER_COLORS[finger].main;
        } else {
          style.backgroundColor = '#FF6B35';
        }
        style.color = '#fff';
      }
      style.transform = 'scale(0.95)';
    }

    if (isTarget && !isNextGuide) {
      if (theme === 'neon') {
        style.background = 'linear-gradient(135deg, #00d4ff 0%, #2563EB 50%, #a855f7 100%)';
        style.color = '#ffffff';
        style.borderColor = 'transparent';
        style.boxShadow = '0 0 16px rgba(0,212,255,0.7), 0 0 30px rgba(59,130,246,0.5), 0 0 45px rgba(168,85,247,0.4), inset 0 0 10px rgba(255,255,255,0.2)';
        style.fontWeight = 700;
      } else {
        style.boxShadow = `${style.boxShadow ? String(style.boxShadow) + ', ' : ''}0 0 0 3px #a855f7, 0 0 16px rgba(168,85,247,0.6)`;
      }
    }

    if (isNextGuide) {
      const neonColor = '#06B6D4';
      if (theme === 'neon') {
        style.borderColor = neonColor;
        style.boxShadow = `${style.boxShadow ? String(style.boxShadow) + ', ' : ''}0 0 0 2px ${neonColor}, 0 0 18px rgba(34,211,238,0.85), inset 0 0 10px rgba(34,211,238,0.4)`;
      } else {
        style.boxShadow = `${style.boxShadow ? String(style.boxShadow) + ', ' : ''}0 0 0 2.5px #10B981, 0 0 14px rgba(16,185,129,0.5)`;
      }
    }

    if (isWrong) {
      if (theme === 'neon') {
        style.backgroundColor = '#450a0a';
        style.color = '#f87171';
        style.borderColor = '#f87171';
        style.boxShadow = '0 0 16px rgba(248,113,113,0.8)';
      } else {
        style.backgroundColor = '#FECACA';
        style.color = '#DC2626';
        style.boxShadow = '0 0 0 2px #EF4444';
      }
    }

    if (disabled && !isActive) {
      style.opacity = 0.5;
      style.cursor = 'not-allowed';
    }

    return style;
  };

  const getLabel = (keyDef: KeyDefinition): string => {
    const shouldUpper =
      layoutType === 'qwerty' &&
      (shiftActive !== capsActive) &&
      /^[a-z]$/i.test(keyDef.value);

    if (shouldUpper) return keyDef.value.toUpperCase();
    if (shiftActive && keyDef.shiftValue) return keyDef.shiftValue;
    return keyDef.label;
  };

  const renderToolbarBtn = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    active = false,
    disabled = false,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        theme === 'neon'
          ? active
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
            : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-slate-700/60'
          : active
            ? 'bg-orange-50 text-orange-600 border border-orange-200'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const getActionBtnStyle = (variant: string = 'default'): React.CSSProperties => {
    const base: React.CSSProperties = {
      height: fullWidth ? FULL_WIDTH_KEY_HEIGHT : KEY_HEIGHT,
      transition: 'all 0.12s ease-out',
      fontWeight: 600,
    };
    if (fullWidth) {
      base.flex = ACTION_BTN_WIDTH;
      base.minWidth = 0;
    } else {
      base.width = KEY_WIDTH * ACTION_BTN_WIDTH + KEY_GAP * (ACTION_BTN_WIDTH - 1);
    }
    if (theme === 'neon') {
      base.backgroundColor = '#2a2a3e';
      base.color = '#ffffff';
      base.border = '1px solid';
      base.borderImage = 'linear-gradient(135deg, #00d4ff, #a855f7) 1';
      base.borderRadius = '8px';
      base.fontSize = '12px';
      if (variant === 'accent') {
        base.color = '#00d4ff';
      } else if (variant === 'success') {
        base.color = '#22c55e';
      } else if (variant === 'danger') {
        base.color = '#ef4444';
      }
    } else {
      base.backgroundColor = '#E5E7EB';
      base.color = '#374151';
    }
    return base;
  };

  const renderRow = (row: KeyDefinition[], rowIdx: number) => {
    const hasSpace = row.some((k) => k.specialType === 'space');
    const hasSideActions = hasSpace && (spaceLeftActions.length > 0 || spaceRightActions.length > 0);

    if (!hasSideActions) {
      return (
          <div
            key={`row-${rowIdx}`}
            className={`flex ${fullWidth ? '' : 'justify-center'}`}
            style={{ gap: `${KEY_GAP}px`, marginBottom: rowIdx < visibleLayout.length - 1 ? `${KEY_GAP}px` : 0 }}
          >
          {row.map((keyDef) => (
            <KeyButton
              key={`${keyDef.row}-${keyDef.col}-${keyDef.value}`}
              keyDef={keyDef}
              style={getKeyStyle(keyDef)}
              label={getLabel(keyDef)}
              showFingerLabel={effectiveShowFingerLabels}
              isCorrect={correctKey === keyDef.value}
              isTarget={targetKeyDef?.value === keyDef.value && !!highlightKey}
              isNextGuide={nextKeyVal === keyDef.value && !highlightKey && showNextGuide && !!targetWord}
              isWrong={wrongKey === keyDef.value}
              fullWidth={fullWidth}
              disabled={disabled}
              theme={theme}
              onClick={() => handleKeyDown(keyDef)}
            />
          ))}
        </div>
      );
    }

    const spaceIdx = row.findIndex((k) => k.specialType === 'space');
    const beforeSpace = row.slice(0, spaceIdx);
    const spaceKey = row[spaceIdx];
    const afterSpace = row.slice(spaceIdx + 1);
    const leftCount = spaceLeftActions.length;
    const rightCount = spaceRightActions.length;
    const reducedSpaceWidth = Math.max(2, (spaceKey.width ?? 7) - (leftCount + rightCount) * ACTION_BTN_WIDTH);

    const spaceStyle = {
      ...getKeyStyle(spaceKey),
      ...(fullWidth
        ? { flex: reducedSpaceWidth }
        : { width: KEY_WIDTH * reducedSpaceWidth + KEY_GAP * (reducedSpaceWidth - 1) }),
    };

    return (
          <div
            key={`row-${rowIdx}`}
            className={`flex ${fullWidth ? '' : 'justify-center'}`}
            style={{ gap: `${KEY_GAP}px`, marginBottom: rowIdx < visibleLayout.length - 1 ? `${KEY_GAP}px` : 0 }}
          >
        {beforeSpace.map((keyDef) => (
          <KeyButton
            key={`${keyDef.row}-${keyDef.col}-${keyDef.value}`}
            keyDef={keyDef}
            style={getKeyStyle(keyDef)}
            label={getLabel(keyDef)}
            showFingerLabel={effectiveShowFingerLabels}
            isCorrect={correctKey === keyDef.value}
            isTarget={targetKeyDef?.value === keyDef.value && !!highlightKey}
            isNextGuide={nextKeyVal === keyDef.value && !highlightKey && showNextGuide && !!targetWord}
            isWrong={wrongKey === keyDef.value}
            fullWidth={fullWidth}
            disabled={disabled}
            theme={theme}
            onClick={() => handleKeyDown(keyDef)}
          />
        ))}
        {spaceLeftActions.map((action) => (
          <motion.button
            key={`space-left-${action.id}`}
            type="button"
            whileTap={disabled || action.disabled ? {} : { scale: 0.92 }}
            onClick={action.onClick}
            disabled={disabled || action.disabled}
            style={getActionBtnStyle(action.variant)}
            className={`relative font-medium flex items-center justify-center select-none focus:outline-none gap-1.5 ${
              fullWidth ? 'rounded-xl' : 'rounded-lg'
            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
              action.active
                ? 'ring-2 ring-offset-1 ring-cyan-400'
                : ''
            }`}
          >
            {action.icon}
            <span className="text-xs">{action.label}</span>
          </motion.button>
        ))}
        <motion.button
          key={`${spaceKey.row}-${spaceKey.col}-${spaceKey.value}`}
          type="button"
          whileTap={disabled ? {} : { scale: 0.92 }}
          onClick={() => handleKeyDown(spaceKey)}
          disabled={disabled}
          style={spaceStyle}
          className={`relative font-medium flex items-center justify-center select-none focus:outline-none ${
            fullWidth ? 'rounded-xl' : 'rounded-lg'
          }`}
        >
          <span className="text-sm">
            {spaceLabel !== undefined ? spaceLabel : getLabel(spaceKey)}
          </span>
        </motion.button>
        {spaceRightActions.map((action) => (
          <motion.button
            key={`space-right-${action.id}`}
            type="button"
            whileTap={disabled || action.disabled ? {} : { scale: 0.92 }}
            onClick={action.onClick}
            disabled={disabled || action.disabled}
            style={getActionBtnStyle(action.variant)}
            className={`relative font-medium flex items-center justify-center select-none focus:outline-none gap-1.5 ${
              fullWidth ? 'rounded-xl' : 'rounded-lg'
            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
              action.active
                ? 'ring-2 ring-offset-1 ring-cyan-400'
                : ''
            }`}
          >
            {action.icon}
            <span className="text-xs">{action.label}</span>
          </motion.button>
        ))}
        {afterSpace.map((keyDef) => (
          <KeyButton
            key={`${keyDef.row}-${keyDef.col}-${keyDef.value}`}
            keyDef={keyDef}
            style={getKeyStyle(keyDef)}
            label={getLabel(keyDef)}
            showFingerLabel={effectiveShowFingerLabels}
            isCorrect={correctKey === keyDef.value}
            isTarget={targetKeyDef?.value === keyDef.value && !!highlightKey}
            isNextGuide={nextKeyVal === keyDef.value && !highlightKey && showNextGuide && !!targetWord}
            isWrong={wrongKey === keyDef.value}
            fullWidth={fullWidth}
            disabled={disabled}
            theme={theme}
            onClick={() => handleKeyDown(keyDef)}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${
        theme === 'neon'
          ? 'rounded-2xl py-2 px-2'
          : fullWidth
          ? 'w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-3xl p-3 shadow-lg'
          : 'inline-block bg-gray-50 rounded-2xl p-4 shadow-inner'
      } ${className}`}
      style={theme === 'neon'
        ? {
            background: 'linear-gradient(180deg, #1a1a3a 0%, #0d0d2a 100%)',
            boxShadow: '0 0 24px rgba(0,212,255,0.15), 0 0 60px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid',
            borderImage: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(168,85,247,0.3) 50%, rgba(0,212,255,0.3) 100%) 1',
          }
        : fullWidth ? undefined : { minWidth: totalWidth + 32 }}
    >
      {toolbar && (
        <div className="flex items-center justify-center flex-wrap gap-2 mb-3 pt-2">
          {toolbar.fingerGuide && renderToolbarBtn(
            <Hand size={14} />,
            toolbar.fingerGuide.label || '指法引导',
            toolbar.fingerGuide.onToggle,
            toolbar.fingerGuide.active,
          )}
          {toolbar.reset && renderToolbarBtn(
            <RotateCcw size={14} />,
            toolbar.reset.label || '重置',
            toolbar.reset.onClick,
          )}
          {toolbar.skip && renderToolbarBtn(
            <SkipForward size={14} />,
            toolbar.skip.label || '跳过',
            toolbar.skip.onClick,
          )}
          {toolbar.hint && renderToolbarBtn(
            <Lightbulb size={14} />,
            toolbar.hint.label || '提示',
            toolbar.hint.onClick,
            false,
            toolbar.hint.disabled,
          )}
          {toolbar.submit && renderToolbarBtn(
            <Send size={14} />,
            toolbar.submit.label || '提交',
            toolbar.submit.onClick,
          )}
        </div>
      )}

      {showFingerGuide && (
        <div
          className="absolute left-4 right-4"
          style={{ top: -60, height: 90 }}
        >
          <FingerAnimation
            layout={layout}
            targetKey={targetKeyDef}
            activeKey={activeKeyVal}
            wrongKey={wrongKey}
            speed={fingerSpeed}
            visible={showFingerGuide}
            keyWidth={KEY_WIDTH}
            keyHeight={KEY_HEIGHT}
            keyGap={KEY_GAP}
          />
        </div>
      )}

      <div
        className={fullWidth ? '' : ''}
        style={{ marginTop: showFingerGuide ? 0 : 0 }}
      >
        {visibleLayout.map((row, rowIdx) => renderRow(row, rowIdx))}
      </div>

      {(shiftActive || capsActive) && layoutType === 'qwerty' && (
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-500">
          {capsActive && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded">Caps Lock</span>}
          {shiftActive && <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded">Shift</span>}
        </div>
      )}
    </div>
  );
};

export default VirtualKeyboard;
