import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { Heart, Send, MessageCircle, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  getComments,
  postComment,
  likeComment,
} from '@client/src/api/content-market';
import type { ContentComment } from '@shared/api.interface';

interface CommentSectionProps {
  wordbookId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ wordbookId }) => {
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    commentId: string;
    userName: string;
  } | null>(null);
  const pageSize = 10;
  const loadedRef = useRef(false);

  const fetchComments = useCallback(
    async (pageNum: number, append = false): Promise<void> => {
      const setLoad = append ? setLoadingMore : setLoading;
      setLoad(true);
      try {
        const res = await getComments(wordbookId, {
          page: pageNum,
          pageSize,
        });
        setTotal(res.total || 0);
        if (append) {
          setComments((prev) => [...prev, ...(res.items || [])]);
        } else {
          setComments(res.items || []);
        }
        setHasMore((res.items?.length || 0) >= pageSize);
      } catch (err) {
        logger.error('加载评论失败', err as Error);
        toast.error('加载评论失败');
      } finally {
        setLoad(false);
      }
    },
    [wordbookId],
  );

  useEffect(() => {
    if (!wordbookId || loadedRef.current) return;
    loadedRef.current = true;
    fetchComments(1);
  }, [wordbookId, fetchComments]);

  const handleLoadMore = (): void => {
    const next = page + 1;
    setPage(next);
    fetchComments(next, true);
  };

  const handleLike = async (
    commentId: string,
    isReply = false,
    parentId?: string,
  ): Promise<void> => {
    try {
      const res = await likeComment(commentId);
      setComments((prev) => {
        if (!isReply) {
          return prev.map((c) =>
            c.id === commentId
              ? { ...c, isLiked: res.liked, likeCount: res.likeCount }
              : c,
          );
        }
        return prev.map((c) => {
          if (c.id !== parentId || !c.replies) return c;
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? { ...r, isLiked: res.liked, likeCount: res.likeCount }
                : r,
            ),
          };
        });
      });
    } catch (err) {
      logger.error('评论点赞失败', err as Error);
      toast.error('操作失败');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!inputValue.trim()) {
      toast.error('请输入评论内容');
      return;
    }
    setSubmitting(true);
    try {
      const newComment = await postComment(
        wordbookId,
        inputValue.trim(),
        replyTo?.commentId,
      );
      if (replyTo) {
        // 回复加到对应父评论的 replies
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.commentId
              ? {
                  ...c,
                  replies: [...(c.replies || []), newComment],
                }
              : c,
          ),
        );
        setReplyTo(null);
      } else {
        setComments((prev) => [newComment, ...prev]);
        setTotal((t) => t + 1);
      }
      setInputValue('');
      toast.success('评论成功');
    } catch (err) {
      logger.error('发表评论失败', err as Error);
      toast.error('发表失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderComment = (
    comment: ContentComment,
    isReply = false,
    parentId?: string,
  ): React.ReactNode => (
    <div
      key={comment.id}
      className={[
        'flex gap-3',
        isReply ? 'pl-10 pt-3 border-l-2 border-violet-500/20' : '',
      ].join(' ')}
    >
      <Avatar className="w-9 h-9 flex-shrink-0 border border-violet-500/30">
        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs">
          {comment.userName?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-200">
            {comment.userName}
          </span>
          <span className="text-xs text-slate-500">
            {formatTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-slate-300 mb-2 break-words">
          {comment.content}
        </p>
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => handleLike(comment.id, isReply, parentId)}
            className={[
              'flex items-center gap-1 transition-colors',
              comment.isLiked
                ? 'text-rose-400'
                : 'text-slate-500 hover:text-rose-400',
            ].join(' ')}
          >
            <Heart size={12} className={comment.isLiked ? 'fill-current' : ''} />
            {comment.likeCount || ''}
          </button>
          {!isReply && (
            <button
              type="button"
              onClick={() =>
                setReplyTo({
                  commentId: comment.id,
                  userName: comment.userName,
                })
              }
              className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <MessageCircle size={12} />
              回复
            </button>
          )}
        </div>

        {/* 子回复列表 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) =>
              renderComment(reply, true, comment.id),
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 评论输入 */}
      <div
        className="p-4 rounded-2xl"
        style={{
          backgroundColor: 'rgba(26, 22, 53, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        {replyTo && (
          <div className="flex items-center justify-between mb-2 text-xs text-cyan-400">
            <span>回复 @{replyTo.userName}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              取消回复
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0 border border-violet-500/30">
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-cyan-600 text-white text-xs">
              我
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setInputValue(e.target.value)
              }
              placeholder="说点什么吧..."
              className="min-h-[80px] bg-slate-900/60 border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !inputValue.trim()}
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-md shadow-violet-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    发送中
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-1" />
                    发表评论
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论总数 */}
      <div className="flex items-center gap-2">
        <MessageCircle size={16} className="text-violet-400" />
        <span className="text-sm font-medium text-slate-300">
          全部评论
          <span className="text-cyan-400 ml-1">({total})</span>
        </span>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-full bg-slate-700/50 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 bg-slate-700/50" />
                <Skeleton className="h-4 w-full bg-slate-700/50" />
                <Skeleton className="h-4 w-3/4 bg-slate-700/50" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <MessageCircle size={40} className="mb-3 opacity-30" />
          <p className="text-sm">还没有评论，来抢沙发吧</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => renderComment(comment))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-violet-500/30 text-slate-300 hover:bg-violet-500/10 bg-transparent"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    加载中...
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} className="mr-2" />
                    加载更多
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
