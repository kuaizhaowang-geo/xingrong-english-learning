import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Languages,
  Headphones,
  Keyboard,
  Mic,
  X,
  Sparkles,
  Star,
  Zap,
  Award,
} from 'lucide-react';

export type PracticeModeType = 'translate' | 'listening' | 'typing' | 'speaking';

interface ModeOption {
  id: PracticeModeType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
  accent: string;
}

const MODES: ModeOption[] = [
  {
    id: 'translate',
    title: '中译英模式',
    subtitle: '新手推荐',
    description: '看到中文提示，尝试用英文表达，配合口语跟读评测，打好表达基础',
    icon: <Languages size={28} />,
    gradient: 'from-amber-400 to-orange-500',
    badge: '新手入门',
    accent: '#FF6B35',
  },
  {
    id: 'listening',
    title: '听力模式',
    subtitle: '泛听神器',
    description: '播放英语音频，听发音后输入英文，空格提交，训练听力与拼写',
    icon: <Headphones size={28} />,
    gradient: 'from-sky-400 to-blue-600',
    badge: '磨耳朵',
    accent: '#4361EE',
  },
  {
    id: 'typing',
    title: '打字练习',
    subtitle: '输入强化',
    description: '虚拟键盘+虚拟双手指法引导，逐字母输入，掌握正确指法',
    icon: <Keyboard size={28} />,
    gradient: 'from-violet-400 to-purple-600',
    badge: '最推荐',
    accent: '#6366F1',
  },
  {
    id: 'speaking',
    title: '口语练习',
    subtitle: '口语矫正',
    description: '跟读句子并练习发音，实时口语评测，纠正发音偏差',
    icon: <Mic size={28} />,
    gradient: 'from-rose-400 to-pink-600',
    badge: '开口说',
    accent: '#EF476F',
  },
];

interface PracticeModeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: PracticeModeType) => void;
  currentMode?: PracticeModeType;
}

const PracticeModeSelector: React.FC<PracticeModeSelectorProps> = ({
  open,
  onClose,
  onSelect,
  currentMode,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-purple-500 to-blue-500" />

            <div className="flex items-center justify-between px-8 pt-7 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="text-orange-500" size={22} />
                  <h2 className="text-2xl font-bold text-gray-800">选择练习模式</h2>
                </div>
                <p className="text-sm text-gray-500 ml-7">
                  每种模式有独特的交互方式，找到最适合你的那一种
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODES.map((mode, index) => {
                const isCurrent = currentMode === mode.id;
                return (
                  <motion.button
                    key={mode.id}
                    type="button"
                    onClick={() => onSelect(mode.id)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      isCurrent
                        ? 'border-orange-400 bg-orange-50/60'
                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    {mode.badge && (
                      <span
                        className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: mode.accent }}
                      >
                        {mode.badge}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                        当前模式
                      </span>
                    )}

                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} text-white flex items-center justify-center shadow-lg mb-3`}
                    >
                      {mode.icon}
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-0.5">
                      {mode.title}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {mode.subtitle}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {mode.description}
                    </p>

                    <div className="flex items-center gap-1 mt-3">
                      {[...Array(3)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className="fill-amber-400 text-amber-400"
                        />
                      ))}
                      <span className="text-[11px] text-gray-400 ml-1">
                        {index === 2 ? '核心玩法' : index === 0 ? '入门首选' : index === 1 ? '听力强化' : '口语突破'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="px-8 pb-6 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Zap size={14} className="text-amber-400" />
              <span>随时可以在练习中切换模式，进度不丢失</span>
              <Award size={14} className="text-amber-400" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PracticeModeSelector;
