import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Info,
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  User,
  Key,
  Shield,
  FileText,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { LearnerProfile } from '@shared/api.interface';
import { useSettingsStore } from '../store/settingsStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

interface SystemSectionProps {
  profile: LearnerProfile | null;
  onProfileUpdate: (profile: LearnerProfile) => void;
}

const SystemSection: React.FC<SystemSectionProps> = () => {
  const { resetAllSettings, system } = useSettingsStore();
  const [clearCacheOpen, setClearCacheOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleClearCache = (): void => {
    setClearingCache(true);
    try {
      const keysToKeep = ['xr-settings-v2'];
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      setTimeout(() => {
        setClearingCache(false);
        setClearCacheOpen(false);
      }, 800);
    } catch (err) {
      logger.error({ level: 'error', args: ['清除缓存失败', err] });
      setClearingCache(false);
    }
  };

  const handleResetSettings = (): void => {
    resetAllSettings();
    setResetDone(true);
    setTimeout(() => {
      setResetDone(false);
      setResetOpen(false);
    }, 800);
  };

  return (
    <div className="space-y-5">
      {/* 账号信息 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <h3 className="text-base font-semibold text-white">账号信息</h3>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            学
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white text-base">
              学习者
            </div>
            <div className="text-sm text-slate-400 mt-0.5">
              个人资料与账号设置
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              color: '#818CF8',
              border: '1px solid rgba(99, 102, 241, 0.12)',
            }}
          >
            <Key className="w-3.5 h-3.5" />
            修改密码
          </button>
        </div>
      </div>

      {/* 数据管理 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" style={{ color: '#FBBF24' }} />
          <h3 className="text-base font-semibold text-white">数据管理</h3>
        </div>

        <div className="space-y-2">
          {/* 清除缓存 */}
          <button
            onClick={() => setClearCacheOpen(true)}
            className="w-full flex items-center justify-between py-3 px-3 rounded-xl transition-colors"
            style={{ background: 'rgba(239, 68, 68, 0.05)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#F87171',
                }}
              >
                <Trash2 className="w-4 h-4" />
              </div>
                <div className="text-left">
                  <div className="text-sm text-slate-200">清除缓存</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    清除本地学习缓存，设置不受影响
                  </div>
                </div>
            </div>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              清除
            </button>
          </button>

          {/* 重置所有设置 */}
          <button
            onClick={() => setResetOpen(true)}
            className="w-full flex items-center justify-between py-3 px-3 rounded-xl transition-colors"
            style={{ background: 'rgba(245, 158, 11, 0.05)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)';
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#FBBF24',
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </div>
                <div className="text-left">
                  <div className="text-sm text-slate-200">重置所有设置</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    将所有设置恢复为默认值
                  </div>
                </div>
            </div>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              重置
            </button>
          </button>
        </div>
      </div>

      {/* 关于我们 */}
      <div
        className="rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5" style={{ color: '#22D3EE' }} />
          <h3 className="text-base font-semibold text-white">关于我们</h3>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(34, 211, 238, 0.15)',
                  color: '#06B6D4',
                }}
              >
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-200">关于星荣英语</span>
            </div>
            <span className="text-xs text-slate-400">
              让英语学习更高效有趣
            </span>
          </div>

           <div className="flex items-center justify-between py-3 border-t border-white/10">
             <span className="text-sm text-slate-400">版本号</span>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-md"
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                color: '#818CF8',
              }}
            >
              v{system.version}
            </span>
          </div>

          <UniversalLink
            to="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center justify-between py-3 border-t border-white/5 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                }}
              >
                <HelpCircle className="w-4 h-4" />
              </div>
               <span className="text-sm text-slate-200 group-hover:text-fuchsia-400 transition-colors">
                 帮助中心
               </span>
             </div>
             <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-fuchsia-400 transition-colors" />
          </UniversalLink>
        </div>
      </div>

      {/* 清除缓存确认弹窗 */}
      <Dialog open={clearCacheOpen} onOpenChange={setClearCacheOpen}>
          <DialogContent
            className="sm:max-w-md"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(248, 113, 113, 0.3)',
              color: '#E2E8F0',
              backdropFilter: 'blur(20px)',
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#F87171' }} />
              确认清除缓存
            </DialogTitle>
             <DialogDescription className="text-slate-400">
               清除本地学习缓存数据，你的设置和学习进度不会受到影响。
             </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearCacheOpen(false)}
              style={{
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#94A3B8',
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="text-white"
              style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                border: 'none',
              }}
            >
              <Trash2 className="w-4 h-4" />
              {clearingCache ? '清除中...' : '确认清除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置设置确认弹窗 */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
         <DialogContent
            className="sm:max-w-md"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(251, 191, 36, 0.3)',
              color: '#E2E8F0',
              backdropFilter: 'blur(20px)',
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#FBBF24' }} />
              确认重置所有设置
            </DialogTitle>
             <DialogDescription className="text-slate-400">
               此操作会将所有个性化设置恢复为默认值。你的学习进度和账号数据不会受到影响。
             </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetOpen(false)}
              style={{
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#94A3B8',
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleResetSettings}
              disabled={resetDone}
              className="text-white"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                border: 'none',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              {resetDone ? '已重置' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemSection;
