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
  Send,
  Mic,
  SkipForward,
} from 'lucide-react';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import type { SpaceActionButton } from '@client/src/components/virtual-keyboard';
import type { PracticeMode } from '@client/src/components/practice-toolbar';

export type KeyboardContentType = 'sentence' | 'word' | 'typing' | 'chinese_char' | 'math';

interface PracticeKeyboardAreaProps {
  mode: PracticeMode;
  keyboardVisible: boolean;
  fingerGuideEnabled: boolean;
  contentType?: KeyboardContentType;
  userInput?: string;
  onInputChange?: (value: string) => void;
  onSubmit?: () => void;
  onSpacePress?: () => boolean | void;
  onBackspace?: () => void;
  targetWord?: string;
  completedWords?: number;
  totalWords?: number;
  currentTargetKey?: string | null;
  nextKeyAfterSpace?: string | null;
  progress?: number;
  totalTargetChars?: number;
  feedback?: 'none' | 'correct' | 'wrong';
  errorResetKey?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onSpeak?: () => void;
  onMastered?: () => void;
  onUnfamiliar?: () => void;
  onSwitchMode?: () => void;
  onHideAnswer?: () => void;
  answerHidden?: boolean;
  onRevealAnswer?: () => void;
  onRecord?: () => void;
  isRecording?: boolean;
  onDictationSubmit?: () => void;
  onSkipWord?: () => void;
  onShowAnswer?: () => void;
  answerVisible?: boolean;
  canPrev?: boolean;
  canNext?: boolean;
  spaceLabel?: string;
  soundEnabled?: boolean;
  suppressInternalSound?: boolean;
  spaceInputMode?: 'auto' | 'manual';
}

 const BUTTON_STYLE: React.CSSProperties = {
   padding: '6px 12px',
backgroundColor: '#F8FAFC',
    color: '#64748B',
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

// 按钮 id 到快捷键文字的映射
const SHORTCUT_MAP: Record<string, string> = {
  prev: '←',
  speak: 'Ctrl+A',
  'hide-answer': '↑↓',
  reveal: '↓↑',
  submit: '空格',
  record: 'Space',
  mastered: 'Ctrl+M',
  unfamiliar: 'Ctrl+Q',
  'skip-word': 'Tab',
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
         <span className="text-[9px] text-slate-400 font-normal leading-none tracking-tight">
          {shortcut}
        </span>
      )}
    </motion.button>
  );
};

const BottomShortcutBar: React.FC<{
  leftActions: SpaceActionButton[];
  rightActions: SpaceActionButton[];
}> = ({
  leftActions,
  rightActions,
}) => (
   <div className="w-full flex flex-col items-center gap-2 py-2 px-3 glass-card rounded-lg">
    <div className="w-full flex items-center justify-center gap-2">
      <div className="flex items-center gap-2">
        {leftActions.map((action: SpaceActionButton) => (
          <ShortcutButton
            key={action.id}
            action={action}
            shortcut={SHORTCUT_MAP[action.id]}
          />
        ))}
      </div>
       <div className="flex-1 max-w-[120px] mx-2 rounded-lg bg-white/5 border border-fuchsia-500/15 flex flex-col items-center justify-center py-2 gap-0.5">
         <span className="text-[11px] text-slate-300 font-medium">Space</span>
         <span className="text-[9px] text-slate-400">下一词</span>
      </div>
      <div className="flex items-center gap-2">
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

const PracticeKeyboardArea: React.FC<PracticeKeyboardAreaProps> = ({
  mode,
  keyboardVisible,
  fingerGuideEnabled,
  contentType = 'sentence',
  userInput = '',
  onInputChange,
  onSubmit,
  onSpacePress,
  onBackspace,
  targetWord = '',
  completedWords = 0,
  totalWords = 0,
  feedback = 'none',
  errorResetKey = 0,
  onPrev,
  onNext,
  onSpeak,
  onMastered,
  onUnfamiliar,
  onSwitchMode,
  onHideAnswer,
  answerHidden,
  onRevealAnswer,
  onRecord,
  isRecording,
  onDictationSubmit,
  onSkipWord,
  onShowAnswer,
  answerVisible = false,
  canPrev = true,
  canNext = true,
  spaceLabel: spaceLabelProp,
  soundEnabled = false,
  suppressInternalSound = false,
  currentTargetKey = null,
  nextKeyAfterSpace = null,
  progress = 0,
  totalTargetChars = 0,
  spaceInputMode = 'auto',
}) => {
  if (!keyboardVisible) return null;

  const isTyping = mode === 'typing';
  const showKeyboardBody = isTyping;

  const highlightKeyVal = (() => {
    if (!isTyping || !fingerGuideEnabled) return null;
    if (currentTargetKey === ' ' && spaceInputMode === 'auto' && nextKeyAfterSpace) {
      return nextKeyAfterSpace;
    }
    return currentTargetKey;
  })();

  const highlightSpace = isTyping && currentTargetKey === ' ' && spaceInputMode === 'manual';

  const cleanTargetWord = (() => {
    if (!isTyping || !targetWord) return '';
    return targetWord.replace(/[^a-zA-Z]/g, '');
  })();

  const spaceLabel =
    spaceLabelProp ??
    (isTyping && progress >= totalTargetChars - 1 && totalTargetChars > 0
      ? '提交'
      : highlightSpace
        ? '空格'
        : '下一词');

  const spaceSubmit =
    isTyping && progress >= totalTargetChars - 1 && totalTargetChars > 0 ? true : false;

  const keyboardLayout: 'qwerty' | 'pinyin' | 'number' = 'qwerty';

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
    ...(mode === 'typing'
      ? [{
          id: 'hide-answer',
          label: answerHidden ? '显示' : '隐藏',
          icon: answerHidden ? <Eye size={14} /> : <EyeOff size={14} />,
          onClick: onHideAnswer || (() => {}),
          variant: 'default' as const,
        }]
      : []),
    ...(mode === 'dictation'
      ? [
          {
            id: 'reveal',
            label: '答案',
            icon: <Eye size={14} />,
            onClick: onRevealAnswer || (() => {}),
            variant: 'default' as const,
          },
          {
            id: 'submit',
            label: '提交',
            icon: <Send size={14} />,
            onClick: onDictationSubmit || (() => {}),
            variant: 'accent' as const,
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
    ...(mode === 'dictation'
      ? [{
          id: 'skip-word',
          label: '跳格',
          icon: <SkipForward size={14} />,
          onClick: onSkipWord || (() => {}),
          variant: 'default' as const,
        }]
      : []),
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
    <div className="relative w-full flex flex-col items-center justify-end pt-0 pb-0 px-3 overflow-visible flex-shrink-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl mx-auto"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {showKeyboardBody && (
          <div className="relative overflow-visible">
            {/* 虚拟键盘 (标准布局-勿改：全宽，与内容区对齐) */}
            <div className="relative z-0">
              <VirtualKeyboard
                key={errorResetKey ?? 0}
                layout={keyboardLayout}
                value={userInput}
                onChange={onInputChange || (() => {})}
                onSubmit={onSubmit}
                onSpacePress={onSpacePress}
                onBackspace={onBackspace}
                showFingerGuide={false}
                showNextGuide={isTyping}
                 highlightKey={highlightKeyVal}
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
                 soundEnabled={soundEnabled}
                 suppressInternalSound={suppressInternalSound}
                />
            </div>
          </div>
        )}

        {!showKeyboardBody && (
          <BottomShortcutBar
            leftActions={leftActions}
            rightActions={rightActions}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PracticeKeyboardArea;
