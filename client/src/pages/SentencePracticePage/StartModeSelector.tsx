import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Headphones, Keyboard, Mic, Check } from 'lucide-react';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import ModalShell from './PracticeModalShell';

interface ModeCard {
  id: PracticeMode;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const MODE_CARDS: ModeCard[] = [
  {
    id: 'watch-speak',
    title: '中译英模式',
    subtitle: '表达训练',
    description: '看到中文提示，尝试用英文表达。练习运用所学词汇和语法',
    badge: '新手推荐',
    icon: <MessageCircle size={22} />,
     iconBg: 'bg-[rgba(99_102_241_0.15)]',
     iconColor: 'text-[#6366F1]',
   },
   {
     id: 'dictation',
     title: '听力模式',
     subtitle: '听力+拼写',
     description: '播放英语音频，让你沉浸在语言环境中。培养语感，熟悉发音',
     badge: '泛听神器',
     icon: <Headphones size={22} />,
     iconBg: 'bg-[rgba(59_130_246_0.2)]',
     iconColor: 'text-[#3B82F6]',
   },
   {
     id: 'typing',
     title: '打字练习',
     subtitle: '输入强化',
     description: '在练题过程中提升打字速度与拼写准确率',
     badge: '输入强化',
     icon: <Keyboard size={22} />,
     iconBg: 'bg-[rgba(34_211_238_0.2)]',
     iconColor: 'text-[#22D3EE]',
   },
   {
     id: 'shadowing',
     title: '口语练习',
     subtitle: '口语矫正',
     description: '跟读句子并练习发音，让口语表达更自然流畅',
     badge: '口语矫正',
     icon: <Mic size={22} />,
     iconBg: 'bg-[rgba(239_71_111_0.2)]',
     iconColor: 'text-[#EF476F]',
   },
];

const STORAGE_KEY_ASK = 'sentence_practice_ask_mode';
const STORAGE_KEY_DEFAULT = 'sentence_practice_default_mode';
const STORAGE_KEY_LAST_PREFIX = 'sentence_practice_last_mode_';

export function getAskModeEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY_ASK);
    return v === null ? false : v === '1';
  } catch {
    return false;
  }
}

export function setAskModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASK, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function getDefaultMode(): PracticeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY_DEFAULT);
    if (v && ['watch-speak', 'dictation', 'typing', 'shadowing'].includes(v)) {
      return v as PracticeMode;
    }
  } catch {
    /* noop */
  }
  return 'typing';
}

export function setDefaultMode(mode: PracticeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEFAULT, mode);
  } catch {
    /* noop */
  }
}

export function getLastModeForCourse(courseKey: string): PracticeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY_LAST_PREFIX + courseKey);
    if (v && ['watch-speak', 'dictation', 'typing', 'shadowing'].includes(v)) {
      return v as PracticeMode;
    }
  } catch {
    /* noop */
  }
  return null;
}

export function setLastModeForCourse(courseKey: string, mode: PracticeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_PREFIX + courseKey, mode);
  } catch {
    /* noop */
  }
}

interface StartModeSelectorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: PracticeMode) => void;
  courseKey: string;
}

const StartModeSelector: React.FC<StartModeSelectorProps> = ({
  open,
  onClose,
  onConfirm,
  courseKey,
}) => {
  const [selected, setSelected] = useState<PracticeMode>('typing');
  const [remember, setRemember] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      const lastMode = getLastModeForCourse(courseKey);
      setSelected(lastMode || getDefaultMode());
      setRemember(!getAskModeEnabled());
    }
  }, [open, courseKey]);

  const handleConfirm = useCallback(() => {
    setLastModeForCourse(courseKey, selected);
    if (remember) {
      setDefaultMode(selected);
      setAskModeEnabled(false);
    }
    onConfirm(selected);
  }, [selected, remember, courseKey, onConfirm]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="选择练习模式"
      widthClass="max-w-xl"
    >
       <p className="text-sm text-[#64748B] text-center -mt-1 mb-4">
        4种模式，全方位提升英语能力
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {MODE_CARDS.map((mode) => {
          const isSelected = selected === mode.id;
          return (
            <motion.button
              key={mode.id}
              type="button"
              onClick={() => setSelected(mode.id)}
              whileHover={isSelected ? { scale: 1.02 } : { scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              animate={isSelected ? { y: -2 } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`relative text-left rounded-xl border-2 overflow-hidden transition-all p-4 ${
                 isSelected
                   ? 'border-[#6366F1] bg-[rgba(99_102_241_0.1)] shadow-lg shadow-[#6366F1]/30'
                   : 'border-[rgba(99_102_241_0.2)] bg-[#F8FAFC] hover:border-[rgba(99_102_241_0.5)] hover:bg-[#EEF2FF]'
              }`}
            >
              {isSelected && (
                 <span className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/40">
                  <Check size={10} />
                  已选择
                </span>
              )}
              {mode.badge && !isSelected && (
                 <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[rgba(99_102_241_0.3)]">
                  {mode.badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl ${mode.iconBg} ${mode.iconColor} flex items-center justify-center`}
                >
                  {mode.icon}
                </div>
                <div>
                   <h4 className="text-base font-semibold text-[#1E293B] leading-tight">
                    {mode.title}
                  </h4>
                   <p className="text-xs text-[#64748B] leading-tight">
                    {mode.subtitle}
                  </p>
                </div>
              </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                {mode.description}
              </p>
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-1 mb-4">
         <span className="text-xs text-[#64748B]">记住选择，下次自动进入</span>
        <button
          type="button"
          onClick={() => setRemember((r: boolean) => !r)}
           className={`relative w-10 h-5 rounded-full transition-colors ${
             remember
               ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB]'
               : 'bg-[#E0E7FF]'
           }`}
        >
          <span
             className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md shadow-[#6366F1]/30 transition-all ${
               remember ? 'left-[22px]' : 'left-0.5'
             }`}
          />
        </button>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-[#F8FAFC] border border-indigo-200 hover:bg-indigo-50 hover:text-slate-800 transition-colors"
        >
          取消
        </button>
        <motion.button
          type="button"
          onClick={handleConfirm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
           className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#6366F1] to-[#2563EB] hover:shadow-lg hover:shadow-[#6366F1]/40 transition-all"
        >
          开始练习
        </motion.button>
      </div>
    </ModalShell>
  );
};

export default StartModeSelector;
