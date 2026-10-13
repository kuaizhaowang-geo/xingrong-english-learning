import React from 'react';
import { BookOpen, Clock, ChevronRight, Sparkles } from 'lucide-react';
import type { AICourse } from '@shared/api.interface';

interface CourseCardGridProps {
  courses: AICourse[];
  onOpenCourse: (course: AICourse) => void;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
  easy: '简单',
  medium: '中等',
  hard: '困难',
  primary: '小学',
  junior: '初中',
  senior: '高中',
};

function getLevelLabel(level: string): string {
  return LEVEL_LABEL[level] ?? level;
}

function getContentCount(course: AICourse): number {
  const c = course.content;
  return (c.words?.length ?? 0) + (c.sentences?.length ?? 0) + (c.dialogues?.length ?? 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

const CourseCardGrid: React.FC<CourseCardGridProps> = ({ courses, onOpenCourse }) => {
  if (courses.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center py-20
         rounded-2xl bg-white/70 border border-indigo-100 backdrop-blur-xl">
        <div className="w-20 h-20 rounded-full
          bg-gradient-to-br from-violet-500/20 to-cyan-500/20
          border border-violet-500/30
          flex items-center justify-center mb-4">
          <Sparkles size={32} className="text-violet-400 opacity-60" />
        </div>
         <p className="text-base text-slate-700 font-medium">还没有创建课程</p>
         <p className="text-sm text-slate-500 mt-2">
          点击右上角「创建新课」，AI 帮你一键生成专属课程
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-ai-section-type="card-list"
    >
      {courses.map((course: AICourse) => {
        const itemCount = getContentCount(course);

        return (
          <div
            key={course.id}
            onClick={() => onOpenCourse(course)}
             className="group relative rounded-2xl cursor-pointer
               bg-white/80 backdrop-blur-xl
               border border-indigo-100
               hover:border-violet-500/60
              hover:shadow-xl hover:shadow-violet-500/10
              hover:-translate-y-1
              transition-all duration-300
              overflow-hidden">
            {/* 顶部霓虹光晕 */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40
              rounded-full bg-violet-600/20 blur-3xl opacity-0 group-hover:opacity-100
              transition-opacity duration-500" />

            {/* 封面区 */}
            <div className="relative h-32 overflow-hidden
              bg-gradient-to-br from-violet-600/40 via-purple-600/30 to-indigo-600/40">
              {/* 装饰圆圈 */}
              <div className="absolute top-0 right-0 w-32 h-32
                bg-cyan-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24
                bg-violet-400/30 rounded-full translate-y-1/2 -translate-x-1/3" />

              {/* 渐变 SVG 插画 */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 128" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id={`grad-${course.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#2563EB" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="50" r="28" fill="url(#grad-book)" opacity="0.6" />
                <rect x="100" y="30" width="80" height="60" rx="8" fill="url(#grad-book)" opacity="0.5" />
                <circle cx="230" cy="70" r="22" fill="url(#grad-book)" opacity="0.5" />
                <path d="M20 100 L100 70 L180 90 L260 50 L290 80"
                  stroke="url(#grad-book)" strokeWidth="2" fill="none" opacity="0.6" />
                <defs>
                  <linearGradient id="grad-book" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>

              {/* 难度标签 */}
              <div className="absolute top-3 left-3 z-10">
                 <span className="text-xs px-2.5 py-1 rounded-full border font-medium
                   bg-violet-50 text-violet-600 border-violet-200">
                  {getLevelLabel(course.level)}
                </span>
              </div>

              {/* 状态角标 */}
              {course.status && course.status !== 'completed' && (
                <div className="absolute top-3 right-3 z-10">
                   <span className="text-xs px-2.5 py-1 rounded-full
                     bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                    {course.status === 'generating' ? '生成中' : course.status}
                  </span>
                </div>
              )}
            </div>

            {/* 内容区 */}
            <div className="p-4">
               <h3 className="text-base font-semibold text-slate-800 mb-2 line-clamp-1
                 group-hover:text-transparent group-hover:bg-clip-text
                 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-cyan-600
                transition-all">
                {course.title}
              </h3>

              {/* 标签 */}
              <div className="flex items-center gap-2 mb-3">
                 <span className="text-xs px-2 py-0.5 rounded-full border
                   text-cyan-600 bg-cyan-50 border-cyan-200">
                  {course.topic}
                </span>
              </div>

              {/* 信息行 */}
               <div className="flex items-center gap-4 text-xs text-slate-500">
                 <span className="flex items-center gap-1">
                   <BookOpen size={12} className="text-violet-500" />
                  {itemCount} 条内容
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Clock size={12} className="text-slate-500" />
                  {formatDate(course.createdAt)}
                </span>
              </div>

              {/* 继续学习按钮 */}
              <button
                className="mt-4 w-full flex items-center justify-center gap-1
                   py-2 rounded-xl text-sm font-medium
                   bg-gradient-to-r from-violet-500/20 to-cyan-500/20
                   text-cyan-700 border border-violet-500/30
                   hover:from-violet-500/30 hover:to-cyan-500/30
                   hover:border-violet-500/50
                   transition-all duration-300
                   group-hover:text-indigo-700">
                查看详情
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseCardGrid;
