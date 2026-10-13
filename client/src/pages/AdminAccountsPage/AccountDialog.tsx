import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { PasswordInput } from '@client/src/components/ui/password-input';
import { Label } from '@client/src/components/ui/label';
import { Switch } from '@client/src/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { type AdminUserManageItem, type AdminRole } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AdminUserManageItem | null;
  onSaved: () => void;
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'editor', label: '学科编辑' },
  { value: 'reviewer', label: '审核员' },
  { value: 'content_admin', label: '内容管理员' },
  { value: 'teacher', label: '教师' },
];

const SUBJECT_OPTIONS = [
  { value: '', label: '全部学科' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const AccountDialog: React.FC<AccountDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSaved,
}) => {
  const isEdit = !!account;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('editor');
  const [subject, setSubject] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (account) {
        setUsername(account.username);
        setPassword('');
        setName(account.name);
        setRole(account.role);
        setSubject(account.subject ?? '');
        setIsActive(account.isActive);
      } else {
        setUsername('');
        setPassword('');
        setName('');
        setRole('editor');
        setSubject('');
        setIsActive(true);
      }
    }
  }, [open, account]);

  const handleSubmit = async (): Promise<void> => {
    if (!username.trim() || !name.trim()) return;
    if (!isEdit && !password.trim()) return;
    setLoading(true);
    try {
      const baseData = {
        username,
        name,
        role,
        subject: subject || undefined,
        isActive,
      };
      if (isEdit && account) {
        const updateData: Record<string, unknown> = { ...baseData };
        if (password.trim()) {
          updateData.password = password;
        }
        await adminApi.updateAdminAccount(account.id, updateData);
      } else {
        await adminApi.createAdminAccount({
          username,
          password: password.trim(),
          name,
          role,
          subject: subject || undefined,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save admin account', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑管理员' : '新增管理员'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acc-username">用户名</Label>
              <Input
                id="acc-username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                disabled={isEdit}
                placeholder="登录用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-password">
                密码
                <span className="text-gray-400 font-normal ml-1">
                  {isEdit ? '（不修改留空）' : '（必填）'}
                </span>
              </Label>
              <PasswordInput
                id="acc-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                placeholder={isEdit ? '不修改请留空' : '请输入密码'}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-name">姓名</Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="管理员姓名"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
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
            <div className="space-y-2">
              <Label>学科</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>账号状态</Label>
            <div className="flex items-center gap-2 h-9">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm text-gray-600">
                {isActive ? '已启用' : '已禁用'}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDialog;
