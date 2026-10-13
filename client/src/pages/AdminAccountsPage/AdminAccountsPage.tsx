import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@client/src/components/ui/alert-dialog';
import { Spinner } from '@client/src/components/ui/spinner';
import {
  type AdminUserManageItem,
  type AdminRole,
  type PagedResponse,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';
import AccountDialog from './AccountDialog';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ROLE_OPTIONS = [
  { value: 'all', label: '全部角色' },
  { value: 'super_admin', label: '超级管理员' },
  { value: 'editor', label: '学科编辑' },
  { value: 'reviewer', label: '审核员' },
  { value: 'content_admin', label: '内容管理员' },
  { value: 'teacher', label: '教师' },
];

const SUBJECT_OPTIONS = [
  { value: 'all', label: '全部学科' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const roleLabel = (value: string): string =>
  ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value;

const subjectLabel = (value: string | undefined): string => {
  if (!value) return '全部';
  return SUBJECT_OPTIONS.find((s) => s.value === value)?.label ?? value;
};

const roleBadgeVariant = (
  role: AdminRole,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'editor':
      return 'default';
    case 'reviewer':
      return 'secondary';
    default:
      return 'outline';
  }
};

const AdminAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminUserManageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('all');
  const [subject, setSubject] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminUserManageItem | null>(
    null,
  );

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<AdminUserManageItem | null>(
    null,
  );

  const loadAccounts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        keyword?: string;
        role?: string;
        subject?: string;
      } = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (role !== 'all') params.role = role;
      if (subject !== 'all') params.subject = subject;
      const data: PagedResponse<AdminUserManageItem> =
        await adminApi.getAdminAccounts(params);
      setAccounts(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('Failed to load admin accounts', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, role, subject]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const handleSearch = (): void => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handleRoleChange = (val: string): void => {
    setRole(val);
    setPage(1);
  };

  const handleSubjectChange = (val: string): void => {
    setSubject(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: string): void => {
    setPageSize(Number(val));
    setPage(1);
  };

  const handleAdd = (): void => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleEdit = (account: AdminUserManageItem): void => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleDeleteClick = (account: AdminUserManageItem): void => {
    setDeletingAccount(account);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deletingAccount) return;
    try {
      await adminApi.deleteAdminAccount(deletingAccount.id);
      void loadAccounts();
    } catch (err) {
      logger.error('Failed to delete admin account', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingAccount(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#3A0CA3] flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A2E]">
              管理员账号
            </h2>
            <p className="text-sm text-gray-500">共 {total} 个账号</p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          新增账号
        </Button>
      </div>

      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5 w-40">
              <Label className="text-sm text-[#6B7280]">角色</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 w-36">
              <Label className="text-sm text-[#6B7280]">学科</Label>
              <Select value={subject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
              <Label className="text-sm text-[#6B7280]">关键词</Label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="搜索用户名/姓名..."
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold">账号列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center items-center gap-2 text-gray-500">
              <Spinner />
              <span>加载中...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center text-gray-500">暂无数据</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead className="w-28">角色</TableHead>
                    <TableHead className="w-20">学科</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead className="w-36">最后登录</TableHead>
                    <TableHead className="w-36">创建时间</TableHead>
                    <TableHead className="w-40 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc: AdminUserManageItem) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium text-[#1A1A2E]">
                        {acc.username}
                      </TableCell>
                      <TableCell className="text-[#1A1A2E]">{acc.name}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(acc.role)}>
                          {roleLabel(acc.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#6B7280]">
                        {subjectLabel(acc.subject)}
                      </TableCell>
                      <TableCell>
                        {acc.isActive ? (
                          <Badge
                            variant="outline"
                            className="text-[#2EC4B6] border-[#2EC4B6]/30 bg-[#2EC4B6]/5"
                          >
                            <ShieldCheck size={10} className="mr-1" />
                            启用
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <ShieldAlert size={10} className="mr-1" />
                            禁用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                        {acc.lastLoginAt
                          ? new Date(acc.lastLoginAt).toLocaleString(
                              'zh-CN',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )
                          : '未登录'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                        {new Date(acc.createdAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-[#4361EE]"
                            onClick={() => handleEdit(acc)}
                          >
                            <Pencil size={12} />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500"
                            onClick={() => handleDeleteClick(acc)}
                          >
                            <Trash2 size={12} />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
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
                  <span className="text-sm text-gray-600 px-2">
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

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
        onSaved={loadAccounts}
      />

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除账号</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除管理员账号「{deletingAccount?.username}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAccountsPage;
