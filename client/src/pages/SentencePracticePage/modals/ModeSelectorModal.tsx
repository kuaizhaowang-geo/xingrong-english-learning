import React from 'react';
import { motion } from 'framer-motion';
import { Check, Volume2, Play, Layers } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import ModalShell from '../PracticeModalShell';
import type { PracticeMode } from '@client/src/components/practice-toolbar';

interface ModeSelectorModalProps {
  open: boolean;
  onClose: () => void;
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
}

const MODES: Array<{
  id: PracticeMode;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  badge?: string;
  icon: React.ReactNode;
  image: string;
  shortcut?: string;
}> = [
  {
    id: 'watch-speak',
    title: '中译英模式',
    subtitle: '表达训练',
    description: '看到中文提示，尝试用英文表达。练习运用所学词汇和语法',
    gradient: 'from-amber-500 to-orange-600',
    badge: '新手推荐',
    icon: <Play size={22} />,
    image:
      '/spark/app/app_17cteejgcjt/runtime/api/v1/storage/object/bucket_aadkruh7jsqgo_static/static%2Faadksr6fz4cag_ve_miaoda',
    shortcut: '1',
  },
  {
    id: 'dictation',
    title: '听力模式',
    subtitle: '听力+拼写',
    description: '播放英语音频，让你沉浸在语言环境中。培养语感，熟悉发音',
    gradient: 'from-sky-500 to-blue-600',
    badge: '泛听神器',
    icon: <Volume2 size={22} />,
    image:
      '/spark/app/app_17cteejgcjt/runtime/api/v1/storage/object/bucket_aadkruh7jsqgo_static/static%2Faadksskxasaji_ve_miaoda',
    shortcut: '2',
  },
  {
    id: 'typing',
    title: '打字练习',
    subtitle: '输入练习',
    description: '在练题过程中提升打字速度与拼写准确率',
    gradient: 'from-orange-500 to-[#FF6B35]',
    badge: '输入强化',
    icon: <Layers size={22} />,
    image:
      '/spark/app/app_17cteejgcjt/runtime/api/v1/storage/object/bucket_aadkruh7jsqgo_static/static%2Faadkssvrsxaao_ve_miaoda',
    shortcut: '3',
  },
  {
    id: 'shadowing',
    title: '口语练习',
    subtitle: '口语矫正',
    description: '跟读句子并练习发音，让口语表达更自然流畅',
    gradient: 'from-rose-500 to-pink-600',
    badge: '口语矫正',
    icon: <Play size={22} />,
    image:
      '/spark/app/app_17cteejgcjt/runtime/api/v1/storage/object/bucket_aadkruh7jsqgo_static/static%2Faadksr6agoqfq_ve_miaoda',
    shortcut: '4',
  },
];

const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  open,
  onClose,
  currentMode,
  onModeChange,
}) => {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="切换练习模式"
      widthClass="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const isCurrent = currentMode === mode.id;
          return (
            <motion.button
              key={mode.id}
              type="button"
              whileHover={isCurrent ? { scale: 1.03 } : { scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              animate={isCurrent ? { y: -3 } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => {
                onModeChange(mode.id);
                onClose();
              }}
               className={`relative text-left rounded-xl border-2 overflow-hidden transition-all ${
                 isCurrent
                   ? 'border-[#6366F1] shadow-lg shadow-[#6366F1]/30 bg-[rgba(99_102_241_0.1)]'
                   : 'border-[rgba(99_102_241_0.2)] bg-[#F8FAFC] hover:border-[rgba(99_102_241_0.5)] hover:bg-[#EEF2FF]'
               }`}
            >
              {isCurrent && (
                 <span className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/40">
                  <Check size={10} />
                  当前
                </span>
              )}
              {mode.badge && !isCurrent && (
                 <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[rgba(99_102_241_0.3)]">
                  {mode.badge}
                </span>
              )}
              {mode.shortcut && (
                 <span className="absolute top-2 left-2 z-10 flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#F8FAFC]/90 text-[#64748B] border border-[rgba(99_102_241_0.3)] backdrop-blur-sm">
                  {mode.shortcut}
                </span>
              )}
              <div className="h-[100px] w-full overflow-hidden">
                <Image
                  src={mode.image}
                  alt={mode.title}
                  className="w-full h-full object-cover"
                  width={400}
                  height={160}
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mode.gradient} text-white flex items-center justify-center shadow-sm`}
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
                 <p className="text-sm text-[#64748B] leading-relaxed">
                  {mode.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
       <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#64748b]">
         <kbd className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[rgba(99_102_241_0.3)] text-[#64748B] font-mono">
          Tab
        </kbd>
        <span>切换 ·</span>
         <kbd className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[rgba(99_102_241_0.3)] text-[#64748B] font-mono">
           Enter
         </kbd>
         <span>确认</span>
      </div>
    </ModalShell>
  );
};

export default ModeSelectorModal;
