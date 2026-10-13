import { useState, useEffect, useCallback } from 'react';
import { phonicsApi, achievementsApi } from '@/api';
import type {
  PhoneticItem,
  PhonicsProgressSummary,
  PhonicsProgressItem,
  PhonicsPracticeResult,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useAchievement } from '@/components/achievement-notification/AchievementNotification';

export function usePhonicsData() {
  const [allItems, setAllItems] = useState<PhoneticItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<PhonicsProgressSummary | null>(null);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const { handleEarnResult, showPointsGain } = useAchievement();

  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
       const [allRes, summaryRes, progressRes] = await Promise.all([
        phonicsApi.getPhonetics(),
        phonicsApi.getPhonicsProgressSummary(),
        phonicsApi.getPhonicsProgressList(),
      ]);
      setAllItems(
        [...allRes.items].sort(
          (a: PhoneticItem, b: PhoneticItem) => a.sortOrder - b.sortOrder,
        ),
      );
      setSummary(summaryRes);
      setLearnedIds(
        new Set(
          progressRes.items
            .filter((p: PhonicsProgressItem) => p.learned)
            .map((p) => p.phoneticId),
        ),
      );
    } catch (err: unknown) {
      logger.error('Failed to load phonics data', JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const markLearned = useCallback(async (id: string): Promise<void> => {
    if (learnedIds.has(id)) return;
    try {
      await phonicsApi.markPhoneticLearned(id);
      setLearnedIds((p) => new Set([...p, id]));
      setSummary((p) => (p ? { ...p, learnedCount: p.learnedCount + 1 } : p));
      const result = await achievementsApi.earnPoints({
        source: 'phonetics_learn',
        reason: '音标学习',
        points: 2,
      });
      handleEarnResult(result);
    } catch (err: unknown) {
      logger.error('Failed to mark learned', JSON.stringify(err));
    }
  }, [learnedIds, handleEarnResult]);

  const submitPractice = useCallback(
    async (results: PhonicsPracticeResult[]): Promise<void> => {
      try {
        await phonicsApi.recordPhonicsPractice(results);
        const correct: number = results.filter((r) => r.isCorrect).length;
        setSummary((p) => {
          if (!p) return p;
          const tp: number = p.totalPractice + results.length;
          const tc: number = p.totalCorrect + correct;
          return { ...p, totalPractice: tp, totalCorrect: tc,
            accuracy: tp > 0 ? Math.round((tc / tp) * 100) : p.accuracy };
        });
        if (correct > 0) {
          const result = await achievementsApi.earnPoints({
            source: 'phonetics_practice',
            reason: '音标练习',
            points: correct,
          });
          handleEarnResult(result);
        }
      } catch (err: unknown) {
        logger.error('Failed to record practice', JSON.stringify(err));
      }
    },
    [handleEarnResult],
  );

  const getItemsByCategory = useCallback(
    (cat: string): PhoneticItem[] =>
      allItems.filter((item) => item.category === cat),
    [allItems],
  );

  return { allItems, loading, summary, learnedIds,
    loadAll, markLearned, submitPractice, getItemsByCategory };
}
