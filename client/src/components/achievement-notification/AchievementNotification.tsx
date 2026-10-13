import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import { logger } from '@lark-apaas/client-toolkit/logger';
import LevelUpModal from './LevelUpModal';
import BadgeToast from './BadgeToast';
import PointsFloat from './PointsFloat';
import type {
  BadgeItem,
  EarnPointsResult,
} from '@shared/api.interface';

interface LevelUpNotification {
  id: string;
  level: number;
  levelName: string;
}

interface BadgeNotification {
  id: string;
  badge: BadgeItem;
}

interface PointsNotification {
  id: string;
  points: number;
  reason: string;
}

interface AchievementContextValue {
  showLevelUp: (level: number, levelName: string) => void;
  showNewBadge: (badge: BadgeItem) => void;
  showPointsGain: (points: number, reason: string) => void;
  handleEarnResult: (result: EarnPointsResult) => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

let notificationIdCounter = 0;
const genId = (): string => {
  notificationIdCounter += 1;
  return `achv_${Date.now()}_${notificationIdCounter}`;
};

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [levelUp, setLevelUp] = useState<LevelUpNotification | null>(null);
  const [badges, setBadges] = useState<BadgeNotification[]>([]);
  const [points, setPoints] = useState<PointsNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const clearTimer = useCallback((id: string): void => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const showLevelUp = useCallback(
    (level: number, levelName: string): void => {
      const id = genId();
      setLevelUp({ id, level, levelName });
      logger.info('Achievement level up shown', { level, levelName });
      const timer = setTimeout((): void => {
        setLevelUp((prev): LevelUpNotification | null =>
          prev?.id === id ? null : prev,
        );
        clearTimer(id);
      }, 3000);
      timersRef.current.set(id, timer);
    },
    [clearTimer],
  );

  const dismissLevelUp = useCallback((): void => {
    if (levelUp) {
      clearTimer(levelUp.id);
      setLevelUp(null);
    }
  }, [levelUp, clearTimer]);

  const showNewBadge = useCallback(
    (badge: BadgeItem): void => {
      const id = genId();
      setBadges((prev: BadgeNotification[]): BadgeNotification[] => [
        ...prev,
        { id, badge },
      ]);
      logger.info('Achievement new badge shown', { badgeId: badge.id });
      const timer = setTimeout((): void => {
        setBadges((prev: BadgeNotification[]): BadgeNotification[] =>
          prev.filter((b: BadgeNotification): boolean => b.id !== id),
        );
        clearTimer(id);
      }, 2500);
      timersRef.current.set(id, timer);
    },
    [clearTimer],
  );

  const showPointsGain = useCallback(
    (pointsValue: number, reason: string): void => {
      const id = genId();
      setPoints((prev: PointsNotification[]): PointsNotification[] => [
        ...prev,
        { id, points: pointsValue, reason },
      ]);
      const timer = setTimeout((): void => {
        setPoints((prev: PointsNotification[]): PointsNotification[] =>
          prev.filter((p: PointsNotification): boolean => p.id !== id),
        );
        clearTimer(id);
      }, 1500);
      timersRef.current.set(id, timer);
    },
    [clearTimer],
  );

  const handleEarnResult = useCallback(
    (result: EarnPointsResult): void => {
      if (result.pointsEarned > 0) {
        showPointsGain(result.pointsEarned, '完成任务');
      }
      if (result.leveledUp && result.newLevel && result.newLevelName) {
        setTimeout((): void => {
          showLevelUp(result.newLevel as number, result.newLevelName as string);
        }, 400);
      }
      if (result.newBadges && result.newBadges.length > 0) {
        result.newBadges.forEach((b: BadgeItem, idx: number): void => {
          setTimeout((): void => {
            showNewBadge(b);
          }, 800 + idx * 600);
        });
      }
    },
    [showLevelUp, showNewBadge, showPointsGain],
  );

  const value: AchievementContextValue = {
    showLevelUp,
    showNewBadge,
    showPointsGain,
    handleEarnResult,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}

      {/* 升级通知（居中弹窗） */}
      <AnimatePresence>
        {levelUp && (
          <LevelUpModal
            level={levelUp.level}
            levelName={levelUp.levelName}
            onClose={dismissLevelUp}
          />
        )}
      </AnimatePresence>

      {/* 新勋章通知（右上角滑入） */}
      <div className="fixed top-4 right-4 z-[99] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {badges.map((n: BadgeNotification) => (
            <BadgeToast key={n.id} badge={n.badge} />
          ))}
        </AnimatePresence>
      </div>

      {/* 积分飘字（右上角向上飘） */}
      <div className="fixed top-20 right-6 z-[98] flex flex-col items-end gap-2 pointer-events-none">
        <AnimatePresence>
          {points.map((n: PointsNotification, idx: number) => (
            <PointsFloat key={n.id} points={n.points} index={idx} />
          ))}
        </AnimatePresence>
      </div>
    </AchievementContext.Provider>
  );
};

export function useAchievement(): AchievementContextValue {
  const ctx = useContext(AchievementContext);
  if (!ctx) {
    logger.warn(
      'useAchievement called outside AchievementProvider; returning no-op stubs',
    );
    return {
      showLevelUp: (): void => {},
      showNewBadge: (): void => {},
      showPointsGain: (): void => {},
      handleEarnResult: (): void => {},
    };
  }
  return ctx;
}

export default AchievementProvider;
