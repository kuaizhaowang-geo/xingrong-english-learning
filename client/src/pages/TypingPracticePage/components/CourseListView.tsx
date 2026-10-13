import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';
import { soundManager } from '@client/src/utils/soundManager';
import { staggerContainer, fadeInUp, buttonHoverTap } from '@client/src/utils/animations';
import type {
  TypingCourse,
  TypingStats,
  TypingLevel,
  TypingCourseListResponse,
  TypingPracticeMode,
} from '@shared/api.interface';
import CourseCard from './CourseCard';

export interface CourseListViewProps {
  courses: TypingCourse[];
  levels: TypingCourseListResponse['levels'];
  stats: TypingStats | null;
  activeLevel: TypingLevel | 'all';
  activePracticeMode: TypingPracticeMode;
  activeCategory: string;
  loading: boolean;
  onLevelChange: (level: TypingLevel | 'all') => void;
  onPracticeModeChange: (mode: TypingPracticeMode) => void;
  onStart: (course: TypingCourse) => void;
  onBack?: () => void;
}

const LEVEL_TABS: { level: TypingLevel | 'all'; label: string }[] = [
  { level: 'all', label: '全部' },
  { level: 'beginner', label: '入门级' },
  { level: 'elementary', label: '初级' },
  { level: 'intermediate', label: '中级' },
  { level: 'advanced', label: '高级' },
  { level: 'expert', label: '专家级' },
];

const PRACTICE_MODE_TABS: { mode: TypingPracticeMode; label: string }[] = [
  { mode: 'sentence', label: '句子练习' },
  { mode: 'word', label: '单词专项' },
];

const CATEGORY_TITLES: Record<string, { title: string; subtitle: string }> = {
  finger: { title: '指法练习', subtitle: '从零开始，掌握标准键位与指法' },
  pinyin: { title: '拼音打字', subtitle: '看汉字打拼音，提升中文输入速度' },
  english: { title: '英文打字', subtitle: '单词与句子练习，强化英文输入能力' },
  chinese: { title: '中文打字', subtitle: '汉字输入练习，提升中文打字效率' },
};

const CourseListView: React.FC<CourseListViewProps> = ({
  courses,
  levels,
  stats,
  activeLevel,
  activePracticeMode,
  activeCategory,
  loading,
  onLevelChange,
  onPracticeModeChange,
  onStart,
  onBack,
}) => {
  const catInfo = CATEGORY_TITLES[activeCategory] ?? CATEGORY_TITLES.english;
  return (
    <div className="min-h-screen tech-bg text-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            {onBack && (
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="neon-btn w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              >
                <ArrowLeft size={18} />
              </motion.button>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {catInfo.title}
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                {catInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Stats card */}
          <div className="flex items-center gap-3 glass-card rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-[#FCD34D]" />
            </div>
            <div className="flex gap-4">
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
          </div>
        </div>

        {/* Practice mode tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl border border-fuchsia-500/20 w-fit backdrop-blur-sm">
          {PRACTICE_MODE_TABS.map((tab) => {
             const isActive = (activePracticeMode as string) === tab.mode;
             return (
               <motion.button
                 key={tab.mode}
                 {...buttonHoverTap}
                  onClick={() => {
                    soundManager.ensureContext();
                    soundManager.playClick('soft');
                    onPracticeModeChange(tab.mode);
                  }}
                 className={`
                  px-5 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-neon-purple'
                    : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                {tab.label}
              </motion.button>
            );
          })}
        </div>

          {/* Level tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {LEVEL_TABS.map((tab) => {
             const levelInfo = levels.find((l) => l.level === tab.level);
             const count = levelInfo?.count ?? 0;
             const isActive = activeLevel === tab.level;

             return (
               <motion.button
                 key={tab.level}
                 {...buttonHoverTap}
                 onClick={() => {
                   soundManager.ensureContext();
                   soundManager.playClick('soft');
                   onLevelChange(tab.level);
                 }}
                 className={`
                   px-4 py-2 rounded-xl text-sm font-medium
                   transition-all duration-200
                   ${isActive
                     ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-neon-purple'
                     : 'neon-btn'
                   }
                 `}
               >
                 {tab.label}
                 {tab.level !== 'all' && count > 0 && (
                   <span className="ml-1.5 text-xs opacity-70">({count})</span>
                 )}
                </motion.button>
              );
            })}
          </div>

          {/* Course grid */}
          {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-fuchsia-400 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
           <div className="text-center py-20 text-slate-400">
            该等级暂无课程
          </div>
        ) : (
           <motion.div
             variants={staggerContainer}
             initial="hidden"
             animate="show"
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
             key={activeLevel}
           >
             {courses.map((course: TypingCourse) => (
               <motion.div key={course.id} variants={fadeInUp}>
                 <CourseCard
                   course={course}
                   onStart={onStart}
                   isLocked={false}
                 />
               </motion.div>
             ))}
           </motion.div>
        )}
      </div>
    </div>
  );
};

export default CourseListView;
