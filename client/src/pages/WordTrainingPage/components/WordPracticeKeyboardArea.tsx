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
  Mic,
} from 'lucide-react';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import type { SpaceActionButton } from '@client/src/components/virtual-keyboard';
import type { PracticeMode } from '@client/src/components/practice-toolbar';

interface WordPracticeKeyboardAreaProps {
  mode: PracticeMode;
  keyboardVisible: boolean;
  userInput: string;
  onInputChange?: (value: string) => void;
  onSubmit?: () => void;
  onBackspace?: () => void;
  targetWord?: string;
  feedback?: 'none' | 'correct' | 'wrong';
  onPrev?: () => void;
  onNext?: () => void;
  onSpeak?: () => void;
  onMastered?: () => void;
  onUnfamiliar?: () => void;
  onSwitchMode?: () => void;
  onShowAnswer?: () => void;
  answerVisible?: boolean;
  onRecord?: () => void;
  isRecording?: boolean;
  canPrev?: boolean;
  canNext?: boolean;
  spaceLabel?: string;

  spaceInputMode?: 'auto' | 'manual';
}

// 霓虹深色快捷按钮样式
const ShortcutButton: React.FC<{
  action: SpaceActionButton;
  shortcut?: string;
}> = ({ action, shortcut }) => {
  const getVariantClasses = (): string => {
    if (action.disabled) return 'text-slate-500 bg-white/5 border-white/10 cursor-not-allowed';
    switch (action.variant) {
      case 'accent':
        return 'text-[#6366F1] bg-[rgba(124_58_237_0.1)] border-[rgba(124_58_237_0.4)] hover:bg-[rgba(124_58_237_0.2)] hover:shadow-md hover:shadow-[#6366F1]/20';
      case 'success':
        return 'text-[#06B6D4] bg-[rgba(34_211_238_0.1)] border-[rgba(34_211_238_0.4)] hover:bg-[rgba(34_211_238_0.2)]';
      case 'danger':
        return 'text-[#EF476F] bg-[rgba(239_71_111_0.1)] border-[rgba(239_71_111_0.4)] hover:bg-[rgba(239_71_111_0.2)]';
      default:
        return 'text-slate-300 bg-white/5 border-fuchsia-500/15 hover:bg-white/10 hover:text-white';
    }
  };

  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      whileHover={action.disabled ? {} : { y: -1 }}
      whileTap={action.disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all min-w-[48px] flex-shrink-0 ${getVariantClasses()} ${
        action.active ? 'ring-2 ring-fuchsia-400/50 ring-offset-1 ring-offset-[#0F0D24]' : ''
      }`}
    >
      <div className="flex items-center gap-1">
        {action.icon}
        <span>{action.label}</span>
      </div>
      {shortcut && (
        <span className="text-[9px] text-slate-400 font-normal leading-none">
          {shortcut}
        </span>
      )}
    </motion.button>
  );
};

const SHORTCUT_MAP: Record<string, string> = {
  prev: '←',
  speak: 'R',
  'hide-answer': '↑↓',
  reveal: 'Eye',
  submit: 'Enter',
  record: 'Space',
  mastered: 'Ctrl+M',
  unfamiliar: 'Ctrl+Q',
  switch: 'Tab',
  next: '→',
};

const BottomShortcutBar: React.FC<{
  leftActions: SpaceActionButton[];
  rightActions: SpaceActionButton[];
  spaceLabel?: string;
}> = ({
  leftActions,
  rightActions,
  spaceLabel = '录制 / Space',
}) => (
  <div className="w-full flex flex-col items-center gap-2 py-2 px-3 glass-card rounded-xl">
    <div className="w-full flex items-center justify-center gap-2">
      <div className="flex items-center gap-1.5">
        {leftActions.map((action: SpaceActionButton) => (
          <ShortcutButton
            key={action.id}
            action={action}
            shortcut={SHORTCUT_MAP[action.id]}
          />
        ))}
      </div>
      <div className="flex-1 max-w-[120px] mx-2 rounded-lg bg-white/5 border border-fuchsia-500/15 flex flex-col items-center justify-center py-1.5 gap-0.5">
        <span className="text-[11px] font-medium text-slate-300">Space</span>
        <span className="text-[10px] text-slate-400">{spaceLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {rightActions.map((action: SpaceActionButton) => (
          <ShortcutButton
            key={action.id}
            action={action}
            shortcut={SHORTCUT_MAP[action.id]}
          />
        ))}
      </div>
    </div>
  </div>
);

const WordPracticeKeyboardArea: React.FC<WordPracticeKeyboardAreaProps> = ({
  mode,
  keyboardVisible,
  userInput = '',
  onInputChange,
  onSubmit,
  onBackspace,
  targetWord = '',
  feedback = 'none',
  onPrev,
  onNext,
  onSpeak,
  onMastered,
  onUnfamiliar,
  onSwitchMode,
  onShowAnswer,
  answerVisible = false,
  onRecord,
  isRecording = false,
  canPrev = true,
  canNext = true,
  spaceLabel: spaceLabelProp,

  spaceInputMode = 'auto',
}) => {
  if (!keyboardVisible) return null;

  const isTyping = mode === 'typing';
  const isDictation = mode === 'dictation';
  const showKeyboardBody = isTyping || isDictation;

  const cleanTargetWord = (() => {
    if (!isTyping || !targetWord) return '';
    return targetWord.replace(/[^a-zA-Z]/g, '');
  })();

  const spaceLabel = spaceLabelProp ?? (isTyping ? '提交 / Enter' : '跳格 / Space');
  const spaceSubmit = isTyping ? true : false;
  const disabled = feedback !== 'none';

  const leftActions: SpaceActionButton[] = [
    {
      id: 'prev',
      label: '上一题',
      icon: <ChevronLeft size={14} />,
      onClick: onPrev || (() => {}),
      disabled: !canPrev,
      variant: 'default',
    },
    {
      id: 'speak',
      label: '朗读',
      icon: <Volume2 size={14} />,
      onClick: onSpeak || (() => {}),
      variant: 'accent',
    },
    ...(isTyping
      ? [
          {
            id: 'hide-answer',
            label: answerVisible ? '显示' : '隐藏',
            icon: answerVisible ? <Eye size={14} /> : <EyeOff size={14} />,
            onClick: onShowAnswer || (() => {}),
            variant: 'default' as const,
          },
        ]
      : []),
    ...(isDictation
      ? [
          {
            id: 'reveal',
            label: answerVisible ? '隐藏' : '答案',
            icon: answerVisible ? <Eye size={14} /> : <EyeOff size={14} />,
            onClick: onShowAnswer || (() => {}),
            variant: 'default' as const,
          },
        ]
      : []),
    ...(mode === 'watch-speak' || mode === 'shadowing'
      ? [
          {
            id: 'reveal',
            label: answerVisible ? '隐藏答案' : '答案',
            icon: answerVisible ? <Eye size={14} /> : <EyeOff size={14} />,
            onClick: onShowAnswer || (() => {}),
            variant: 'default' as const,
          },
          {
            id: 'record',
            label: isRecording ? '录音中' : '录制',
            icon: <Mic size={14} />,
            onClick: onRecord || (() => {}),
            variant: (isRecording ? 'danger' : 'accent') as 'danger' | 'accent',
            active: isRecording,
          },
        ]
      : []),
  ];

  const rightActions: SpaceActionButton[] = [
    {
      id: 'mastered',
      label: '掌握',
      icon: <Check size={14} />,
      onClick: onMastered || (() => {}),
      variant: 'success',
    },
    {
      id: 'unfamiliar',
      label: '不熟',
      icon: <XCircle size={14} />,
      onClick: onUnfamiliar || (() => {}),
      variant: 'danger',
    },
    {
      id: 'switch',
      label: '切模式',
      icon: <ArrowRightLeft size={14} />,
      onClick: onSwitchMode || (() => {}),
      variant: 'default',
    },
    {
      id: 'next',
      label: '下一题',
      icon: <ChevronRight size={14} />,
      onClick: onNext || (() => {}),
      variant: 'accent',
      disabled: !canNext,
    },
  ];

  return (
    <div className="relative w-full flex flex-col items-center justify-end pt-0 pb-1 px-3 overflow-visible flex-shrink-0 tech-bg">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl mx-auto"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {showKeyboardBody && (
          <div className="relative overflow-visible">
            <div className="relative z-0">
              <VirtualKeyboard
                layout="qwerty"
                value={userInput}
                onChange={onInputChange || (() => {})}
                onSubmit={onSubmit}
                onBackspace={onBackspace}
                showFingerGuide={false}
                showNextGuide={isTyping}
                targetWord={cleanTargetWord}
                showTypedHighlight={isTyping}
                theme="neon"
                fullWidth
                spaceLabel={spaceLabel}
                spaceSubmit={spaceSubmit}
                disabled={disabled}
                colorScheme="default"
                spaceLeftActions={leftActions}
                spaceRightActions={rightActions}
                soundEnabled={false}
                suppressInternalSound
              />
            </div>
          </div>
        )}

        {!showKeyboardBody && (
          <BottomShortcutBar
            leftActions={leftActions}
            rightActions={rightActions}

            spaceLabel={
              mode === 'shadowing'
                ? '跟读 / Space'
                : mode === 'watch-speak'
                  ? '识别 / Space'
                  : '录制 / Space'
            }
          />
        )}
      </motion.div>
    </div>
  );
};

export default WordPracticeKeyboardArea;
