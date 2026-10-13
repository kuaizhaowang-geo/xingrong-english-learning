import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Eye,
  EyeOff,
  Check,
  XCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import type { SpaceActionButton } from '@client/src/components/virtual-keyboard';
import type {
  ChineseMode,
  EnglishMode,
  Language,
} from '../data/typingData';
import { soundManager } from '@client/src/utils/soundManager';

interface TypingBottomBarProps {
  language: Language;
  zhMode: ChineseMode;
  enMode: EnglishMode;
  keyboardVisible: boolean;
  userInput: string;
  onInputChange?: (value: string) => void;
  onBackspace?: () => void;
  targetText: string;
  feedback?: 'none' | 'correct' | 'wrong';
  onPrev: () => void;
  onNext: () => void;
  onSpeak: () => void;
  onMastered: () => void;
  onUnfamiliar: () => void;
  onSwitchMode: () => void;
  onToggleAnswer: () => void;
  answerVisible: boolean;
  canPrev: boolean;
  canNext: boolean;
  spaceLabel: string;
  spaceAction?: () => void;

  soundEnabled?: boolean;
  suppressInternalSound?: boolean;
  fingerGuideEnabled?: boolean;
  targetKey?: string;
}

const BUTTON_STYLE: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#F8FAFC',
  color: '#94A3B8',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  transition: 'all 0.15s ease',
  flexShrink: 0,
  minWidth: '48px',
};

const SHORTCUT_MAP: Record<string, string> = {
  prev: '←',
  speak: 'Ctrl+A',
  'hide-answer': '↑↓',
  mastered: 'Ctrl+M',
  unfamiliar: 'Ctrl+Q',
  switch: 'Shift+Tab',
  next: '→',
};

const ShortcutButton: React.FC<{
  action: SpaceActionButton;
  shortcut?: string;
}> = ({ action, shortcut }) => {
  const style: React.CSSProperties = { ...BUTTON_STYLE };
  if (action.disabled) {
    style.opacity = 0.4;
    style.cursor = 'not-allowed';
  }
  if (action.variant === 'accent') {
    style.color = '#6366F1';
    style.borderColor = 'rgba(99, 102, 241, 0.35)';
    style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
  } else if (action.variant === 'success') {
    style.color = '#06B6D4';
    style.borderColor = 'rgba(34, 211, 238, 0.5)';
    style.backgroundColor = 'rgba(34, 211, 238, 0.1)';
  } else if (action.variant === 'danger') {
    style.color = '#EF476F';
    style.borderColor = 'rgba(239, 71, 111, 0.5)';
    style.backgroundColor = 'rgba(239, 71, 111, 0.1)';
  }
  if (action.active) {
    style.boxShadow = '0 2px 12px rgba(99, 102, 241, 0.25)';
    style.color = '#6366F1';
  }

  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      style={style}
      whileHover={action.disabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={action.disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="hover:bg-[#E0E7FF] hover:text-slate-700"
    >
      <div className="flex items-center gap-1">
        {action.icon}
        <span>{action.label}</span>
      </div>
      {shortcut && (
        <span className="text-[9px] text-[#64748b] font-normal leading-none tracking-tight">
          {shortcut}
        </span>
      )}
    </motion.button>
  );
};

const TypingBottomBar: React.FC<TypingBottomBarProps> = ({
  language,
  zhMode,
  keyboardVisible,
  userInput,
  onInputChange,
  onBackspace,
  targetText,
  feedback = 'none',
  onPrev,
  onNext,
  onSpeak,
  onMastered,
  onUnfamiliar,
  onSwitchMode,
  onToggleAnswer,
  answerVisible,
  canPrev,
  canNext,
  spaceLabel,
  spaceAction,

  soundEnabled = false,
  suppressInternalSound = false,
  fingerGuideEnabled = false,
  targetKey,
}) => {
  const isFreeMode = language === 'zh' && zhMode === 'ziyou';
  const disabled = feedback !== 'none';

  const leftActions: SpaceActionButton[] = [
    {
      id: 'prev',
      label: '上一题',
      icon: <ChevronLeft size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('soft');
        onPrev();
      },
      disabled: !canPrev || isFreeMode,
      variant: 'default',
    },
    {
      id: 'speak',
      label: '朗读',
      icon: <Volume2 size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('soft');
        onSpeak();
      },
      variant: 'accent',
    },
    {
      id: 'hide-answer',
      label: answerVisible ? '显示' : '隐藏',
      icon: answerVisible ? <Eye size={14} /> : <EyeOff size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('soft');
        onToggleAnswer();
      },
      variant: 'default',
    },
  ];

  const rightActions: SpaceActionButton[] = [
    {
      id: 'mastered',
      label: '掌握',
      icon: <Check size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('primary');
        onMastered();
      },
      variant: 'success',
      disabled: isFreeMode,
    },
    {
      id: 'unfamiliar',
      label: '不熟',
      icon: <XCircle size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('soft');
        onUnfamiliar();
      },
      variant: 'danger',
      disabled: isFreeMode,
    },
    {
      id: 'switch',
      label: '切模式',
      icon: <ArrowRightLeft size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('primary');
        onSwitchMode();
      },
      variant: 'default',
    },
    {
      id: 'next',
      label: '下一题',
      icon: <ChevronRight size={14} />,
      onClick: () => {
        soundManager.ensureContext();
        soundManager.playClick('primary');
        onNext();
      },
      disabled: !canNext || isFreeMode,
      variant: 'accent',
    },
  ];

  if (!keyboardVisible) return null;

  return (
    <div className="relative w-full flex flex-col items-center justify-end pt-0 pb-0 px-3 overflow-visible flex-shrink-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl mx-auto"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="relative overflow-visible">

          <div className="relative z-0">
            <VirtualKeyboard
              layout="qwerty"
              value={userInput}
              onChange={onInputChange ?? (() => {})}
              onBackspace={onBackspace}
              onSpacePress={spaceAction}
              showFingerGuide={fingerGuideEnabled}
              showNextGuide
              highlightKey={targetKey ?? null}
              targetWord={targetText}
              showTypedHighlight
              disabled={disabled}
              theme="neon"
              fullWidth
              spaceLabel={spaceLabel}
              spaceLeftActions={leftActions}
              spaceRightActions={rightActions}
              soundEnabled={soundEnabled}
              suppressInternalSound={suppressInternalSound}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TypingBottomBar;
