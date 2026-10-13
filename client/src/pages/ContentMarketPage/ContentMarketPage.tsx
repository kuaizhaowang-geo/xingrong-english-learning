import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Search,
  BookOpen,
  Heart,
  Star,
  Play,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Languages,
  FileText,
  Calculator,
  MessageSquare,
  GraduationCap,
  BookText,
  Lock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@client/src/components/ui/pagination';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { Skeleton } from '@client/src/components/ui/skeleton';
import * as contentMarketApi from '@client/src/api/content-market';
import type {
  ContentMarketItem,
  WordbookSubject,
  WordbookContentType,
  MarketCategory,
  MarketTextbookItem,
  MarketCourseItem,
} from '@shared/api.interface';

const CATEGORY_TABS: { key: MarketCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Sparkles size={18} /> },
  { key: 'wordbook', label: '词库', icon: <BookText size={18} /> },
  { key: 'textbook', label: '教材', icon: <BookOpen size={18} /> },
  { key: 'course', label: '课程', icon: <GraduationCap size={18} /> },
];

const SUBJECT_TABS: { key: 'all' | WordbookSubject; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Sparkles size={16} /> },
  { key: 'english', label: '英语', icon: <Languages size={16} /> },
  { key: 'chinese', label: '语文', icon: <FileText size={16} /> },
  { key: 'math', label: '数学', icon: <Calculator size={16} /> },
];

const CONTENT_TYPES: { key: WordbookContentType | 'all'; label: string }[] = [
  { key: 'all', label: '全部类型' },
  { key: 'word', label: '单词' },
  { key: 'sentence', label: '句子' },
  { key: 'character', label: '汉字' },
  { key: 'phrase', label: '短语' },
  { key: 'formula', label: '公式' },
  { key: 'question', label: '题目' },
];

const SORT_OPTIONS: { key: 'hot' | 'newest' | 'rating'; label: string; icon: React.ReactNode }[] = [
  { key: 'hot', label: '最热', icon: <Flame size={14} /> },
  { key: 'newest', label: '最新', icon: <Clock size={14} /> },
  { key: 'rating', label: '评分', icon: <TrendingUp size={14} /> },
];

const SUBJECT_ICON_MAP: Record<WordbookSubject, { icon: React.ReactNode; color: string }> = {
  english: { icon: <Languages size={16} />, color: 'from-violet-500 to-indigo-500' },
  chinese: { icon: <FileText size={16} />, color: 'from-pink-500 to-rose-500' },
  math: { icon: <Calculator size={16} />, color: 'from-cyan-500 to-blue-500' },
};

const RATING_BADGE_STYLE: Record<string, { label: string; className: string }> = {
  hot: { label: '热门', className: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  featured: { label: '精选', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  quality: { label: '优质', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  normal: { label: '普通', className: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
};

const ContentMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const subjectParam = (searchParams.get('subject') as WordbookSubject) || undefined;
  const searchQuery = searchParams.get('search') || '';
  const pageParam = Number(searchParams.get('page') || '1');
  const categoryParam = (searchParams.get('category') as MarketCategory) || 'all';

  const [category, setCategory] = useState<MarketCategory>(categoryParam);
  const [subject, setSubject] = useState<'all' | WordbookSubject>(subjectParam || 'all');
  const [contentType, setContentType] = useState<WordbookContentType | 'all'>('all');
  const [sort, setSort] = useState<'hot' | 'newest' | 'rating'>('hot');
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [items, setItems] = useState<ContentMarketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(pageParam);
  const pageSize = 12;

  // 教材 / 课程列表（占位，后端接口就绪后替换）
  const [textbookItems, setTextbookItems] = useState<MarketTextbookItem[]>([]);
  const [courseItems, setCourseItems] = useState<MarketCourseItem[]>([]);
  const [textbookTotal, setTextbookTotal] = useState(0);
  const [courseTotal, setCourseTotal] = useState(0);

  const fetchWordbookList = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: contentMarketApi.MarketListParams = {
        sort,
        page,
        pageSize,
      };
      if (subject !== 'all') params.subject = subject;
      if (contentType !== 'all') params.contentType = contentType;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await contentMarketApi.getMarketList(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      logger.error('加载内容广场失败', err as Error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [subject, contentType, sort, searchQuery, page]);

  const fetchTextbookList = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: contentMarketApi.MarketTextbookListParams = {
        sort,
        page,
        pageSize,
      };
      if (subject !== 'all') params.subject = subject;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await contentMarketApi.getMarketTextbooks(params);
      setTextbookItems(res.items || []);
      setTextbookTotal(res.total || 0);
    } catch (err) {
      logger.error('加载教材市场失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [subject, sort, searchQuery, page]);

  const fetchCourseList = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: contentMarketApi.MarketCourseListParams = {
        sort,
        page,
        pageSize,
      };
      if (subject !== 'all') params.subject = subject;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await contentMarketApi.getMarketCourses(params);
      setCourseItems(res.items || []);
      setCourseTotal(res.total || 0);
    } catch (err) {
      logger.error('加载课程市场失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [subject, sort, searchQuery, page]);

  useEffect(() => {
    if (category === 'all' || category === 'wordbook') {
      void fetchWordbookList();
    }
    if (category === 'all' || category === 'textbook') {
      void fetchTextbookList();
    }
    if (category === 'all' || category === 'course') {
      void fetchCourseList();
    }
  }, [category, fetchWordbookList, fetchTextbookList, fetchCourseList]);

  const handleCategoryChange = (key: MarketCategory): void => {
    setCategory(key);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (key === 'all') next.delete('category');
    else next.set('category', key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSubjectChange = (key: 'all' | WordbookSubject): void => {
    setSubject(key);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (key === 'all') next.delete('subject');
    else next.set('subject', key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (p: number): void => {
    setPage(p);
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      const res = await contentMarketApi.toggleFavorite(id);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, favoriteCount: res.favoriteCount }
            : it,
        ),
      );
      toast.success(res.favorited ? '已收藏' : '已取消收藏');
    } catch (err) {
      logger.error('收藏失败', err as Error);
      toast.error('操作失败');
    }
  };

  const currentTotal = category === 'wordbook'
    ? total
    : category === 'textbook'
    ? textbookTotal
    : category === 'course'
    ? courseTotal
    : total;
  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));

  const renderPaginationItems = (): React.ReactNode => {
    const pages: React.ReactNode[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>,
      );
      if (start > 2) {
        pages.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === page}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    return pages;
  };

  return (
    <div className="min-h-screen text-white">
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 标题 + 分类 Tab */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500">
              内容广场
            </span>
          </h1>
           <p className="text-slate-400 text-sm">
            发现优质内容，词库/教材/课程应有尽有
          </p>
        </div>

        {/* 一级分类 Tab */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleCategoryChange(tab.key)}
                className={[
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border',
                  active
                     ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 border-transparent'
                     : 'bg-white/5 text-slate-300 border-violet-500/20 hover:border-violet-400/50 hover:text-violet-300',
                ].join(' ')}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <Input
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchInput(e.target.value)
              }
              placeholder="搜索内容名称、创作者..."
                  className="pl-11 h-12 rounded-xl bg-white/5 border-violet-500/30
                 text-white placeholder:text-slate-500
                 focus:border-cyan-400 focus:ring-cyan-400/20
                 backdrop-blur-sm shadow-lg shadow-violet-900/20"
            />
          </div>
        </form>

        {/* 学科 Tab */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUBJECT_TABS.map((tab) => {
            const active = subject === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSubjectChange(tab.key)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  active
                     ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                     : 'bg-white/5 text-slate-300 border border-violet-500/20 hover:border-violet-400/50 hover:text-violet-300',
                ].join(' ')}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 筛选行 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* 内容类型 */}
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((type) => {
              const active = contentType === type.key;
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => {
                    setContentType(type.key);
                    setPage(1);
                  }}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                       active
                         ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                         : 'bg-white/5 text-slate-400 border border-white/10 hover:border-slate-500/50 hover:text-slate-200',
                  ].join(' ')}
                >
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* 排序 */}
            <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-violet-500/20">
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSort(opt.key);
                    setPage(1);
                  }}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                       active
                         ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white'
                         : 'text-slate-400 hover:text-violet-300',
                  ].join(' ')}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 词库卡片 Grid */}
        {(category === 'all' || category === 'wordbook') && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <BookText size={18} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-white">词库</h2>
              <Badge
                variant="outline"
                className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/40"
              >
                {total} 个
              </Badge>
            </div>
            {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                 className="rounded-2xl bg-white/5 p-5 border border-violet-500/20"
              >
                 <Skeleton className="h-6 w-3/4 bg-white/10 mb-4" />
                <Skeleton className="h-4 w-1/2 bg-white/10 mb-3" />
                <Skeleton className="h-16 w-full bg-white/10 mb-4 rounded-xl" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
              </div>
            ))}
          </div>
            ) : items.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-400 rounded-2xl border border-violet-500/10 bg-white/5">
                <BookOpen size={40} className="mb-3 opacity-30" />
                <p className="text-base">暂无词库内容</p>
                <p className="text-sm mt-1">换个筛选条件试试吧</p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                data-ai-section-type="card-list"
              >
                {items.map((item) => {
              const subjInfo = SUBJECT_ICON_MAP[item.subject];
              const ratingStyle = RATING_BADGE_STYLE[item.contentRating] || RATING_BADGE_STYLE.normal;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/content-market/${item.id}`)}
                  className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20"
                   style={{
                     backgroundColor: 'rgba(255, 255, 255, 0.05)',
                     border: '1px solid rgba(255, 255, 255, 0.1)',
                     backdropFilter: 'blur(8px)',
                   }}
                 >
                   {/* 顶部角标 */}
                   <div className="absolute top-4 right-4">
                     <Badge
                       className={`text-xs border ${ratingStyle.className}`}
                     >
                       {ratingStyle.label}
                     </Badge>
                   </div>

                   {/* 学科图标 + 类型标签 */}
                   <div className="flex items-center gap-2 mb-3">
                     <div
                       className={`w-8 h-8 rounded-lg bg-gradient-to-br ${subjInfo.color} flex items-center justify-center text-white shadow-md`}
                     >
                       {subjInfo.icon}
                     </div>
                     <Badge
                       variant="outline"
                       className="text-xs bg-slate-100 border-slate-200 text-slate-600"
                     >
                       {item.contentType}
                     </Badge>
                   </div>

                   {/* 名称 */}
                    <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-violet-400 transition-colors">
                    {item.name}
                  </h3>

                  {/* 内容数量 */}
                  <div className="flex items-center gap-1 text-cyan-400 text-xs mb-4">
                    <BookMarked size={12} />
                    <span>{item.itemCount} 条内容</span>
                  </div>

                   {/* 创作者信息 */}
                   <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
                    <Avatar className="w-7 h-7 border border-violet-500/30">
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs">
                        {item.creatorName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                     <span className="text-sm text-slate-300 truncate max-w-[100px]">
                      {item.creatorName}
                    </span>
                    <Badge
                      className="ml-auto text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40"
                    >
                      <Award size={10} className="mr-0.5" />
                      LV{item.creatorLevel}
                    </Badge>
                  </div>

                   {/* 统计数据 */}
                   <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Play size={11} className="text-cyan-400" />
                      {item.learnCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={11} className="text-rose-400" />
                      {item.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400" />
                      {item.favoriteCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={11} className="text-violet-400" />
                      {item.commentCount}
                    </span>
                  </div>

                  {/* 评分星 */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={12}
                        className={
                          idx < Math.round(item.rating)
                             ? 'text-amber-400 fill-amber-400'
                             : 'text-slate-600'
                        }
                      />
                    ))}
                      <span className="ml-1 text-xs text-amber-400">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20"
                        >
                          <Play size={14} />
                          立即学习
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={(e: React.MouseEvent) => handleToggleFavorite(item.id, e)}
                           className="border-violet-500/30 text-slate-400 hover:bg-violet-500/10 hover:text-amber-400 bg-transparent"
                        >
                          <Star size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 教材卡片 Grid */}
        {(category === 'all' || category === 'textbook') && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-cyan-400" />
               <h2 className="text-lg font-semibold text-slate-800">
                 教材
               </h2>
              <Badge
                variant="outline"
                className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
              >
                {textbookTotal} 个
              </Badge>
            </div>
            {textbookItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-cyan-500/10 bg-white/5">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                  <Lock size={24} className="text-cyan-400/60" />
                </div>
                 <p className="text-base text-slate-300 font-medium">
                   教材内容市场开放中
                 </p>
                <p className="text-sm text-slate-400 mt-1">
                  敬请期待优质用户原创教材内容
                </p>
                <Badge
                  variant="outline"
                  className="mt-4 text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                >
                  <Sparkles size={10} className="mr-1" />
                  Coming Soon
                </Badge>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                data-ai-section-type="card-list"
              >
                {textbookItems.map((item: MarketTextbookItem) => {
                  const subjInfo = SUBJECT_ICON_MAP[item.subject];
                  return (
                    <div
                      key={item.id}
                      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20"
                       style={{
                         backgroundColor: 'rgba(255, 255, 255, 0.05)',
                         border: '1px solid rgba(6, 182, 212, 0.2)',
                         backdropFilter: 'blur(8px)',
                       }}
                     >
                       <div className="absolute top-4 right-4">
                         <Badge
                           variant="outline"
                           className="text-xs bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                         >
                           教材
                         </Badge>
                       </div>
                       <div className="flex items-center gap-2 mb-3">
                         <div
                           className={`w-8 h-8 rounded-lg bg-gradient-to-br ${subjInfo.color} flex items-center justify-center text-white shadow-md`}
                         >
                           {subjInfo.icon}
                         </div>
                         <Badge
                           variant="outline"
                           className="text-xs bg-slate-500/20 border-white/10 text-slate-300"
                         >
                           {item.grade}{item.semester === 'upper' ? '上册' : '下册'}
                         </Badge>
                       </div>
                       <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 text-cyan-400 text-xs mb-4">
                        <BookMarked size={12} />
                        <span>{item.totalUnits} 个单元</span>
                      </div>
                       <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                         <Avatar className="w-7 h-7 border border-cyan-500/30">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white text-xs">
                            {item.creatorName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                         <span className="text-sm text-slate-300 truncate max-w-[120px]">
                          {item.creatorName}
                        </span>
                      </div>
                       <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-cyan-400" />
                          {item.learnCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400" />
                          {item.favoriteCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20"
                        >
                          <Play size={14} />
                          立即学习
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                           className="border-cyan-500/30 text-slate-400 hover:bg-cyan-500/10 hover:text-amber-400 bg-transparent"
                        >
                          <Star size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 课程卡片 Grid */}
        {(category === 'all' || category === 'course') && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={18} className="text-fuchsia-400" />
               <h2 className="text-lg font-semibold text-slate-800">
                 课程
               </h2>
              <Badge
                variant="outline"
                className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
              >
                {courseTotal} 个
              </Badge>
            </div>
            {courseItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-fuchsia-500/10 bg-white/5">
                <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4">
                  <Lock size={24} className="text-fuchsia-400/60" />
                </div>
                 <p className="text-base text-slate-300 font-medium">
                   课程内容市场开放中
                 </p>
                <p className="text-sm text-slate-400 mt-1">
                  敬请期待优质用户原创课程内容
                </p>
                <Badge
                  variant="outline"
                  className="mt-4 text-xs bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30"
                >
                  <Sparkles size={10} className="mr-1" />
                  Coming Soon
                </Badge>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                data-ai-section-type="card-list"
              >
                {courseItems.map((item: MarketCourseItem) => {
                  const subjInfo = SUBJECT_ICON_MAP[item.subject];
                  return (
                    <div
                      key={item.id}
                     className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-500/20"
                       style={{
                         backgroundColor: 'rgba(255, 255, 255, 0.05)',
                         border: '1px solid rgba(217, 70, 239, 0.2)',
                         backdropFilter: 'blur(8px)',
                       }}
                     >
                       <div className="absolute top-4 right-4">
                         <Badge
                           variant="outline"
                           className="text-xs bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40"
                         >
                           课程
                         </Badge>
                       </div>
                       <div className="flex items-center gap-2 mb-3">
                         <div
                           className={`w-8 h-8 rounded-lg bg-gradient-to-br ${subjInfo.color} flex items-center justify-center text-white shadow-md`}
                         >
                           {subjInfo.icon}
                         </div>
                         <Badge
                           variant="outline"
                           className="text-xs bg-slate-500/20 border-white/10 text-slate-300"
                         >
                           {item.category}
                         </Badge>
                       </div>
                       <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-fuchsia-400 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 text-fuchsia-400 text-xs mb-4">
                        <Play size={12} />
                        <span>{item.totalLessons} 课时 · {item.totalMinutes} 分钟</span>
                      </div>
                       <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                         <Avatar className="w-7 h-7 border border-fuchsia-500/30">
                          <AvatarFallback className="bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white text-xs">
                            {item.creatorName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                         <span className="text-sm text-slate-300 truncate max-w-[120px]">
                          {item.creatorName}
                        </span>
                      </div>
                       <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-fuchsia-400" />
                          {item.learnCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400" />
                          {item.favoriteCount}
                        </span>
                        <span className="ml-auto font-semibold text-amber-400">
                          {item.isFree ? '免费' : `¥${item.price}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-md shadow-fuchsia-500/20"
                        >
                          <Play size={14} />
                          立即学习
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                           className="border-fuchsia-500/30 text-slate-400 hover:bg-fuchsia-500/10 hover:text-amber-400 bg-transparent"
                        >
                          <Star size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 分页（仅单分类视图显示）*/}
        {category !== 'all' && !loading && totalPages > 1 && (
          <div className="mt-10">
            <Pagination className="text-slate-300">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* 隐藏占位，避免 TS 未使用警告 */}
        <span className="hidden">
          <ChevronLeft />
          <ChevronRight />
          <Heart />
          <MessageSquare />
          <Award />
        </span>
      </div>
    </div>
  );
};

export default ContentMarketPage;
