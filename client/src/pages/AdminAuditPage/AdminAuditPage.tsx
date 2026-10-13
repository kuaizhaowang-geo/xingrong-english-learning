import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import { Label } from '@client/src/components/ui/label';
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
import { Spinner } from '@client/src/components/ui/spinner';
import {
  type AuditLogItem,
  type PagedResponse,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ACTION_OPTIONS = [
  { value: 'all', label: '全部动作' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'submit_review', label: '提交审核' },
  { value: 'approve_review', label: '审核通过' },
  { value: 'reject_review', label: '审核驳回' },
  { value: 'publish', label: '发布' },
  { value: 'offline', label: '下架' },
  { value: 'lock', label: '锁定' },
  { value: 'unlock', label: '解锁' },
];

const TARGET_TYPE_OPTIONS = [
  { value: 'all', label: '全部目标' },
  { value: 'course', label: '课程' },
  { value: 'lesson', label: '课时' },
  { value: 'word', label: '单词' },
  { value: 'sentence', label: '句子' },
  { value: 'textbook', label: '教材' },
  { value: 'user', label: '用户' },
];

const actionLabel = (value: string): string =>
  ACTION_OPTIONS.find((a) => a.value === value)?.label ?? value;

const targetTypeLabel = (value: string): string =>
  TARGET_TYPE_OPTIONS.find((t) => t.value === value)?.label ?? value;

const actionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (action.startsWith('approve') || action === 'publish' || action === 'unlock') {
    return 'default';
  }
  if (action === 'delete' || action.startsWith('reject') || action === 'offline' || action === 'lock') {
    return 'destructive';
  }
  if (action === 'create' || action === 'update' || action === 'submit_review') {
    return 'outline';
  }
  return 'secondary';
};

const formatDetailPreview = (detail: Record<string, unknown>): string => {
  const keys: string[] = ['title', 'from_status', 'to_status', 'reason', 'name'];
  const parts: string[] = [];
  for (const k of keys) {
    if (detail[k] !== undefined && detail[k] !== null) {
      parts.push(`${k}: ${String(detail[k])}`);
    }
  }
  if (parts.length === 0) {
    try {
      return JSON.stringify(detail);
    } catch {
      return '-';
    }
  }
  return parts.join(' | ');
};

const DetailCell: React.FC<{ detail: Record<string, unknown> }> = ({ detail }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = formatDetailPreview(detail);
  return (
    <div className="max-w-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-left w-full"
      >
         <div className="flex items-center gap-1 text-xs text-slate-400 hover:text-fuchsia-300">
          {expanded ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
          <span className="truncate">{preview || '-'}</span>
        </div>
      </button>
      {expanded && (
         <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap break-all border border-white/10">
          {JSON.stringify(detail, null, 2)}
        </pre>
      )}
    </div>
  );
};

const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [action, setAction] = useState('all');
  const [targetType, setTargetType] = useState('all');

  const loadLogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        keyword?: string;
        action?: string;
        targetType?: string;
      } = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (action !== 'all') params.action = action;
      if (targetType !== 'all') params.targetType = targetType;
      const data: PagedResponse<AuditLogItem> =
        await adminApi.getAuditLogs(params);
      setLogs(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('Failed to load audit logs', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, action, targetType]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleSearch = (): void => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handleActionChange = (val: string): void => {
    setAction(val);
    setPage(1);
  };

  const handleTargetTypeChange = (val: string): void => {
    setTargetType(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: string): void => {
    setPageSize(Number(val));
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#3A0CA3] flex items-center justify-center">
          <FileText size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">操作日志</h2>
          <p className="text-sm text-slate-400">共 {total} 条记录</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5 w-40">
              <Label className="text-sm text-slate-300">动作</Label>
              <Select value={action} onValueChange={handleActionChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择动作" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 w-40">
              <Label className="text-sm text-slate-300">目标类型</Label>
              <Select value={targetType} onValueChange={handleTargetTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择目标类型" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
              <Label className="text-sm text-slate-300">操作人</Label>
              <div className="relative">
                <Search
                  size={16}
                   className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="搜索操作人姓名..."
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold">日志列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="py-16 flex justify-center items-center gap-2 text-slate-400">
              <Spinner />
              <span>加载中...</span>
            </div>
          ) : logs.length === 0 ? (
             <div className="py-16 text-center text-slate-400">暂无数据</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">时间</TableHead>
                    <TableHead className="w-32">操作人</TableHead>
                    <TableHead className="w-28">动作</TableHead>
                    <TableHead className="w-24">目标类型</TableHead>
                    <TableHead className="w-32">目标ID</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AuditLogItem) => (
                    <TableRow key={log.id}>
                       <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                       <TableCell className="text-white">
                        {log.userName ?? log.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionBadgeVariant(log.action)}>
                          {actionLabel(log.action)}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-slate-300">
                        {targetTypeLabel(log.targetType)}
                      </TableCell>
                       <TableCell className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                        {log.targetId ?? '-'}
                      </TableCell>
                      <TableCell>
                        <DetailCell detail={log.detail} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
               <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                 <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>每页</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} 条
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>共 {total} 条</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                   <span className="text-sm text-slate-300 px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditPage;
