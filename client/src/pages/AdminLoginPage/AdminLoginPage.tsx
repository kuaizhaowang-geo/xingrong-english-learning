import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useAdminAuth } from '@client/src/contexts/AdminAuthContext';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    '/admin/dashboard';

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      logger.error('Admin login failed', { error: String(err) });
      const message =
        err instanceof Error ? err.message : '登录失败，请检查账号和密码';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌展示区 */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* 装饰性光晕 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4361EE]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A0CA3]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4361EE] to-[#7209B7] flex items-center justify-center shadow-lg shadow-[#4361EE]/30">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-xl font-bold">星荣英语</div>
            <div className="text-xs text-gray-400">Xingrong English</div>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            游戏化英语学习平台
            <br />
            管理后台
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-md">
            高效管理课程、教材、单词与用户数据，
            <br />
            让每一位学习者都能获得更好的英语学习体验。
          </p>
        </div>

        <div className="relative z-10 text-xs text-gray-500">
          © 2026 星荣英语. All rights reserved.
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] relative overflow-hidden">
         <div className="absolute top-1/4 -left-1/4 w-64 h-64 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
         <div className="absolute bottom-1/4 -right-1/4 w-64 h-64 bg-[#22D3EE]/20 rounded-full blur-3xl" />
         <div className="w-full max-w-sm relative z-10 glass-card p-8 rounded-2xl">
          {/* 移动端 Logo */}
          <div className="md:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4361EE] to-[#7209B7] flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
             <div className="text-lg font-bold text-white">星荣英语</div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">管理员登录</h2>
           <p className="text-sm text-slate-400 mb-8">
            请输入您的管理员账号和密码
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
               <Label htmlFor="username" className="text-sm font-medium text-slate-200">
                账号
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                placeholder="请输入管理员账号"
                className="h-10"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
               <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder="请输入密码"
                  className="h-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
               <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-[#4361EE] hover:bg-[#3A56D4] text-white rounded-lg font-medium shadow-md shadow-[#4361EE]/20"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/"
               className="text-sm text-slate-400 hover:text-[#22D3EE] transition-colors"
            >
              ← 返回前台
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
