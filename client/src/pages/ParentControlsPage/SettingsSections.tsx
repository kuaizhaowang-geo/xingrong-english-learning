import React, { useState } from 'react';
import { Lock, Moon, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Switch } from '@client/src/components/ui/switch';
import { PasswordInput } from '@client/src/components/ui/password-input';
import type {
  ParentControls,
  UsageReport,
  UsageDailyItem,
} from '@shared/api.interface';

const BAR_COLORS: string[] = ['#FF6B35', '#4361EE', '#2EC4B6'];

interface SettingsSectionsProps {
  controls: ParentControls | null;
  report: UsageReport | null;
  reportType: 'weekly' | 'monthly';
  weeklyLogs: UsageDailyItem[];
  onUpdateControls: (patch: Partial<ParentControls>) => void;
  onReportTypeChange: (t: 'weekly' | 'monthly') => void;
  onPasswordSave: (
    oldPwd: string,
    newPwd: string,
    confirmPwd: string,
  ) => Promise<void>;
}

const SettingsSections: React.FC<SettingsSectionsProps> = ({
  controls,
  report,
  reportType,
  weeklyLogs,
  onUpdateControls,
  onReportTypeChange,
  onPasswordSave,
}) => {
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [savingPwd, setSavingPwd] = useState<boolean>(false);

  const maxMinutes = Math.max(
    1,
    ...weeklyLogs.map((d) => d.durationMinutes),
  );
  const moduleTotal = report?.moduleData.reduce(
    (sum: number, m) => sum + m.durationMinutes,
    0,
  ) ?? 1;

  const handleSavePassword = async (): Promise<void> => {
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('密码至少 4 位');
      return;
    }
    try {
      setSavingPwd(true);
      await onPasswordSave(oldPassword, newPassword, confirmPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('密码保存成功');
    } catch (err) {
      logger.error({ level: 'error', args: ['保存密码失败', err] });
      toast.error('保存失败，请检查原密码是否正确');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      {/* 夜间模式 */}
      <Card className="border border-gray-100 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Moon size={18} style={{ color: '#6366F1' }} />
            夜间模式
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                开始时间
              </label>
              <Input
                type="time"
                value={controls?.nightModeStart ?? '22:00'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateControls({ nightModeStart: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                结束时间
              </label>
              <Input
                type="time"
                value={controls?.nightModeEnd ?? '07:00'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateControls({ nightModeEnd: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 家长密码 */}
      <Card className="border border-gray-100 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Lock size={18} style={{ color: '#EF476F' }} />
            家长密码
            {controls?.hasParentPassword && (
             <span className="text-green-300 bg-green-500/15 border border-green-500/20 px-2 py-0.5 rounded-full ml-2">
                已设置
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {controls?.hasParentPassword && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                原密码
              </label>
              <PasswordInput
                value={oldPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOldPassword(e.target.value)
                }
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {controls?.hasParentPassword ? '新密码' : '设置密码'}
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                确认密码
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </div>
          </div>
          <button
            onClick={handleSavePassword}
            disabled={savingPwd || !newPassword}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #4361EE 0%, #6366F1 100%)',
            }}
          >
            {savingPwd ? '保存中...' : '保存密码'}
          </button>
        </CardContent>
      </Card>

      {/* 最近 7 天柱状图 */}
      <Card className="border border-gray-100 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: '#2EC4B6' }} />
            最近 7 天使用记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyLogs.length === 0
               ? Array.from({ length: 7 }).map((_, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1">
                     <div className="w-full bg-white/10 rounded-t-sm" style={{ height: '20%' }} />
                     <span className="text-[10px] text-slate-500">{i + 1}</span>
                  </div>
                ))
              : weeklyLogs.map((day, idx) => {
                  const height = (day.durationMinutes / maxMinutes) * 100;
                  return (
                    <div key={day.date + idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(height, 4)}%`,
                          background: `linear-gradient(180deg, ${BAR_COLORS[idx % 3]} 0%, ${BAR_COLORS[idx % 3]}99 100%)`,
                        }}
                      />
                       <span className="text-[10px] text-slate-400">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
          </div>
        </CardContent>
      </Card>

      {/* 使用报告 */}
      <Card className="border border-gray-100 shadow-md rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: '#4361EE' }} />
            使用报告
          </CardTitle>
           <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg">
             <button
               onClick={() => onReportTypeChange('weekly')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                 reportType === 'weekly'
                   ? 'bg-fuchsia-500/20 text-white shadow-lg shadow-fuchsia-500/20'
                   : 'text-slate-400'
               }`}
             >
               周报告
             </button>
             <button
               onClick={() => onReportTypeChange('monthly')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                 reportType === 'monthly'
                   ? 'bg-fuchsia-500/20 text-white shadow-lg shadow-fuchsia-500/20'
                   : 'text-slate-400'
               }`}
             >
               月报告
             </button>
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">总学习时长</span>
            <span className="text-xl font-bold" style={{ color: '#4361EE' }}>
              {report?.totalDuration ?? 0} 分钟
            </span>
          </div>
          <div>
             <p className="text-sm text-slate-300 mb-3">模块占比</p>
            <div className="space-y-2">
              {report?.moduleData.map((m) => {
                const pct = (m.durationMinutes / moduleTotal) * 100;
                return (
                  <div key={m.module}>
                    <div className="flex justify-between text-xs mb-1">
                       <span className="text-slate-300">{m.module}</span>
                       <span className="text-slate-500">
                        {m.durationMinutes} 分钟
                      </span>
                    </div>

                  </div>
                );
              })}
              {(!report?.moduleData || report.moduleData.length === 0) && (
                 <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SettingsSections;
