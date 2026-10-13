import React, { useState, useEffect } from 'react';
import {
  Lock,
  Users,
  Globe,
  Check,
  AlertCircle,
  Upload,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Eye,
  Copy,
  MessageSquare,
  User,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { creatorApi } from '@client/src/api';
import type { WordbookVisibility, WordbookStatus } from '@shared/api.interface';
import type { CreatorShareSettingsResponse } from '@client/src/api/creator';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface ShareSettingsProps {
  wordbookId: string;
}

interface VisibilityOption {
  value: WordbookVisibility;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'private',
    icon: <Lock className="w-5 h-5" />,
    title: '私密',
    desc: '只有自己能看到和学习',
    color: '#94A3B8',
  },
  {
    value: 'partial',
    icon: <Users className="w-5 h-5" />,
    title: '部分公开',
    desc: '选择特定内容公开',
    color: '#2563EB',
  },
  {
    value: 'public',
    icon: <Globe className="w-5 h-5" />,
    title: '完全公开',
    desc: '所有人都能看到和学习',
    color: '#06B6D4',
  },
];

interface PermissionOption {
  key: 'allowLearn' | 'allowCopy' | 'allowComment' | 'showCreatorInfo';
  icon: React.ReactNode;
  label: string;
  desc: string;
}

const PERMISSION_OPTIONS: PermissionOption[] = [
  { key: 'allowLearn', icon: <Eye className="w-4 h-4" />, label: '允许其他人学习', desc: '其他用户可以使用该词库进行学习' },
  { key: 'allowCopy', icon: <Copy className="w-4 h-4" />, label: '允许收藏/复制到自己的词库', desc: '用户可以收藏或复制内容到自己的词库' },
  { key: 'allowComment', icon: <MessageSquare className="w-4 h-4" />, label: '允许评论和点赞', desc: '用户可以对内容进行评论和点赞' },
  { key: 'showCreatorInfo', icon: <User className="w-4 h-4" />, label: '显示创作者信息', desc: '在内容详情页展示你的昵称和等级' },
];

const ShareSettings: React.FC<ShareSettingsProps> = ({ wordbookId }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<CreatorShareSettingsResponse | null>(null);
  const [visibility, setVisibility] = useState<WordbookVisibility>('private');
  const [allowLearn, setAllowLearn] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [allowComment, setAllowComment] = useState(true);
  const [showCreatorInfo, setShowCreatorInfo] = useState(true);

  const loadSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await creatorApi.getShareSettings(wordbookId);
      setSettings(res);
      setVisibility(res.visibility);
      setAllowLearn(res.allowLearn);
      setAllowCopy(res.allowCopy);
      setAllowComment(res.allowComment);
      setShowCreatorInfo(res.showCreatorInfo);
    } catch (err) {
      logger.error('加载分享设置失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [wordbookId]);

  const handleSubmit = async (): Promise<void> => {
    if (!await showConfirm('确定提交审核吗？提交后内容将进入审核队列。')) return;
    setSubmitting(true);
    try {
      await creatorApi.submitShare(wordbookId, {
        visibility,
        allowLearn,
        allowCopy,
        allowComment,
        showCreatorInfo,
      });
      await loadSettings();
    } catch (err) {
      logger.error('提交分享失败', err as Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (): Promise<void> => {
    if (!await showConfirm('确定撤回审核吗？撤回后内容将恢复为私密状态。')) return;
    setSubmitting(true);
    try {
      await creatorApi.withdrawShare(wordbookId);
      await loadSettings();
    } catch (err) {
      logger.error('撤回失败', err as Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!await showConfirm('确定下架吗？下架后内容将不再公开。')) return;
    setSubmitting(true);
    try {
      // 下架 = 设为私密
      await creatorApi.submitShare(wordbookId, {
        visibility: 'private',
        allowLearn,
        allowCopy,
        allowComment,
        showCreatorInfo,
      });
      await loadSettings();
    } catch (err) {
      logger.error('下架失败', err as Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = settings?.status !== 'pending';

  const renderStatusBar = (): React.ReactNode => {
    if (!settings) return null;
    const statusConfig: Record<WordbookStatus, { text: string; color: string; bg: string; icon: React.ReactNode }> = {
      draft: { text: '草稿状态', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', icon: <AlertCircle className="w-5 h-5" /> },
      pending: { text: '审核中，请耐心等待', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.1)', icon: <RotateCcw className="w-5 h-5 animate-spin" /> },
      approved: { text: '已公开发布', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', icon: <CheckCircle2 className="w-5 h-5" /> },
      rejected: { text: '审核未通过', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle className="w-5 h-5" /> },
      removed: { text: '已下架', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', icon: <AlertCircle className="w-5 h-5" /> },
    };
    const s = statusConfig[settings.status];
    return (
      <div
        className="flex items-center gap-3 rounded-xl p-4 mb-6"
        style={{ background: s.bg, border: `1px solid ${s.color}33` }}
      >
        <div style={{ color: s.color }}>{s.icon}</div>
        <span className="font-medium" style={{ color: s.color }}>{s.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: '#94A3B8' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* 状态条 */}
      {renderStatusBar()}

      {/* 审核备注 */}
      {settings?.auditNote && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">审核意见</span>
          </div>
          <p className="text-sm text-red-300">{settings.auditNote}</p>
        </div>
      )}

      {/* 可见性选择 */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">可见性设置</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VISIBILITY_OPTIONS.map((opt) => {
            const active = visibility === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => canEdit && setVisibility(opt.value)}
                disabled={!canEdit}
                className="rounded-xl p-4 text-left transition-all relative"
                style={{
                   background: active ? `${opt.color}25` : 'rgba(15, 23, 42, 0.5)',
                   border: active ? `1px solid ${opt.color}` : '1px solid rgba(139, 92, 246, 0.25)',
                   backdropFilter: 'blur(12px)',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  opacity: canEdit ? 1 : 0.6,
                }}
              >
                {active && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: opt.color }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="mb-2" style={{ color: active ? opt.color : '#94A3B8' }}>
                  {opt.icon}
                </div>
                <div className="text-white font-medium mb-1">{opt.title}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 分享权限 */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">分享权限设置</h3>
        <div
           className="rounded-xl divide-y"
           style={{
             background: 'rgba(15, 23, 42, 0.5)',
             backdropFilter: 'blur(12px)',
             border: '1px solid rgba(139, 92, 246, 0.25)',
             borderColor: 'rgba(255, 255, 255, 0.08)',
           }}
        >
          {PERMISSION_OPTIONS.map((opt) => {
            const valueMap: Record<string, boolean> = {
              allowLearn,
              allowCopy,
              allowComment,
              showCreatorInfo,
            };
            const value = valueMap[opt.key];
            const setters: Record<string, (v: boolean) => void> = {
              allowLearn: setAllowLearn,
              allowCopy: setAllowCopy,
              allowComment: setAllowComment,
              showCreatorInfo: setShowCreatorInfo,
            };
            const setter = setters[opt.key];
            return (
              <div
                key={opt.key}
                className="flex items-center gap-4 p-4"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#6366F1' }}
                >
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{opt.desc}</div>
                </div>
                <button
                  onClick={() => canEdit && setter(!value)}
                  disabled={!canEdit}
                  className="w-11 h-6 rounded-full p-0.5 transition-all flex-shrink-0"
                  style={{
                    background: value ? 'linear-gradient(135deg, #6366F1, #06B6D4)' : 'rgba(255,255,255,0.1)',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    opacity: canEdit ? 1 : 0.6,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white transition-transform shadow-md"
                    style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center gap-3">
        {settings?.status === 'approved' ? (
          <button
            onClick={handleRemove}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <XCircle className="w-4 h-4" />
            {submitting ? '处理中...' : '下架内容'}
          </button>
        ) : settings?.status === 'pending' ? (
          <button
            onClick={handleWithdraw}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: 'rgba(251, 191, 36, 0.15)',
              color: '#FBBF24',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            {submitting ? '处理中...' : '撤回审核'}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-white"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Upload className="w-4 h-4" />
            {submitting ? '提交中...' : '提交审核'}
          </button>
        )}
      </div>

      {/* 温馨提示 */}
      <div
        className="rounded-xl p-4 mt-4"
        style={{
          background: 'rgba(34, 211, 238, 0.05)',
          border: '1px solid rgba(34, 211, 238, 0.2)',
        }}
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#06B6D4' }} />
          <div className="text-xs space-y-1" style={{ color: '#94A3B8' }}>
            <p>• 提交后内容将进入审核队列，审核通过后公开发布</p>
            <p>• 审核周期通常为 1-3 个工作日，请耐心等待</p>
            <p>• 发布后可在创作者中心查看数据统计和收益</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSettings;
