import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Users, Plus, Loader2, Trophy, Bell, Heart, ChevronDown, BookOpen, Sparkles, Puzzle, BookText, Keyboard, Baby } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { coursesApi, userCoursesApi, courseFavoritesApi } from '@client/src/api';
import type { CourseItem, PagedResponse } from '@shared/api.interface';
import { COURSE_CATEGORIES } from '@shared/api.interface';
import { AppBadge } from '@client/src/components/ui/app-badges';
import { Image } from '@client/src/components/ui/image';
import { getCategoryFallbackCover } from '@client/src/utils/practice-illustrations';
import PreschoolCourseList from './PreschoolCourseList';

const categoryGradients: Record<string, string> = {
  preschool: 'from-pink-400 to-rose-500',
  beginner: 'from-green-400 to-teal-500',
  daily: 'from-blue-400 to-indigo-500',
  comprehensive: 'from-purple-400 to-pink-500',
  business: 'from-gray-700 to-gray-900',
  travel: 'from-cyan-400 to-blue-500',
  exam: 'from-red-400 to-rose-500',
  certification: 'from-yellow-400 to-orange-500',
  culture: 'from-pink-400 to-rose-500',
  math_primary: 'from-blue-500 to-indigo-600',
  chinese_primary: 'from-red-500 to-orange-500',
  other: 'from-gray-400 to-gray-600',
};

// 课程广场 - 哇学社风格13个分类
const PLAZA_CATEGORIES = [
  { value: 'preschool', label: '学前英语', special: true },
  { value: 'all', label: '全部' },
  { value: 'beginner', label: '零基础' },
  { value: 'daily', label: '日常实用' },
  { value: 'comprehensive', label: '综合提升' },
  { value: 'business', label: '商务英语' },
  { value: 'certification', label: '认证备考' },
  { value: 'entertainment', label: '娱乐影音' },
  { value: 'graded-reading', label: '分级阅读' },
  { value: 'vocabulary', label: '词汇学习' },
  { value: 'industry', label: '行业英语' },
  { value: 'literature', label: '文学读物' },
  { value: 'speech', label: '英文演讲' },
  { value: 'other', label: '其他' },
];

// 快捷练习入口（直接跳转到句子练习页面，复用4种模式+键盘布局）
const QUICK_PRACTICE_ENTRIES = [
  { key: 'preschool', label: '学前英语', icon: Baby, gradient: 'from-pink-500 to-rose-500', emoji: '🔤', url: '/practice/sentence?preschoolModule=words&preschoolCategory=animals&mode=typing' },
  { key: 'sentence', label: '句子训练', icon: Puzzle, gradient: 'from-purple-500 to-indigo-500', emoji: '💬', url: '/practice/sentence?contentType=sentence&mode=typing' },
  { key: 'word', label: '单词训练', icon: BookText, gradient: 'from-orange-500 to-amber-500', emoji: '📖', url: '/practice/sentence?contentType=word&mode=typing' },
  { key: 'typing', label: '打字练习', icon: Keyboard, gradient: 'from-cyan-500 to-blue-500', emoji: '⌨️', url: '/typing-practice' },
];

const CoursePlazaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pageData, setPageData] = useState<PagedResponse<CourseItem> | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const sortValue = searchParams.get('sort') || '';

  const fetchCourses = useCallback(
    async (page: number, category: string, search: string, sort: string, append: boolean): Promise<void> => {
      const isFirst = page === 1;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);
      try {
        const params: {
          category?: string;
          search?: string;
          sort?: string;
          page: number;
          pageSize: number;
        } = { page, pageSize: 12 };
        if (category !== 'all') params.category = category;
        if (search) params.search = search;
        if (sort) params.sort = sort;
        const res = await coursesApi.getCourses(params);
        setPageData(res);
        if (append) {
          setCourses((prev) => [...prev, ...res.items]);
        } else {
          setCourses(res.items);
        }
      } catch (err) {
        logger.error('加载课程列表失败', err as Error);
        setToast('加载失败，请刷新重试');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setSearchText(searchQuery);
    fetchCourses(1, activeCategory, searchQuery, sortValue, false);
  }, [activeCategory, searchQuery, sortValue, fetchCourses]);

  const fetchFavorites = useCallback(async (): Promise<void> => {
    try {
      const favs = await courseFavoritesApi.getFavorites();
      setFavoriteIds(new Set(favs.map((f: CourseItem) => f.id)));
    } catch (err) {
      logger.error('加载收藏列表失败', err as Error);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const showToast = (msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCategoryChange = (category: string): void => {
     const params: Record<string, string> = { category };
     if (searchQuery) params.search = searchQuery;
     if (sortValue) params.sort = sortValue;
     setSearchParams(params);
   };

  const handleSortChange = (sort: string): void => {
    const params: Record<string, string> = { category: activeCategory };
    if (searchQuery) params.search = searchQuery;
    if (sort) params.sort = sort;
    setSearchParams(params);
  };

  const handleSearch = (value: string): void => {
    const params: Record<string, string> = { category: activeCategory };
    if (value) params.search = value;
    if (sortValue) params.sort = sortValue;
    setSearchParams(params);
  };

  const debouncedSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (value: string): void => {
        clearTimeout(timer);
        timer = setTimeout(() => handleSearch(value), 400);
      };
    })(),
    [activeCategory],
  );

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setSearchText(val);
    debouncedSearch(val);
  };

  const handleLoadMore = (): void => {
    if (!pageData || pageData.page * pageData.pageSize >= pageData.total) return;
    fetchCourses(pageData.page + 1, activeCategory, searchQuery, sortValue, true);
  };

  const handleEnroll = async (
    e: React.MouseEvent,
    courseId: string,
  ): Promise<void> => {
    e.stopPropagation();
    setEnrollingId(courseId);
    try {
      await userCoursesApi.enrollCourse(courseId);
      showToast('已加入课程 ✓');
    } catch (err) {
      logger.error('加入课程失败', err as Error);
      showToast('加入失败，请稍后再试');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    courseId: string,
  ): Promise<void> => {
    e.stopPropagation();
    const isFav = favoriteIds.has(courseId);
    // 乐观更新
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
    try {
      if (isFav) {
        await courseFavoritesApi.removeFavorite(courseId);
      } else {
        await courseFavoritesApi.addFavorite(courseId);
      }
    } catch (err) {
      logger.error('切换收藏状态失败', err as Error);
      // 失败回滚
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(courseId);
        else next.delete(courseId);
        return next;
      });
      showToast('操作失败，请稍后再试');
    }
  };

  const getGradient = (category: string): string => {
    return categoryGradients[category] || categoryGradients.other;
  };



  const hasMore = pageData ? pageData.page * pageData.pageSize < pageData.total : false;

  const sortOptions = [
    { value: '', label: '综合' },
    { value: 'popular', label: '最热' },
    { value: 'newest', label: '最新' },
  ];

  const currentSortLabel = sortOptions.find((o) => o.value === sortValue)?.label || '综合';

  const formatLearnerCount = (count: number): string => {
    return count.toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* 页面标题 + 搜索 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
         <h1 className="text-xl sm:text-2xl font-bold text-white flex-shrink-0">
          课程广场
        </h1>
        <div className="flex-1 w-full sm:flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchText}
            onChange={handleSearchInput}
            placeholder="搜索课程名称..."
            className="w-full h-11 pl-9 pr-4 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-[#FF6B35] transition-all"
          />
        </div>
      </div>

      {/* 快捷练习入口 */}
      <div>
         <h2 className="text-lg font-semibold text-white mb-3">快捷练习</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {QUICK_PRACTICE_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            return (
              <div
                key={entry.key}
                onClick={() => navigate(entry.url)}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${entry.gradient} p-4 sm:p-5 text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
              >
                <div className="absolute -right-3 -bottom-3 text-5xl opacity-20">{entry.emoji}</div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold mb-1">{entry.label}</h3>
                  <p className="text-xs opacity-80">4种模式 · 键盘练习</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 分类筛选 - 胶囊样式 */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
        {PLAZA_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          const isPreschool = cat.value === 'preschool';
          if (isPreschool) {
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg hover:scale-105'
                }`}
              >
                🔤 {cat.label}
              </button>
            );
          }
          return (
             <button
               key={cat.value}
               onClick={() => handleCategoryChange(cat.value)}
               className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                  isActive
                   ? 'bg-[#FF6B35] text-white shadow-sm'
                   : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 课程列表 - 卡片网格 */}
      <div>
        {activeCategory === 'preschool' ? (
           <PreschoolCourseList onBack={() => handleCategoryChange('all')} />
         ) : loading ? (
           <div className="py-16 text-center">
             <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#FF6B35' }} />
             <p className="text-sm text-[#6B7280]">加载中...</p>
           </div>
         ) : courses.length === 0 ? (
            <div className="py-16 text-center glass-card">
              <AppBadge variant="badge1" size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-slate-400">暂无相关课程</p>
           </div>
         ) : (
           <>
             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
               {courses.map((course: CourseItem) => {
                 const gradient = getGradient(course.category);
                 return (
                   <div
                     key={course.id}
                     onClick={() => navigate(`/courses/${course.id}`)}
                      className="glass-card hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden group"
                   >
                     {course.coverImage ? (
                       <Image
                         src={course.coverImage}
                         alt={course.title}
                         className="aspect-video w-full object-cover"
                       />
                     ) : (
                       <div className={`aspect-video bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                         <BookOpen size={28} className="text-white/90" />
                       </div>
                     )}
                     <div className="p-3 sm:p-4">
                        <h3 className="text-sm sm:text-base font-medium text-white line-clamp-2 mb-2 group-hover:text-[#FF8C5A] transition-colors min-h-[40px] sm:min-h-[48px]">
                         {course.title}
                       </h3>
                       <div className="flex items-center justify-between">
                         <span className="text-xs sm:text-sm text-[#FF6B35] font-semibold">
                           {Number(course.price) === 0 ? '免费' : `¥${course.price}`}
                         </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                           <Users size={10} className="sm:hidden" />
                           <Users size={12} className="hidden sm:inline" />
                           <span className="truncate max-w-[60px] sm:max-w-none">
                             {formatLearnerCount(course.sharedCount)}
                           </span>
                         </span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
             {hasMore && (
               <div className="text-center mt-6">
                 <button
                   onClick={handleLoadMore}
                   disabled={loadingMore}
                    className="px-8 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm text-slate-300 hover:bg-white/15 transition-colors inline-flex items-center gap-2"
                 >
                   {loadingMore ? (
                     <>
                       <Loader2 size={16} className="animate-spin" />
                       加载中...
                     </>
                   ) : (
                     '加载更多'
                   )}
                 </button>
               </div>
             )}
           </>
         )}
      </div>

      {/* 底部提示 */}
       <div className="glass-card p-6 sm:p-8 text-center">
         <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Sparkles size={22} className="text-[#FF6B35]" />
        </div>
         <h3 className="text-base sm:text-lg font-semibold text-white mb-2">想要更多课程？</h3>
         <p className="text-sm text-slate-400 mb-4">
          持续更新中，也可以告诉我们你想要的课程内容
        </p>
        <button
          onClick={() => showToast('感谢您的反馈，我们会尽快更新 🎉')}
          className="px-5 sm:px-6 py-2.5 sm:py-2 h-11 rounded-full bg-[#FF6B35] hover:bg-orange-600 text-white text-sm font-medium transition-colors inline-flex items-center justify-center min-w-[100px]"
        >
          提建议
        </button>
      </div>
    </div>
  );
};

export default CoursePlazaPage;
