import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Mic,
  Check,
  XCircle,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Send,
  SkipForward,
  Space,
} from 'lucide-react';
import type { PracticeMode } from '@client/src/components/practice-toolbar';

interface ShortcutItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'accent';
  disabled?: boolean;
}

interface BottomShortcutBarProps {
  mode: PracticeMode;
  onPrev: () => void;
  onNext: () => void;
  onSpeak: () => void;
  onMastered: () => void;
  onUnfamiliar: () => void;
  onSwitchMode: () => void;
  onRecord?: () => void;
  isRecording?: boolean;
  onSubmit?: () => void;
  onHideAnswer?: () => void;
  answerHidden?: boolean;
  onSkipWord?: () => void;
  onRevealAnswer?: () => void;
  onSpace?: () => void;
  spaceLabel?: string;
  canPrev: boolean;
  canNext: boolean;
}

const ShortcutButton: React.FC<ShortcutItem> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled,
}) => {
  const variantStyles: Record<string, string> = {
    default:
      'bg-[#2a2a4a] text-white hover:border-cyan-400 border border-[#3a3a5a]',
    primary:
      'bg-[#2a2a4a] text-violet-300 hover:border-violet-400 border border-violet-500/40',
    success:
      'bg-[#2a2a4a] text-emerald-300 hover:border-emerald-400 border border-emerald-500/40',
    danger:
      'bg-[#2a2a4a] text-rose-300 hover:border-rose-400 border border-rose-500/40',
    accent:
      'bg-[#2a2a4a] text-cyan-300 hover:border-cyan-400 border border-cyan-500/40',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 px-2.5 h-9 rounded-md border border-solid transition-all text-[11px] font-medium ${
      variantStyles[variant]
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-sm hover:shadow-cyan-500/15 active:scale-95'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const SpaceCenterButton: React.FC<{
  label?: string;
  onClick?: () => void;
}> = ({ label = '空格', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-2 w-[200px] h-10 rounded-md text-white text-[12px] font-bold transition-all active:scale-95"
    style={{
      background: 'linear-gradient(135deg, #00d4ff 0%, #6366F1 100%)',
      boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)',
    }}
  >
    <Space size={14} />
    <span>{label}</span>
  </button>
);

const BottomShortcutBar: React.FC<BottomShortcutBarProps> = ({
  mode,
  onPrev,
  onNext,
  onSpeak,
  onMastered,
  onUnfamiliar,
  onSwitchMode,
  onRecord,
  isRecording,
  onSubmit,
  onHideAnswer,
  answerHidden,
  onSkipWord,
  onRevealAnswer,
  onSpace,
  spaceLabel,
  canPrev,
  canNext,
}) => {
  const leftItems: ShortcutItem[] = [
    {
      icon: <ChevronLeft size={14} />,
      label: '上一题',
      onClick: onPrev,
      disabled: !canPrev,
    },
    {
      icon: <Volume2 size={14} />,
      label: '朗读',
      onClick: onSpeak,
      variant: 'accent',
    },
  ];

  if (mode === 'dictation') {
    leftItems.push(
      {
        icon: <Eye size={14} />,
        label: '答案',
        onClick: onRevealAnswer || (() => {}),
      },
      {
        icon: <Send size={14} />,
        label: '提交',
        onClick: onSubmit || (() => {}),
        variant: 'primary',
      },
    );
  } else if (mode === 'typing') {
    leftItems.push({
      icon: answerHidden ? <Eye size={14} /> : <EyeOff size={14} />,
      label: '答案',
      onClick: onHideAnswer || (() => {}),
    });
  } else if (mode === 'watch-speak' || mode === 'shadowing') {
    leftItems.push({
      icon: (
        <motion.div
          animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Mic size={14} className={isRecording ? 'text-red-400' : ''} />
        </motion.div>
      ),
      label: isRecording ? '录音' : '录制',
      onClick: onRecord || (() => {}),
      variant: isRecording ? 'danger' : 'primary',
    });
  }

  const rightItems: ShortcutItem[] = [
    {
      icon: <Check size={14} />,
      label: '掌握',
      onClick: onMastered,
      variant: 'success',
    },
    {
      icon: <XCircle size={14} />,
      label: '不熟',
      onClick: onUnfamiliar,
      variant: 'danger',
    },
    {
      icon: <ArrowRightLeft size={14} />,
      label: '切题',
      onClick: onSwitchMode,
    },
    {
      icon: <ChevronRight size={14} />,
      label: '下一题',
      onClick: onNext,
      variant: 'primary',
      disabled: !canNext,
    },
  ];

  return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#0f0d25] border-t border-violet-500/15 h-[48px]">
      <div className="flex items-center gap-1.5">
        {leftItems.map((item, idx) => (
          <ShortcutButton key={`left-${item.label}-${idx}`} {...item} />
        ))}
      </div>

      <div className="mx-3">
        <SpaceCenterButton label={spaceLabel} onClick={onSpace} />
      </div>

      <div className="flex items-center gap-1.5">
        {rightItems.map((item, idx) => (
          <ShortcutButton key={`right-${item.label}-${idx}`} {...item} />
        ))}
      </div>
    </div>
  );
};

export default BottomShortcutBar;
