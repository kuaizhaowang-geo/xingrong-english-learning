import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { antiAddictionApi } from '@client/src/api';
import type {
  ParentControls,
  UsageReport,
  AntiAddictionStatus,
  UsageDailyItem,
} from '@shared/api.interface';
import TimeLimitsSection from './TimeLimitsSection';
import SettingsSections from './SettingsSections';

const ParentControlsPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AntiAddictionStatus | null>(null);
  const [controls, setControls] = useState<ParentControls | null>(null);
  const [report, setReport] = useState<UsageReport | null>(null);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [saving, setSaving] = useState<boolean>(false);
  const [weeklyLogs, setWeeklyLogs] = useState<UsageDailyItem[]>([]);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const [s, c, r, logsRes] = await Promise.all([
        antiAddictionApi.getStatus(),
        antiAddictionApi.getParentControls(),
        antiAddictionApi.getReport('weekly'),
        antiAddictionApi.getLogs(
          new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10),
        ),
      ]);
      setStatus(s);
      setControls(c);
      setReport(r);
      setWeeklyLogs(
        logsRes.items.map((item) => ({
          date: item.date,
          durationMinutes: item.durationMinutes,
        })),
      );
    } catch (err) {
      logger.error({ level: 'error', args: ['加载防沉迷数据失败', err] });
      toast.error('加载失败，请稍后重试');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    antiAddictionApi
      .getReport(reportType)
      .then((r) => setReport(r))
      .catch((err) =>
        logger.error({ level: 'error', args: ['获取报告失败', err] }),
      );
  }, [reportType]);

  const updateControls = (patch: Partial<ParentControls>): void => {
    if (!controls) return;
    setControls({ ...controls, ...patch });
  };

  const handlePasswordSave = async (
    oldPwd: string,
    newPwd: string,
  ): Promise<void> => {
    if (!controls) return;
    await antiAddictionApi.upsertParentControls({
      ageGroup: controls.ageGroup,
      dailyLimitWeekday: controls.dailyLimitWeekday,
      dailyLimitWeekend: controls.dailyLimitWeekend,
      sessionLimit: controls.sessionLimit,
      nightModeStart: controls.nightModeStart,
      nightModeEnd: controls.nightModeEnd,
      oldPassword: oldPwd || undefined,
      newPassword: newPwd || undefined,
    });
    await loadData();
  };

  const handleSaveAll = async (): Promise<void> => {
    if (!controls) return;
    try {
      setSaving(true);
      await antiAddictionApi.upsertParentControls({
        ageGroup: controls.ageGroup,
        dailyLimitWeekday: controls.dailyLimitWeekday,
        dailyLimitWeekend: controls.dailyLimitWeekend,
        sessionLimit: controls.sessionLimit,
        nightModeStart: controls.nightModeStart,
        nightModeEnd: controls.nightModeEnd,
      });
      toast.success('设置保存成功');
      await loadData();
    } catch (err) {
      logger.error({ level: 'error', args: ['保存家长控制失败', err] });
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
             className="text-slate-300"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
             <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={22} style={{ color: '#4361EE' }} />
              家长控制中心
            </h1>
             <p className="text-sm text-slate-400">
              守护孩子健康学习，科学管理用眼时长
            </p>
          </div>
        </div>

        <TimeLimitsSection
          status={status}
          controls={controls}
          report={report}
          onUpdate={updateControls}
        />

        <SettingsSections
          controls={controls}
          report={report}
          reportType={reportType}
          weeklyLogs={weeklyLogs}
          onUpdateControls={updateControls}
          onReportTypeChange={setReportType}
          onPasswordSave={handlePasswordSave}
        />

        {/* 保存按钮 */}
        <div className="sticky bottom-4 z-20">
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full text-white border-0 text-base font-medium py-6"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
              boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
            }}
          >
            <Save size={18} />
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParentControlsPage;
