import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Heart,
  Star,
  Share2,
  Flag,
  Play,
  BookMarked,
  Users,
  MessageSquare,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  Languages,
  FileText,
  Calculator,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { Skeleton } from '@client/src/components/ui/skeleton';
import ReportDialog from './components/ReportDialog';
import CommentSection from './components/CommentSection';
import CopyToWordbookDialog from './components/CopyToWordbookDialog';
import {
  getMarketDetail,
  toggleLike,
  toggleFavorite,
  copyToMyWordbook,
} from '@client/src/api/content-market';
import type {
  ContentDetail,
  UserWordbookItem,
  WordbookSubject,
  WordbookContentType,
} from '@shared/api.interface';

const SUBJECT_ICON_MAP: Record<WordbookSubject, { icon: React.ReactNode; color: string; label: string }> = {
  english: { icon: <Languages size={16} />, color: 'from-violet-500 to-indigo-500', label: '英语' },
  chinese: { icon: <FileText size={16} />, color: 'from-pink-500 to-rose-500', label: '语文' },
  math: { icon: <Calculator size={16} />, color: 'from-cyan-500 to-blue-500', label: '数学' },
};

const CONTENT_TYPE_LABEL: Record<WordbookContentType, string> = {
  word: '单词',
  sentence: '句子',
  character: '汉字',
  phrase: '短语',
  formula: '公式',
  question: '题目',
};

const RATING_BADGE_STYLE: Record<string, { label: string; className: string }> = {
  hot: { label: '热门', className: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  featured: { label: '精选', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  quality: { label: '优质', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  normal: { label: '普通', className: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
};

const PREVIEW_COUNT = 5;

const ContentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [reportOpen, setReportOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copyResult, setCopyResult] = useState<{
    success: boolean;
    wordbookId?: string;
    copiedCount?: number;
  } | null>(null);

  const fetchDetail = useCallback(async (): Promise<void> => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getMarketDetail(id);
      setDetail(res);
    } catch (err) {
      logger.error('加载内容详情失败', err as Error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleLike = async (): Promise<void> => {
    if (!detail) return;
    setActionLoading('like');
    try {
      const res = await toggleLike(detail.id);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              isLiked: res.liked,
              likeCount: res.likeCount,
            }
          : prev,
      );
      toast.success(res.liked ? '已点赞' : '已取消点赞');
    } catch (err) {
      logger.error('点赞失败', err as Error);
      toast.error('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFavorite = async (): Promise<void> => {
    if (!detail) return;
    setActionLoading('favorite');
    try {
      const res = await toggleFavorite(detail.id);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              isFavorited: res.favorited,
              favoriteCount: res.favoriteCount,
            }
          : prev,
      );
      toast.success(res.favorited ? '已收藏' : '已取消收藏');
    } catch (err) {
      logger.error('收藏失败', err as Error);
      toast.error('操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!detail) return;
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制到剪贴板');
    } catch (err) {
      logger.error('复制链接失败', err as Error);
      toast.error('复制链接失败');
    }
  };

  const handleCopyToWordbook = async (data: {
    wordbookId?: string;
    wordbookName?: string;
  }): Promise<void> => {
    if (!detail) return;
    setActionLoading('copy');
    try {
      const res = await copyToMyWordbook(detail.id, {
        wordbookId: data.wordbookId,
        wordbookName: data.wordbookName,
        subject: detail.subject,
      });
      setCopyResult(res);
      toast.success(
        `已复制 ${res.copiedCount || detail.itemCount} 条到我的词库`,
      );
      setCopyDialogOpen(false);
    } catch (err) {
      logger.error('复制到词库失败', err as Error);
      toast.error('复制失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const subjInfo = detail ? SUBJECT_ICON_MAP[detail.subject] : null;
  const ratingStyle = detail
    ? RATING_BADGE_STYLE[detail.contentRating] || RATING_BADGE_STYLE.normal
    : RATING_BADGE_STYLE.normal;

  const renderPreviewItem = (item: UserWordbookItem, index: number): React.ReactNode => (
    <div
      key={item.id}
      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-violet-500/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-300 flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
                 <div className="text-sm text-slate-800 font-medium mb-1">
            {item.content}
            {item.extra?.phonetic && (
              <span className="ml-2 text-xs text-slate-500">
                /{item.extra.phonetic}/
              </span>
            )}
          </div>
          {(item.answer || item.extra?.translation) && (
            <div className="text-sm text-cyan-400">
              {item.answer || item.extra?.translation}
            </div>
          )}
          {item.extra?.pinyin && (
             <div className="text-xs text-violet-600 mt-1">
              {item.extra.pinyin}
            </div>
          )}
          {item.extra?.formula && (
             <div className="text-sm text-amber-600 font-mono mt-1">
              {item.extra.formula}
            </div>
          )}
          {item.example && (
             <div className="text-xs text-slate-500 mt-2 italic">
              例：{item.example}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{ backgroundColor: '#EEF2FF' }}
    >
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* 顶部返回 */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-violet-700 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={18} />
          <span>返回列表</span>
        </button>

        {loading ? (
          <div className="space-y-6">
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(26, 22, 53, 0.7)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <Skeleton className="h-6 w-1/3 bg-slate-700/50 mb-4" />
              <Skeleton className="h-8 w-2/3 bg-slate-700/50 mb-4" />
              <Skeleton className="h-4 w-1/2 bg-slate-700/50" />
            </div>
            <Skeleton className="h-12 w-full bg-slate-700/50 rounded-xl" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full bg-slate-700/50 rounded-xl" />
              ))}
            </div>
          </div>
        ) : !detail ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <BookOpen size={48} className="mb-4 opacity-30" />
            <p className="text-lg">内容不存在或已被删除</p>
            <Button
              variant="outline"
                 className="mt-4 border-slate-300 text-slate-600"
              onClick={() => navigate('/content-market')}
            >
              返回广场
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 主信息卡 */}
            <div
              className="relative rounded-2xl p-6 overflow-hidden"
               style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.9)',
                 border: '1px solid rgba(99, 102, 241, 0.2)',
                 backdropFilter: 'blur(8px)',
               }}
             >
               {/* 装饰光晕 */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-violet-600/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl" />

              <div className="relative">
                {/* 顶部标签行 */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {subjInfo && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white bg-gradient-to-r ${subjInfo.color} shadow-md`}>
                      {subjInfo.icon}
                      {subjInfo.label}
                    </div>
                  )}
                   <Badge
                     variant="outline"
                     className="text-xs bg-slate-100 border-slate-200 text-slate-600"
                   >
                     {CONTENT_TYPE_LABEL[detail.contentType] || detail.contentType}
                  </Badge>
                  <Badge
                    className={`text-xs border ${ratingStyle.className}`}
                  >
                    {ratingStyle.label}
                  </Badge>
                </div>

                {/* 标题 */}
                 <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 leading-tight">
                  {detail.name}
                </h1>

                {/* 描述 */}
                {detail.description && (
                   <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {detail.description}
                  </p>
                )}

                {/* 创作者信息 */}
                 <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-200">
                  <Avatar className="w-10 h-10 border-2 border-violet-500/40">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                      {detail.creatorName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium text-slate-800">
                        {detail.creatorName}
                      </span>
                       <Badge className="text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-500/40">
                        <Award size={10} className="mr-0.5" />
                        LV{detail.creatorLevel}
                      </Badge>
                       <Badge className="text-[10px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-600 border-cyan-500/40">
                        信用 {detail.creditLevel}
                      </Badge>
                    </div>
                     <div className="text-xs text-slate-400 mt-0.5">
                      创作者
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={14}
                        className={
                          idx < Math.round(detail.rating)
                             ? 'fill-current'
                             : 'text-slate-300 fill-none'
                        }
                      />
                    ))}
                     <span className="ml-1 text-sm font-medium text-amber-600">
                      {detail.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* 统计信息栏 */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
                  <StatItem icon={<BookMarked size={14} />} label="内容数量" value={detail.itemCount} color="text-cyan-400" />
                  <StatItem icon={<Play size={14} />} label="学习次数" value={detail.learnCount} color="text-violet-400" />
                  <StatItem icon={<Heart size={14} />} label="点赞" value={detail.likeCount} color="text-rose-400" />
                  <StatItem icon={<Star size={14} />} label="收藏" value={detail.favoriteCount} color="text-amber-400" />
                  <StatItem icon={<MessageSquare size={14} />} label="评论" value={detail.commentCount} color="text-pink-400" />
                  <StatItem icon={<TrendingUp size={14} />} label="评分" value={detail.rating.toFixed(1)} color="text-emerald-400" />
                </div>

                {/* 操作按钮组 */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/30"
                  >
                    <Play size={16} />
                    立即学习
                  </Button>
                   <Button
                     variant="outline"
                     onClick={() => setCopyDialogOpen(true)}
                     className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 bg-transparent"
                   >
                    <Copy size={16} />
                    收藏到我的词库
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleLike}
                    disabled={actionLoading === 'like'}
                    className={[
                       'border-rose-500/40 hover:bg-rose-500/10 bg-transparent',
                       detail.isLiked ? 'text-rose-500' : 'text-slate-600',
                    ].join(' ')}
                  >
                    {actionLoading === 'like' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Heart size={16} className={detail.isLiked ? 'fill-current' : ''} />
                    )}
                    {detail.isLiked ? '已点赞' : '点赞'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    disabled={actionLoading === 'favorite'}
                    className={[
                       'border-violet-500/40 hover:bg-violet-500/10 bg-transparent',
                       detail.isFavorited ? 'text-amber-500' : 'text-slate-600',
                    ].join(' ')}
                  >
                    {actionLoading === 'favorite' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Star size={16} className={detail.isFavorited ? 'fill-current' : ''} />
                    )}
                    {detail.isFavorited ? '已收藏' : '收藏'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                     className="border-cyan-500/40 text-cyan-600 hover:bg-cyan-500/10 bg-transparent"
                  >
                    <Share2 size={16} />
                    分享
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setReportOpen(true)}
                     className="text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 ml-auto"
                  >
                    <Flag size={14} />
                    举报
                  </Button>
                </div>
              </div>
            </div>

            {/* Tab 内容 */}
            <div
              className="rounded-2xl p-6"
               style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.85)',
                 border: '1px solid rgba(99, 102, 241, 0.12)',
               }}
             >
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="bg-slate-100 border border-slate-200 p-1">
                  <TabsTrigger
                    value="preview"
                     className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg text-slate-600"
                  >
                    <Sparkles size={14} className="mr-1.5" />
                    内容预览
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                     className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg text-slate-600"
                  >
                    <MessageSquare size={14} className="mr-1.5" />
                    评论区 ({detail.commentCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-5">
                  <div className="mb-4 flex items-center justify-between">
                     <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <BookOpen size={16} className="text-cyan-400" />
                      内容预览
                       <span className="text-xs text-slate-400 font-normal">
                        （共 {detail.itemCount} 条，展示前 {Math.min(PREVIEW_COUNT, detail.items?.length || 0)} 条）
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {(detail.items || []).slice(0, PREVIEW_COUNT).map((item, idx) =>
                      renderPreviewItem(item, idx),
                    )}
                    {detail.itemCount > PREVIEW_COUNT && (
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 text-center">
                         <p className="text-sm text-slate-600 mb-3">
                          还有 <span className="text-cyan-400 font-semibold">{detail.itemCount - PREVIEW_COUNT}</span> 条精彩内容
                        </p>
                        <Button
                          className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-md shadow-violet-500/20"
                        >
                          <Play size={14} className="mr-1.5" />
                          进入学习查看全部
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-5">
                  {id && <CommentSection wordbookId={id} />}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* 隐藏占位，避免 TS 未使用警告 */}
        <span className="hidden">
          <Users />
          <Check />
        </span>
      </div>

      {/* 收藏到词库弹窗 */}
      {detail && (
        <CopyToWordbookDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          subject={detail.subject}
          itemCount={detail.itemCount}
          onConfirm={handleCopyToWordbook}
          loading={actionLoading === 'copy'}
        />
      )}

      {/* 举报弹窗 */}
      {id && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          contentType="wordbook"
          contentId={id}
        />
      )}
    </div>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color }) => (
  <div className="text-center p-3 rounded-xl bg-slate-100 border border-slate-200">
    <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
      {icon}
       <span className="text-base font-bold text-slate-800">{value}</span>
    </div>
     <div className="text-xs text-slate-500">{label}</div>
  </div>
);


export default ContentDetailPage;
