import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Search, Eye, Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import { Label } from '@client/src/components/ui/label';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@client/src/components/ui/pagination';
import * as adminApi from '@client/src/api/admin';
import type { AdminUserItem } from '@shared/api.interface';
import UserDetailDialog from './UserDetailDialog';

const ROLE_OPTIONS = [
  { value: '', label: '全部角色' },
  { value: 'student', label: '学生' },
  { value: 'parent', label: '家长' },
  { value: 'teacher', label: '老师' },
];

const ROLE_LABEL_MAP: Record<string, string> = {
  student: '学生',
  parent: '家长',
  teacher: '老师',
};

const AdminUsersPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const [toggleDialog, setToggleDialog] = useState<{
    open: boolean;
    user: AdminUserItem | null;
    targetActive: boolean;
  }>({ open: false, user: null, targetActive: false });
  const [toggling, setToggling] = useState<boolean>(false);

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filterKeyword) params.keyword = filterKeyword;
      if (filterRole) params.role = filterRole;
      const data = await adminApi.getUsers(params);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      logger.error('Failed to fetch users', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (): void => {
    setPage(1);
    fetchUsers();
  };

  const handleViewDetail = (item: AdminUserItem): void => {
    setDetailUserId(item.id);
    setDetailOpen(true);
  };

  const handleToggleStatus = (user: AdminUserItem): void => {
    setToggleDialog({
      open: true,
      user,
      targetActive: !user.isActive,
    });
  };

  const handleConfirmToggle = async (): Promise<void> => {
    if (!toggleDialog.user) return;
    setToggling(true);
    try {
      await adminApi.toggleUserStatus(toggleDialog.user.id, toggleDialog.targetActive);
      setToggleDialog({ open: false, user: null, targetActive: false });
      fetchUsers();
    } catch (err) {
      logger.error('Failed to toggle user status', { error: String(err) });
    } finally {
      setToggling(false);
    }
  };

  const getRoleVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'teacher':
        return 'default';
      case 'parent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name.slice(0, 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderPaginationItems = (): React.ReactNode => {
    const pages: React.ReactNode[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === page} onClick={() => setPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    return pages;
  };

  return (
    <div className="space-y-6" data-ai-section-type="card-list">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">用户管理</h2>
      </div>

      {/* 筛选区 */}
      <div className="glass-card p-5">
         <div className="flex flex-wrap items-end gap-4">
           <div className="flex flex-col gap-1.5 min-w-[160px]">
             <Label className="text-sm text-slate-300">角色</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部角色" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
             <Label className="text-sm text-slate-300">关键词</Label>
            <div className="flex gap-2">
              <Input
                placeholder="搜索昵称"
                value={filterKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilterKeyword(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button onClick={handleSearch}>
                <Search size={16} />
                搜索
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格区 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>账号/ID</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>学习时长(分)</TableHead>
                <TableHead>打卡天数</TableHead>
                <TableHead>错题数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                     暂无数据
                   </TableCell>
                </TableRow>
              ) : (
                items.map((item: AdminUserItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-[#4361EE] text-white text-xs">
                            {getInitials(item.nickname)}
                          </AvatarFallback>
                        </Avatar>
                         <span className="font-medium text-white">
                           {item.nickname}
                         </span>
                      </div>
                    </TableCell>
                     <TableCell className="text-slate-400 text-xs font-mono">
                       {item.phone ?? item.id}
                     </TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(item.role)}>
                        {ROLE_LABEL_MAP[item.role] ?? item.role}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-slate-400 text-xs">
                       {item.registerTime
                        ? item.registerTime.slice(0, 10)
                        : '-'}
                    </TableCell>
                     <TableCell className="text-slate-200">
                       {item.totalStudyMinutes ?? 0}
                     </TableCell>
                     <TableCell className="text-slate-200">
                       {item.checkInDays ?? 0}
                     </TableCell>
                     <TableCell className="text-pink-400">
                      {item.wrongCount ?? 0}
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge
                          variant="outline"
                          className="text-[#2EC4B6] border-[#2EC4B6]/30 bg-[#2EC4B6]/5"
                        >
                          正常
                        </Badge>
                      ) : (
                        <Badge variant="destructive">禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(item)}
                          className="h-7 px-2 text-[#4361EE] hover:text-[#4361EE]"
                        >
                          <Eye size={14} />
                          详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          className={`h-7 px-2 ${
                            item.isActive
                              ? 'text-[#EF476F] hover:text-[#EF476F]'
                              : 'text-[#2EC4B6] hover:text-[#2EC4B6]'
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <Ban size={14} />
                              禁用
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              启用
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* 分页 */}
        {!loading && total > 0 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              共 {total} 条，第 {page} / {totalPages} 页
            </div>
            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {page > 3 && totalPages > 7 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                    </PaginationItem>
                    {page > 4 && <PaginationEllipsis />}
                  </>
                )}
                {renderPaginationItems()}
                {page < totalPages - 2 && totalPages > 7 && (
                  <>
                    {page < totalPages - 3 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((p: number) => Math.min(totalPages, p + 1))
                    }
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* 用户详情弹窗 */}
      <UserDetailDialog
        open={detailOpen}
        userId={detailUserId}
        onClose={() => setDetailOpen(false)}
      />

      {/* 状态切换确认 */}
      <Dialog
        open={toggleDialog.open}
        onOpenChange={(val: boolean) => {
          if (!val) setToggleDialog({ open: false, user: null, targetActive: false });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleDialog.targetActive ? '确认启用' : '确认禁用'}
            </DialogTitle>
            <DialogDescription>
              {toggleDialog.targetActive
                ? `确定要启用用户「${toggleDialog.user?.nickname}」吗？`
                : `确定要禁用用户「${toggleDialog.user?.nickname}」吗？禁用后该用户将无法登录。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setToggleDialog({ open: false, user: null, targetActive: false })
              }
              disabled={toggling}
            >
              取消
            </Button>
            <Button
              variant={toggleDialog.targetActive ? 'default' : 'destructive'}
              onClick={handleConfirmToggle}
              disabled={toggling}
            >
              {toggling
                ? '处理中...'
                : toggleDialog.targetActive
                ? '确认启用'
                : '确认禁用'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
