import React from 'react';
import { motion } from 'framer-motion';
import { Star, Play, Lock, Trophy, Target } from 'lucide-react';
import { soundManager } from '@client/src/utils/soundManager';
import { buttonHoverTap } from '@client/src/utils/animations';
import type { TypingCourse } from '@shared/api.interface';

export interface CourseCardProps {
  course: TypingCourse;
  onStart: (course: TypingCourse) => void;
  isLocked?: boolean;
}

const difficultyLabels: Record<number, string> = {
  1: '入门',
  2: '简单',
  3: '中等',
  4: '困难',
  5: '专家',
};

const CourseCard: React.FC<CourseCardProps> = ({ course, onStart, isLocked }) => {
  return (
    <div
      className={`
        relative glass-card rounded-2xl p-5
        transition-all duration-300
        ${isLocked ? 'opacity-60' : 'hover:-translate-y-1'}
      `}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-8 h-8 rounded-full bg-[rgba(15_23_42_0.8)] flex items-center justify-center border border-[rgba(148_163_184_0.3)]">
            <Lock size={14} className="text-slate-500" />
          </div>
        </div>
      )}

      {/* Course name & difficulty */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white leading-tight pr-2">
          {course.name}
        </h3>
      </div>

      {/* Difficulty stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((star: number) => (
          <Star
            key={star}
            size={14}
            className={
              star <= course.difficulty
                ? 'text-[#FCD34D] fill-[#FCD34D]'
                : 'text-[rgba(148_163_184_0.3)]'
            }
          />
        ))}
         <span className="ml-2 text-xs text-slate-400">
          {difficultyLabels[course.difficulty] || '中等'}
        </span>
      </div>

      {/* Description */}
       <p className="text-sm text-slate-400 line-clamp-2 mb-4 min-h-[2.5rem]">
        {course.description || '暂无简介'}
      </p>

      {/* Best score */}
      {course.bestWpm !== undefined && course.bestWpm > 0 ? (
        <div className="flex items-center gap-4 mb-4 py-2 px-3 bg-white/5 rounded-lg border border-fuchsia-500/15 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-[#FCD34D]" />
            <span className="text-sm font-medium text-slate-200">
               {course.bestWpm} <span className="text-xs text-slate-400">WPM</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={14} className="text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">
              {course.bestAccuracy?.toFixed(0)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-4 py-2 px-3 bg-white/5 rounded-lg border border-white/10">
          <span className="text-xs text-slate-400">暂无成绩记录</span>
        </div>
      )}

      {/* Start button */}
      {isLocked ? (
        <button
          disabled
          className={`
            w-full py-2.5 px-4 rounded-xl
            font-medium text-sm
            flex items-center justify-center gap-2
            bg-[rgba(148_163_184_0.1)] text-[#64748B] cursor-not-allowed
          `}
        >
          <Play size={16} />
          未解锁
        </button>
      ) : (
        <motion.button
          {...buttonHoverTap}
          onClick={() => {
            soundManager.ensureContext();
            soundManager.playClick('primary');
            onStart(course);
          }}
          className={`
            w-full py-2.5 px-4 rounded-xl
            font-medium text-sm
            flex items-center justify-center gap-2
            transition-all duration-200
            bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white hover:shadow-[0_0_20px_rgba(124_58_237_0.5)]
          `}
        >
          <Play size={16} />
          {course.completed ? '继续练习' : '开始练习'}
        </motion.button>
      )}
    </div>
  );
};

export default CourseCard;
