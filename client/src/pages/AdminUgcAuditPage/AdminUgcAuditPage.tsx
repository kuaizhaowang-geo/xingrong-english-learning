import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Search,
  BookOpen,
  BookText,
  GraduationCap,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@client/src/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Textarea } from '@client/src/components/ui/textarea';
import { Spinner } from '@client/src/components/ui/spinner';
import { useAdminAuth } from '@client/src/contexts/AdminAuthContext';
import type {
  UgcAuditItem,
  UgcAuditDetail,
  UgcContentType,
  UgcAuditStatus,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

const TYPE_TABS: { key: UgcContentType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <ShieldCheck size={16} /> },
  { key: 'wordbook', label: '词库', icon: <BookText size={16} /> },
  { key: 'textbook', label: '教材', icon: <BookOpen size={16} /> },
  { key: 'course', label: '课程', icon: <GraduationCap size={16} /> },
];

const STATUS_OPTIONS: { value: UgcAuditStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const TYPE_LABEL_MAP: Record<UgcContentType, string> = {
  wordbook: '词库',
  textbook: '教材',
  course: '课程',
};

const SUBJECT_LABEL_MAP: Record<string, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

const subjectLabel = (s: string): string => SUBJECT_LABEL_MAP[s] ?? s;

const statusBadgeClass = (status: UgcAuditStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'approved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const statusLabel = (status: UgcAuditStatus): string => {
  switch (status) {
    case 'pending':
      return '待审核';
    case 'approved':
      return '已通过';
    case 'rejected':
      return '已拒绝';
    default:
      return status;
  }
};

const formatTime = (time: string): string => {
  if (!time) return '-';
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return time;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
};

const AdminUgcAuditPage: React.FC = () => {
  const { admin } = useAdminAuth();

  const [type, setType] = useState<UgcContentType | 'all'>('all');
  const [status, setStatus] = useState<UgcAuditStatus | 'all'>('pending');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UgcAuditItem[]>([]);
  const [total, setTotal] = useState(0);

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<UgcAuditDetail | null>(null);

  // 拒绝弹窗
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<UgcAuditItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const isReviewer =
    admin?.role === 'super_admin' ||
    admin?.role === 'content_admin' ||
    admin?.role === 'reviewer';

  // ===== 数据加载 =====
  const loadList = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: {
        type: UgcContentType | 'all';
        status?: UgcAuditStatus;
        page: number;
        pageSize: number;
        keyword?: string;
      } = {
        type,
        page,
        pageSize,
      };
      if (status !== 'all') params.status = status;
      if (keyword.trim()) params.keyword = keyword.trim();

      const data = await adminApi.getUgcAuditList(params);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      logger.error('Failed to load UGC audit list', { error: String(err) });
      toast.error('加载审核列表失败');
    } finally {
      setLoading(false);
    }
  }, [type, status, keyword, page, pageSize]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ===== 事件处理 =====
  const handleTypeChange = (val: string): void => {
    setType(val as UgcContentType | 'all');
    setPage(1);
  };

  const handleStatusChange = (val: string): void => {
    setStatus(val as UgcAuditStatus | 'all');
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handlePageSizeChange = (val: string): void => {
    setPageSize(Number(val));
    setPage(1);
  };

  const handleViewDetail = async (item: UgcAuditItem): Promise<void> => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await adminApi.getUgcAuditDetail(item.type, item.id);
      setDetail(data);
    } catch (err) {
      logger.error('Failed to load UGC detail', { error: String(err) });
      toast.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (item: UgcAuditItem): Promise<void> => {
    try {
      await adminApi.approveUgc(item.type, item.id);
      toast.success('审核通过');
      void loadList();
    } catch (err) {
      logger.error('Failed to approve UGC', { error: String(err) });
      toast.error('操作失败');
    }
  };

  const openRejectDialog = (item: UgcAuditItem): void => {
    setRejectTarget(item);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleRejectSubmit = async (): Promise<void> => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('请填写拒绝原因');
      return;
    }
    setRejectSubmitting(true);
    try {
      await adminApi.rejectUgc(
        rejectTarget.type,
        rejectTarget.id,
        rejectReason.trim(),
      );
      toast.success('已拒绝');
      setRejectOpen(false);
      setRejectTarget(null);
      void loadList();
    } catch (err) {
      logger.error('Failed to reject UGC', { error: String(err) });
      toast.error('操作失败');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleOffline = async (item: UgcAuditItem): Promise<void> => {
    try {
      await adminApi.offlineUgc(item.type, item.id);
      toast.success('已下架');
      void loadList();
    } catch (err) {
      logger.error('Failed to offline UGC', { error: String(err) });
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">内容审核</h1>
          <p className="text-sm text-gray-500 mt-1">
            审核用户提交的 UGC 内容，包括词库、教材、课程
          </p>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#4361EE]" />
              审核列表
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* 类型 Tab */}
          <Tabs
            value={type}
            onValueChange={handleTypeChange}
            className="mb-4"
          >
            <TabsList className="bg-gray-100 p-1">
              {TYPE_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="data-[state=active]:bg-[#4361EE] data-[state=active]:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    {tab.icon}
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* 筛选行 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchInput(e.target.value)
                }
                placeholder="搜索内容名称、作者..."
                className="pl-9 w-64 h-9"
              />
            </form>

            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <span>每页</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>条</span>
            </div>
          </div>

          {/* 表格 */}
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-20">类型</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-28">作者</TableHead>
                  <TableHead className="w-24">学科</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-40">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      提交时间
                    </div>
                  </TableHead>
                  <TableHead className="w-56 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                      暂无审核内容
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: UgcAuditItem) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-[#4361EE]/5 text-[#4361EE] border-[#4361EE]/20"
                        >
                          {TYPE_LABEL_MAP[item.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-[#1A1A2E]">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {item.authorName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {subjectLabel(item.subject)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(item.status)}
                        >
                          {statusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatTime(item.submitTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(item)}
                            className="text-gray-600 hover:text-[#4361EE] h-8"
                          >
                            <Eye size={14} className="mr-1" />
                            详情
                          </Button>
                          {isReviewer && item.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(item)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8"
                              >
                                <Check size={14} className="mr-1" />
                                通过
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRejectDialog(item)}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8"
                              >
                                <X size={14} className="mr-1" />
                                拒绝
                              </Button>
                            </>
                          )}
                          {isReviewer && item.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOffline(item)}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8"
                            >
                              下架
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                共 {total} 条
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>内容详情</DialogTitle>
            <DialogDescription>
              查看提交的内容详细信息
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-12 text-center">
              <Spinner className="mx-auto" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">类型</div>
                  <Badge
                    variant="outline"
                    className="bg-[#4361EE]/5 text-[#4361EE] border-[#4361EE]/20"
                  >
                    {TYPE_LABEL_MAP[detail.type]}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">学科</div>
                  <span className="text-[#1A1A2E]">
                    {subjectLabel(detail.subject)}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">名称</div>
                  <div className="text-[#1A1A2E] font-medium">{detail.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">作者</div>
                  <div className="text-[#1A1A2E]">{detail.authorName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">提交时间</div>
                  <div className="text-[#1A1A2E]">
                    {formatTime(detail.submitTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">状态</div>
                  <Badge
                    variant="outline"
                    className={statusBadgeClass(detail.status)}
                  >
                    {statusLabel(detail.status)}
                  </Badge>
                </div>
              </div>
              {detail.description && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">简介</div>
                  <div className="text-[#1A1A2E] bg-gray-50 rounded-lg p-3">
                    {detail.description}
                  </div>
                </div>
              )}
              {detail.rejectReason && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">拒绝原因</div>
                  <div className="text-rose-600 bg-rose-50 rounded-lg p-3">
                    {detail.rejectReason}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  内容列表（共 {detail.itemCount} 条）
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                  {(detail.items || []).length === 0 ? (
                    <div className="py-6 text-center text-gray-400 text-sm">
                      暂无内容
                    </div>
                  ) : (
                    (detail.items as Array<Record<string, unknown>>).map(
                      (it: Record<string, unknown>, idx: number) => (
                        <div
                          key={idx}
                          className="px-3 py-2 text-sm border-b border-gray-50 last:border-b-0"
                        >
                          <span className="text-gray-400 mr-2">
                            {idx + 1}.
                          </span>
                          <span className="text-[#1A1A2E]">
                            {String((it as { content?: string; word?: string; title?: string; name?: string }).content ?? (it as { content?: string; word?: string; title?: string; name?: string }).word ?? (it as { content?: string; word?: string; title?: string; name?: string }).title ?? (it as { content?: string; word?: string; title?: string; name?: string }).name ?? '-')}
                          </span>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
            {isReviewer && detail && detail.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => {
                    setDetailOpen(false);
                    if (detail) openRejectDialog(detail as unknown as UgcAuditItem);
                  }}
                >
                  <X size={14} className="mr-1" />
                  拒绝
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={async () => {
                    if (detail) {
                      await handleApprove(detail as unknown as UgcAuditItem);
                      setDetailOpen(false);
                    }
                  }}
                >
                  <Check size={14} className="mr-1" />
                  通过
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝弹窗 */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>拒绝审核</DialogTitle>
            <DialogDescription>
              请填写拒绝原因，提交后作者将收到通知
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {rejectTarget && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="text-gray-500">内容：</span>
                <span className="text-[#1A1A2E] font-medium">
                  {rejectTarget.name}
                </span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-[#4361EE]/5 text-[#4361EE] border-[#4361EE]/20"
                >
                  {TYPE_LABEL_MAP[rejectTarget.type]}
                </Badge>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] mb-1.5 block">
                拒绝原因 <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRejectReason(e.target.value)
                }
                placeholder="请填写具体的拒绝原因，帮助作者改进..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleRejectSubmit}
              disabled={rejectSubmitting}
            >
              {rejectSubmitting && <Spinner className="mr-1 w-4 h-4" />}
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUgcAuditPage;
