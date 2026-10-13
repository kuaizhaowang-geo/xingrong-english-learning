import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Moon, Clock } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { PasswordInput } from '@client/src/components/ui/password-input';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { AntiAddictionStatus } from '@shared/api.interface';

interface ForcedRestProps {
  visible: boolean;
  status: AntiAddictionStatus | null;
  onParentExtend: (password: string) => Promise<boolean>;
}

const EYE_TIPS: string[] = [
  '👀 每用眼 20 分钟，远眺 20 英尺外的物体 20 秒',
  '🌿 多看看绿色植物，有助于放松眼部肌肉',
  '💧 多眨眼，保持眼球湿润，减少干涩感',
];

const ForcedRest: React.FC<ForcedRestProps> = ({
  visible,
  status,
  onParentExtend,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(600);

  useEffect(() => {
    if (visible && status?.lockReason === 'session_limit') {
      setCountdown(600);
    }
  }, [visible, status?.lockReason]);

  useEffect(() => {
    if (!visible || status?.lockReason !== 'session_limit') return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [visible, status?.lockReason]);

  if (!visible || !status) return null;

  const reason = status.lockReason ?? 'daily_limit';

  const tipMap: Record<string, { icon: React.ReactNode; title: string }> = {
    daily_limit: {
      icon: <Clock size={36} />,
      title: '今日使用时长已达上限，请明天再学习哦~',
    },
    session_limit: {
      icon: <Eye size={36} />,
      title: `您已经连续学习了${status.currentSessionMinutes}分钟，请休息10分钟后再继续`,
    },
    night_mode: {
      icon: <Moon size={36} />,
      title: '现在是休息时间，请明天再学习哦~',
    },
  };

  const tip = tipMap[reason] ?? tipMap.daily_limit;

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleExtend = async (): Promise<void> => {
    if (!password.trim()) {
      setError('请输入家长密码');
      return;
    }
    try {
      const ok = await onParentExtend(password);
      if (ok) {
        setShowPassword(false);
        setPassword('');
        setError('');
      } else {
        setError('密码错误，请重试');
      }
    } catch (err) {
      logger.error({ level: 'error', args: ['家长授权失败', err] });
      setError('验证失败，请稍后重试');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
      }}
    >
      <div className="w-full max-w-lg px-6 text-center text-white">
        {/* 图标 */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center bg-white/10 backdrop-blur">
          <div style={{ color: '#C4B5FD' }}>{tip.icon}</div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold mb-4 leading-relaxed">
          {tip.title}
        </h2>

        {/* 倒计时（仅 session_limit） */}
        {reason === 'session_limit' && (
          <div className="mb-6">
            <div
              className="text-5xl font-bold tabular-nums"
              style={{
                background:
                  'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {formatTime(countdown)}
            </div>
            <p className="text-sm text-indigo-200 mt-2">距离可以继续学习还有</p>
          </div>
        )}

        {/* 护眼小贴士 */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-5 mb-6 text-left border border-white/10">
          <h3 className="text-base font-semibold mb-3 text-indigo-200">
            🌱 护眼小贴士
          </h3>
          <ul className="space-y-2 text-sm text-indigo-100/80">
            {EYE_TIPS.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        {/* 家长授权 */}
        {!showPassword ? (
          <Button
            onClick={() => setShowPassword(true)}
            className="w-full text-white border-0"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
            }}
          >
            <Shield size={16} />
            家长授权延长 30 分钟
          </Button>
        ) : (
          <div className="space-y-3">
            <PasswordInput
              placeholder="请输入家长密码"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="bg-white/10 border-white/20 text-white placeholder-indigo-300/50"
              iconClassName="text-indigo-200/70 hover:text-white"
            />
            {error && (
              <p className="text-sm text-red-300 text-left">{error}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPassword(false);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                取消
              </Button>
              <Button
                onClick={handleExtend}
                className="flex-1 text-white border-0"
                style={{
                  background:
                    'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
                }}
              >
                确认授权
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForcedRest;
