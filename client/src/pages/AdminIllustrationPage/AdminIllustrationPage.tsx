import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  ImageIcon,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import {
  getStats,
  getIllustrations,
  approveIllustration,
  rejectIllustration,
  batchReview,
  deleteIllustration,
} from '@client/src/api/admin-illustration';
import { regenerateIllustration } from '@client/src/api/ai-illustration';
import type {
  AiIllustration,
  IllustrationStats,
  IllustrationStatus,
  IllustrationContentType,
} from '@shared/api.interface';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Badge } from '@client/src/components/ui/badge';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Card, CardContent } from '@client/src/components/ui/card';
import Image from '@client/src/components/ui/image';
import { showConfirm } from '@lark-apaas/client-toolkit';

const STATUS_LABELS: Record<IllustrationStatus, string> = {
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

  const STATUS_BADGE_CLASSES: Record<IllustrationStatus, string> = {
   pending_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
   approved: 'bg-green-500/20 text-green-300 border-green-500/30',
   rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
 };

const CONTENT_TYPE_LABELS: Record<IllustrationContentType, string> = {
  word: '单词',
  sentence: '句子',
};

interface StatCardProps {
  label: string;
  value: number;
  colorClass: string;
}

function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
       <Card className="glass-card">
       <CardContent className="p-5">
         <div className="text-sm text-slate-400 mb-1">{label}</div>
        <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

interface IllustrationCardProps {
  item: AiIllustration;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (item: AiIllustration) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  regenerating: boolean;
}

function IllustrationCard({
  item,
  selected,
  onToggleSelect,
  onPreview,
  onApprove,
  onReject,
  onRegenerate,
  onDelete,
  regenerating,
}: IllustrationCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleImgError = () => {
    setImgError(true);
  };

  return (
    <div className="relative group rounded-xl glass-card transition-all overflow-hidden">
      {/* 复选框 */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(item.id)}
           className="bg-white/10 border-white/20"
        />
      </div>

      {/* hover 操作按钮 */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApprove(item.id);
          }}
          className="flex items-center justify-center size-8 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
          title="通过"
        >
          <CheckCircle2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReject(item.id);
          }}
          className="flex items-center justify-center size-8 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="拒绝"
        >
          <XCircle className="size-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate(item.id);
          }}
          disabled={regenerating}
          className="flex items-center justify-center size-8 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          title="重新生成"
        >
          <RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="flex items-center justify-center size-8 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
          title="删除"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* 图片区域 */}
      <div
         className="aspect-square cursor-pointer overflow-hidden bg-white/5"
        onClick={() => onPreview(item)}
      >
        {imgError || !item.imageUrl ? (
           <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <ImageIcon className="size-12 mb-2" />
            <span className="text-xs">图片加载失败</span>
          </div>
        ) : (
          <Image
            src={item.imageUrl}
            alt={item.contentText}
            className="w-full h-full object-cover"
            onError={handleImgError}
            width={400}
            height={400}
          />
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3 space-y-2">
         <div className="text-sm font-medium text-white line-clamp-2">
          {item.contentText}
        </div>
        {item.translation && (
           <div className="text-xs text-slate-400 line-clamp-1">
            {item.translation}
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={STATUS_BADGE_CLASSES[item.status]}
          >
            {STATUS_LABELS[item.status]}
          </Badge>
           <span className="text-xs text-slate-500">
            {CONTENT_TYPE_LABELS[item.contentType]}
          </span>
        </div>
         <div className="text-xs text-slate-500">
          {new Date(item.createdAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

const AdminIllustrationPage: React.FC = () => {
  // 统计数据
  const [stats, setStats] = useState<IllustrationStats>({
    total: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // 列表数据
  const [items, setItems] = useState<AiIllustration[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // 筛选条件
  const [contentType, setContentType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 分页
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // 选中
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 预览弹窗
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AiIllustration | null>(null);

  // 重新生成中
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(
    new Set(),
  );

  // 批量操作 loading
  const [batchLoading, setBatchLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  // 加载统计
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      logger.error('加载插图统计失败', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 加载列表
  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params: {
        page: number;
        pageSize: number;
        contentType?: string;
        status?: string;
        keyword?: string;
      } = {
        page,
        pageSize,
      };
      if (contentType !== 'all') params.contentType = contentType;
      if (status !== 'all') params.status = status;
      if (keyword) params.keyword = keyword;

      const data = await getIllustrations(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('加载插图列表失败', err);
      setListError('加载失败，请稍后重试');
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize, contentType, status, keyword]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 筛选变化回到第一页
  const handleContentTypeChange = (val: string) => {
    setContentType(val);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
    setSelectedIds(new Set());
  };

  // 单选切换
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全选 / 取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((it: AiIllustration) => it.id)));
    }
  };

  // 单张通过
  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await approveIllustration(id);
        toast.success('审核通过');
        await Promise.all([loadList(), loadStats()]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        logger.error('审核通过失败', err);
        toast.error('操作失败');
      }
    },
    [loadList, loadStats],
  );

  // 单张拒绝
  const handleReject = useCallback(
    async (id: string) => {
      try {
        await rejectIllustration(id);
        toast.success('已拒绝');
        await Promise.all([loadList(), loadStats()]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        logger.error('拒绝失败', err);
        toast.error('操作失败');
      }
    },
    [loadList, loadStats],
  );

  // 重新生成
  const handleRegenerate = useCallback(
    async (id: string) => {
      setRegeneratingIds((prev) => new Set(prev).add(id));
      try {
        await regenerateIllustration(id);
        toast.success('重新生成任务已提交');
        await loadList();
      } catch (err) {
        logger.error('重新生成失败', err);
        toast.error('重新生成失败');
      } finally {
        setRegeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [loadList],
  );

  // 删除
  const handleDelete = useCallback(
    async (id: string) => {
      if (!await showConfirm('确定要删除这张插图吗？')) return;
      try {
        await deleteIllustration(id);
        toast.success('已删除');
        await Promise.all([loadList(), loadStats()]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        logger.error('删除失败', err);
        toast.error('删除失败');
      }
    },
    [loadList, loadStats],
  );

  // 批量通过
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      toast.warning('请先选择要审核的插图');
      return;
    }
    setBatchLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await batchReview({ ids, action: 'approve' });
      toast.success(`已批量通过 ${ids.length} 张插图`);
      await Promise.all([loadList(), loadStats()]);
      setSelectedIds(new Set());
    } catch (err) {
      logger.error('批量通过失败', err);
      toast.error('批量操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 批量拒绝
  const handleBatchReject = async () => {
    if (selectedIds.size === 0) {
      toast.warning('请先选择要审核的插图');
      return;
    }
    setBatchLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await batchReview({ ids, action: 'reject' });
      toast.success(`已批量拒绝 ${ids.length} 张插图`);
      await Promise.all([loadList(), loadStats()]);
      setSelectedIds(new Set());
    } catch (err) {
      logger.error('批量拒绝失败', err);
      toast.error('批量操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 预览
  const handlePreview = (item: AiIllustration) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      setSelectedIds(new Set());
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      setSelectedIds(new Set());
    }
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div>
         <h1 className="text-xl font-semibold text-white">插图审核管理</h1>
         <p className="text-sm text-slate-400 mt-1">
          审核AI生成的单词和句子插图，确保内容质量
        </p>
      </div>

      {/* 统计卡片 */}
      <div
        data-ai-section-type="card-stat"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          label="总插图数"
          value={stats.total}
          colorClass="text-[#4361EE]"
        />
        <StatCard
          label="待审核"
          value={stats.pendingReview}
          colorClass="text-amber-600"
        />
        <StatCard
          label="已通过"
          value={stats.approved}
          colorClass="text-green-600"
        />
        <StatCard
          label="已拒绝"
          value={stats.rejected}
          colorClass="text-red-500"
        />
      </div>

      {/* 筛选工具栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
               <span className="text-sm text-slate-400 whitespace-nowrap">
                内容类型：
              </span>
              <Select value={contentType} onValueChange={handleContentTypeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="word">单词</SelectItem>
                  <SelectItem value="sentence">句子</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
               <span className="text-sm text-slate-400 whitespace-nowrap">
                状态：
              </span>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending_review">待审核</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  placeholder="搜索单词或句子内容"
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="default"
                onClick={handleBatchApprove}
                disabled={selectedIds.size === 0 || batchLoading}
                className="bg-green-500 hover:bg-green-600 border-green-500"
              >
                {batchLoading && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                批量通过 ({selectedIds.size})
              </Button>
              <Button
                variant="destructive"
                onClick={handleBatchReject}
                disabled={selectedIds.size === 0 || batchLoading}
              >
                {batchLoading && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                批量拒绝 ({selectedIds.size})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 全选栏 */}
      {items.length > 0 && (
         <div className="flex items-center gap-2 text-sm text-slate-400">
          <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
          <span>
            全选当前页 ({selectedIds.size}/{items.length})
          </span>
        </div>
      )}

      {/* 插图网格 */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
           <span className="ml-2 text-slate-400">加载中...</span>
        </div>
      ) : listError ? (
         <div className="flex flex-col items-center justify-center py-20 text-slate-400">
           <XCircle className="size-12 mb-3 text-red-400" />
          <p>{listError}</p>
          <Button variant="outline" className="mt-4" onClick={loadList}>
            重试
          </Button>
        </div>
      ) : items.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 text-slate-500">
           <ImageIcon className="size-16 mb-3" />
           <p className="text-base text-slate-400">暂无插图</p>
           <p className="text-sm mt-1 text-slate-500">调整筛选条件或稍后再试</p>
        </div>
      ) : (
        <div
          data-ai-section-type="card-list"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {items.map((item: AiIllustration) => (
            <IllustrationCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggleSelect={handleToggleSelect}
              onPreview={handlePreview}
              onApprove={handleApprove}
              onReject={handleReject}
              onRegenerate={handleRegenerate}
              onDelete={handleDelete}
              regenerating={regeneratingIds.has(item.id)}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 0 && (
           <div className="flex items-center justify-between pt-4 border-t border-white/10">
           <div className="text-sm text-slate-400">
            共 {total} 条，第 {page}/{totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages}
            >
              下一页
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>插图详情</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
               <div className="aspect-square max-h-[500px] mx-auto rounded-lg overflow-hidden bg-white/5">
                {previewItem.imageUrl ? (
                  <Image
                    src={previewItem.imageUrl}
                    alt={previewItem.contentText}
                    className="w-full h-full object-contain"
                    width={800}
                    height={800}
                  />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <ImageIcon className="size-16" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                   <span className="text-slate-400">内容类型：</span>
                   <span className="text-white">
                    {CONTENT_TYPE_LABELS[previewItem.contentType]}
                  </span>
                </div>
                <div>
                   <span className="text-slate-400">状态：</span>
                  <Badge
                    variant="secondary"
                    className={STATUS_BADGE_CLASSES[previewItem.status]}
                  >
                    {STATUS_LABELS[previewItem.status]}
                  </Badge>
                </div>
                <div className="col-span-2">
                   <span className="text-slate-400">内容：</span>
                   <span className="text-white ml-1">
                    {previewItem.contentText}
                  </span>
                </div>
                {previewItem.translation && (
                  <div className="col-span-2">
                     <span className="text-slate-400">翻译：</span>
                     <span className="text-white ml-1">
                      {previewItem.translation}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                   <span className="text-slate-400">风格：</span>
                   <span className="text-white ml-1">
                    {previewItem.stylePreset}
                  </span>
                </div>
                <div className="col-span-2">
                   <div className="text-slate-400 mb-1">Prompt：</div>
                   <div className="text-slate-300 bg-white/5 border border-white/10 p-3 rounded-md text-xs line-clamp-4">
                    {previewItem.prompt}
                  </div>
                </div>
                <div>
                   <span className="text-slate-400">生成时间：</span>
                   <span className="text-white">
                    {new Date(previewItem.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                {previewItem.reviewedAt && (
                  <div>
                     <span className="text-slate-400">审核时间：</span>
                     <span className="text-white">
                      {new Date(previewItem.reviewedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
                {previewItem.reviewNote && (
                  <div className="col-span-2">
                     <span className="text-slate-400">审核备注：</span>
                     <span className="text-white ml-1">
                      {previewItem.reviewNote}
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-row gap-2 justify-end">
                <Button
                  variant="default"
                  onClick={() => {
                    handleApprove(previewItem.id);
                    setPreviewOpen(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 border-green-500"
                >
                  <CheckCircle2 className="size-4" />
                  通过
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(previewItem.id);
                    setPreviewOpen(false);
                  }}
                >
                  <XCircle className="size-4" />
                  拒绝
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleRegenerate(previewItem.id);
                    setPreviewOpen(false);
                  }}
                >
                  <RefreshCw className="size-4" />
                  重新生成
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDelete(previewItem.id);
                    setPreviewOpen(false);
                  }}
                >
                  <Trash2 className="size-4" />
                  删除
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminIllustrationPage;
