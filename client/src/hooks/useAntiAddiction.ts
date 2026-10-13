import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { antiAddictionApi } from '@client/src/api';
import type { AntiAddictionStatus } from '@shared/api.interface';

interface UseAntiAddictionReturn {
  status: AntiAddictionStatus | null;
  showWarn: boolean;
  showLock: boolean;
  dismissWarn: () => void;
  parentExtend: (password: string) => Promise<boolean>;
}

export function useAntiAddiction(moduleName?: string): UseAntiAddictionReturn {
  const [status, setStatus] = useState<AntiAddictionStatus | null>(null);
  const [showWarn, setShowWarn] = useState<boolean>(false);
  const [warnDismissed, setWarnDismissed] = useState<boolean>(false);
  const sessionIdRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);

  const dismissWarn = useCallback((): void => {
    setShowWarn(false);
    setWarnDismissed(true);
  }, []);

  const parentExtend = useCallback(async (password: string): Promise<boolean> => {
    try {
      const result = await antiAddictionApi.extendUsage(password, 30);
      if (result.ok) {
        const updated = await antiAddictionApi.getStatus();
        setStatus(updated);
      }
      return result.ok;
    } catch (err) {
      logger.error({ level: 'error', args: ['家长授权延长失败', err] });
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let enabled = false;

    const startSession = async (): Promise<void> => {
      try {
        const session = await antiAddictionApi.startSession(moduleName);
        sessionIdRef.current = session.sessionId;
        const initialStatus = await antiAddictionApi.getStatus();
        if (!mounted) return;
        setStatus(initialStatus);
        enabled = initialStatus.ageGroup !== 'adult';
      } catch (err) {
        logger.error({ level: 'error', args: ['开启防沉迷会话失败', err] });
      }
    };

    startSession();

    const poll = (): void => {
      timerRef.current = window.setInterval(async () => {
        if (!enabled) return;
        try {
          if (sessionIdRef.current) {
            await antiAddictionApi.heartbeat(sessionIdRef.current);
          }
          const updated = await antiAddictionApi.getStatus();
          if (!mounted) return;
          setStatus(updated);
          if (
            !warnDismissed &&
            updated.currentSessionMinutes >= updated.warnAtMinutes &&
            updated.warnAtMinutes > 0 &&
            !updated.isLocked
          ) {
            setShowWarn(true);
          }
        } catch (err) {
          logger.error({ level: 'error', args: ['防沉迷状态轮询失败', err] });
        }
      }, 60000);
    };

    // 首屏延迟 2 秒后开始轮询，避免与启动请求堆叠
    const startTimer = window.setTimeout(poll, 2000);

    return () => {
      mounted = false;
      window.clearTimeout(startTimer);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (sessionIdRef.current) {
        antiAddictionApi.endSession(sessionIdRef.current).catch((err) => {
          logger.error({ level: 'error', args: ['结束防沉迷会话失败', err] });
        });
      }
    };
  }, [moduleName, warnDismissed]);

  return {
    status,
    showWarn,
    showLock: status?.isLocked ?? false,
    dismissWarn,
    parentExtend,
  };
}

export default useAntiAddiction;
