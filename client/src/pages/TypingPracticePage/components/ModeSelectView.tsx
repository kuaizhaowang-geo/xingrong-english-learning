import React from 'react';
import { motion } from 'framer-motion';
import {
  Keyboard,
  BookOpen,
  AlignLeft,
  FileText,
  Gamepad2,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import { soundManager } from '@client/src/utils/soundManager';
import { staggerContainer, fadeInUp } from '@client/src/utils/animations';
import type { TypingStats } from '@shared/api.interface';
import type { TypingCategory } from '../TypingPracticePage';

export interface ModeSelectViewProps {
  stats: TypingStats | null;
  onSelectMode: (category: TypingCategory) => void;
  onSelectWhackAMole: () => void;
  onBack?: () => void;
}

interface ModeCard {
  category: TypingCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  accentText: string;
}

const MODE_CARDS: ModeCard[] = [
  {
    category: 'finger',
    title: '指法练习',
    description: '从零开始，掌握标准键位',
    icon: <Keyboard size={36} />,
    gradientFrom: '#6366F1',
    gradientTo: '#2563EB',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    accentText: 'from-violet-400 to-blue-400',
  },
  {
    category: 'pinyin',
    title: '拼音打字',
    description: '看汉字打拼音，提升速度',
    icon: <BookOpen size={36} />,
    gradientFrom: '#EC4899',
    gradientTo: '#F97316',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    accentText: 'from-pink-400 to-orange-400',
  },
  {
    category: 'english',
    title: '英文打字',
    description: '单词与句子强化训练',
    icon: <AlignLeft size={36} />,
    gradientFrom: '#2563EB',
    gradientTo: '#06B6D4',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    accentText: 'from-blue-400 to-cyan-400',
  },
  {
    category: 'chinese',
    title: '中文打字',
    description: '汉字输入，熟能生巧',
    icon: <FileText size={36} />,
    gradientFrom: '#22C55E',
    gradientTo: '#14B8A6',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    accentText: 'from-emerald-400 to-teal-400',
  },
];

const ModeSelectView: React.FC<ModeSelectViewProps> = ({
  stats,
  onSelectMode,
  onSelectWhackAMole,
  onBack,
}) => {
  return (
    <div className="min-h-screen tech-bg text-slate-100 flex flex-col">
      {onBack && (
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span>返回</span>
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            打字练习
          </h1>
          <p className="text-slate-400 text-base">
            选择一种练习模式，开启你的打字之旅
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-3 glass-card rounded-2xl px-6 py-4 mb-10"
        >
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
            <Trophy size={20} className="text-[#FCD34D]" />
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">
                {stats?.bestWpm || 0}
              </div>
              <div className="text-xs text-slate-400">最佳WPM</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">
                {stats?.averageAccuracy?.toFixed(0) || 0}%
              </div>
              <div className="text-xs text-slate-400">平均正确率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-violet-400">
                {stats?.totalPracticeTime
                  ? `${Math.floor(stats.totalPracticeTime / 60)}分`
                  : '0分'}
              </div>
              <div className="text-xs text-slate-400">总练习时长</div>
            </div>
          </div>
        </motion.div>

        {/* Mode cards grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl"
        >
          {MODE_CARDS.map((card: ModeCard) => (
            <motion.div key={card.category} variants={fadeInUp}>
              <button
                type="button"
                onClick={() => {
                  soundManager.ensureContext();
                  soundManager.playClick('primary');
                  onSelectMode(card.category);
                }}
                className="group relative w-full aspect-square md:aspect-auto md:h-44 glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col items-start justify-between text-left"
                style={{
                  boxShadow: '0 0 0px rgba(99, 102, 241, 0)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 30px ${card.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0px rgba(99, 102, 241, 0)';
                }}
              >
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${card.gradientFrom} 0%, ${card.gradientTo} 100%)`,
                  }}
                />
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${card.gradientFrom} 0%, ${card.gradientTo} 100%)`,
                    boxShadow: `0 4px 20px ${card.glowColor}`,
                  }}
                >
                  {card.icon}
                </div>
                {/* Text */}
                <div>
                  <div
                    className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent ${card.accentText}`}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${card.gradientFrom}, ${card.gradientTo})`,
                    }}
                  >
                    {card.title}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {card.description}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}

          {/* 打地鼠 card */}
          <motion.div variants={fadeInUp}>
            <button
              type="button"
              onClick={() => {
                soundManager.ensureContext();
                soundManager.playClick('primary');
                onSelectWhackAMole();
              }}
              className="group relative w-full aspect-square md:aspect-auto md:h-44 glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col items-start justify-between text-left"
              style={{
                boxShadow: '0 0 0px rgba(239, 68, 68, 0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0px rgba(239, 68, 68, 0)';
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                }}
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
                }}
              >
                <Gamepad2 size={36} />
              </div>
              <div>
                <div
                  className="text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #EF4444, #F97316)',
                  }}
                >
                  打地鼠闯关
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  趣味游戏，边玩边练
                </div>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModeSelectView;
