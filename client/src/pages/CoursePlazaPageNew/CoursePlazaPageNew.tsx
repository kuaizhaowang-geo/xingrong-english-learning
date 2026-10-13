import React, { useState, useMemo, useEffect } from 'react';
import { Search, Flame, Clock, Sparkles, BookOpen, Briefcase, Palette, Baby, Puzzle, Award, Zap, Loader2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getCourses } from '@client/src/api/courses';
import type { CourseItem } from '@shared/api.interface';

interface Course {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  lessonCount: number;
  price: number;
  students: number;
  emoji: string;
  gradient: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  beginner: 'from-purple-600 to-indigo-600',
  daily: 'from-cyan-500 to-teal-500',
  comprehensive: 'from-violet-600 to-purple-600',
  business: 'from-blue-700 to-indigo-700',
  culture: 'from-pink-600 to-purple-600',
  kids: 'from-amber-500 to-orange-500',
  phonics: 'from-emerald-500 to-teal-600',
  certification: 'from-rose-600 to-orange-500',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  beginner: '🚀',
  daily: '💬',
  comprehensive: '📚',
  business: '💼',
  culture: '🎵',
  kids: '🧒',
  phonics: '🔤',
  certification: '🏆',
};

function courseItemToCourse(item: CourseItem): Course {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    difficulty: item.level,
    lessonCount: item.totalLessons,
    price: Number(item.price) || 0,
    students: item.sharedCount,
    emoji: CATEGORY_EMOJIS[item.category] || '📘',
    gradient: CATEGORY_GRADIENTS[item.category] || 'from-slate-600 to-gray-600',
  };
}

const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'beginner', label: '零基础入门' },
  { value: 'daily', label: '日常实用' },
  { value: 'comprehensive', label: '综合提升' },
  { value: 'business', label: '职场商务' },
  { value: 'culture', label: '文化兴趣' },
  { value: 'kids', label: '少儿英语' },
  { value: 'phonics', label: '自然拼读' },
  { value: 'certification', label: '认证备考' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: '最新' },
  { value: 'hot', label: '最热' },
  { value: 'price', label: '价格' },
];



const CoursePlazaPageNew: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('hot');
  const [searchText, setSearchText] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCourses({
      category: activeCategory === 'all' ? undefined : activeCategory,
      search: searchText || undefined,
      sort: sortBy,
      pageSize: 50,
    })
      .then((res) => {
        if (cancelled) return;
        const list = (res.items || []).map(courseItemToCourse);
        setCourses(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('加载课程失败', { arg0: JSON.stringify(err) });
        setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, sortBy, searchText]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    switch (sortBy) {
      case 'newest':
        result = [...result].sort((a: Course, b: Course) =>
          b.id.localeCompare(a.id),
        );
        break;
      case 'hot':
        result = [...result].sort((a: Course, b: Course) => b.students - a.students);
        break;
      case 'price':
        result = [...result].sort((a: Course, b: Course) => a.price - b.price);
        break;
    }
    return result;
  }, [courses, sortBy]);

  const handleCardClick = (course: Course): void => {
    logger.info('点击课程：', { arg0: course.title, arg1: course.id });
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case '入门': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case '初级': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case '中级': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case '高级': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden text-white">
       {/* 顶部栏 */}
       <div
         className="h-[44px] flex items-center justify-between px-4 flex-shrink-0"
         style={{ backgroundColor: 'transparent' }}
       >
        <div className="flex items-center gap-2">
          <Zap size={18} style={{ color: '#06B6D4' }} />
          <h1 className="text-base font-bold tracking-wide" style={{ color: '#F1F5F9' }}>
            课程广场
          </h1>
        </div>
        <div className="relative w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6366F1' }} />
           <input
             type="text"
             value={searchText}
             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
             placeholder="搜索课程..."
             className="w-full h-8 pl-8 pr-3 rounded-full text-xs outline-none transition-all placeholder:text-slate-500"
             style={{
               backgroundColor: 'rgba(255, 255, 255, 0.05)',
               color: '#F1F5F9',
               border: '1px solid rgba(217, 70, 239, 0.3)',
               boxShadow: '0 0 8px rgba(217, 70, 239, 0.1)',
               backdropFilter: 'blur(10px)',
             }}
             onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
               e.target.style.borderColor = '#D946EF';
               e.target.style.boxShadow = '0 0 12px rgba(217, 70, 239, 0.35)';
             }}
             onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
               e.target.style.borderColor = 'rgba(217, 70, 239, 0.3)';
               e.target.style.boxShadow = '0 0 8px rgba(217, 70, 239, 0.1)';
             }}
           />
        </div>
      </div>

       {/* 分类筛选栏 */}
       <div
         className="h-[40px] flex items-center gap-2 px-4 overflow-x-auto flex-shrink-0 scrollbar-hide"
         style={{
           backgroundColor: 'transparent',
           borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
         }}
       >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                      color: '#fff',
                      boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)',
                    }
                 : {
                       backgroundColor: 'rgba(255, 255, 255, 0.05)',
                       color: '#CBD5E1',
                       border: '1px solid rgba(217, 70, 239, 0.2)',
                     }
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>

       {/* 排序栏 */}
       <div
         className="py-1.5 px-4 flex items-center justify-between flex-shrink-0"
         style={{ backgroundColor: 'transparent' }}
       >
         <span className="text-xs" style={{ color: '#94A3B8' }}>
           共 <span style={{ color: '#22D3EE', fontWeight: 600 }}>{filteredCourses.length}</span> 门课程
         </span>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortBy === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className="px-2.5 py-0.5 rounded text-xs font-medium transition-all"
                style={
                   isActive
                     ? { color: '#D946EF', fontWeight: 600 }
                     : { color: '#94A3B8' }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 课程卡片网格 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94A3B8' }}>
             <Loader2 size={32} className="animate-spin mb-3" style={{ color: '#D946EF' }} />
             <p className="text-sm">加载中...</p>
           </div>
        ) : (
           <>
             <div className="grid grid-cols-2 gap-3">
               {filteredCourses.map((course: Course) => (
                  <div
                   key={course.id}
              onClick={() => handleCardClick(course)}
              className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(217, 70, 239, 0.25)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.borderColor = 'rgba(217, 70, 239, 0.5)';
                e.currentTarget.style.boxShadow = '0 4px 30px rgba(217, 70, 239, 0.25), 0 0 20px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.borderColor = 'rgba(217, 70, 239, 0.25)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* 缩略图区 */}
              <div
                className={`h-20 flex items-center justify-center bg-gradient-to-br ${course.gradient} relative overflow-hidden`}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)',
                  }}
                />
                <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                  {course.emoji}
                </span>
                <div
                  className="absolute bottom-1 right-2 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {course.lessonCount}课时
                </div>
              </div>

              {/* 内容区 */}
              <div className="p-2.5">
                <h3
                  className="text-[13px] font-medium leading-tight mb-2 line-clamp-2"
                  style={{ color: '#F1F5F9', minHeight: '34px' }}
                >
                  {course.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${getDifficultyColor(course.difficulty)}`}
                  >
                    {course.difficulty}
                  </span>
                   <div className="flex items-center gap-0.5">
                     <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                       ¥
                     </span>
                     <span className="text-sm font-bold" style={{ color: '#D946EF' }}>
                       {course.price}
                     </span>
                   </div>
                </div>
              </div>
                 </div>
               ))}
             </div>

             {filteredCourses.length === 0 && (
               <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94A3B8' }}>
                 <BookOpen size={40} className="mb-3 opacity-40" />
                 <p className="text-sm">暂无符合条件的课程</p>
               </div>
             )}
           </>
         )}
     </div>
    </div>
  );
};

export default CoursePlazaPageNew;
