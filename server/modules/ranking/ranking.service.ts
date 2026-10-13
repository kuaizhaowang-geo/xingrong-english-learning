import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase, AuthNPaasService } from '@lark-apaas/fullstack-nestjs-core';
import { learners, checkInRecords, userSentenceRecords, userDictationRecords, pkMatchRecords, typingStats } from '@server/database/schema';
import { eq, desc, gte, sql, inArray } from 'drizzle-orm';
import type { RankItem, RankingType, RankingPeriod } from '@shared/api.interface';

interface UserStats {
  userId: string;
  studyMinutes: number;
  wins: number;
  totalMatches: number;
  level: string;
  typingWpm: number;
  typingAccuracy: number;
}

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly authnPaasService: AuthNPaasService,
  ) {}

  async getRanking(
    type: RankingType = 'studyTime',
    period: RankingPeriod = 'weekly',
    currentUserId?: string,
  ): Promise<{ items: RankItem[]; myRank: RankItem | null }> {
    this.validateParams(type, period);

    const periodStartIso = this.getPeriodStart(period).toISOString();
    const allStats = await this.computeAllStats(periodStartIso);

    // Sort by the requested metric
    const sorted = this.sortByType(allStats, type);

    // Build rank list (top 50)
    const topItems = sorted.slice(0, 50);

    // Resolve user names and avatars using AuthNPaasService
    const userIds = topItems.map((s) => s.userId);

    const userProfileMap = new Map<string, { userName: string; avatarUrl?: string }>();
    if (userIds.length > 0) {
      try {
        const userInfos = await this.authnPaasService.listUsersByIds(userIds);
        for (let i = 0; i < userInfos.length; i += 1) {
          const u = userInfos[i];
          const uid = userIds[i];
          if (u) {
            userProfileMap.set(uid, {
              userName: u.name?.zh_cn ?? u.name?.en_us ?? `学习者${uid.slice(-4)}`,
              avatarUrl: u.avatar?.image?.large ?? u.avatar?.image?.medium ?? undefined,
            });
          }
        }
      } catch (err) {
        this.logger.error(`获取用户信息失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const items: RankItem[] = topItems.map((s, idx): RankItem => {
      const profile = userProfileMap.get(s.userId);
      return {
        rank: idx + 1,
        userId: s.userId,
        userName: profile?.userName || `学习者${s.userId.slice(-4)}`,
        avatarUrl: profile?.avatarUrl,
        value: this.getValueForType(s, type),
        studyMinutes: s.studyMinutes,
        wins: s.wins,
        totalMatches: s.totalMatches,
        level: s.level,
        typingWpm: s.typingWpm || 0,
        typingAccuracy: s.typingAccuracy || 0,
      };
    });

    // Compute my rank
    let myRank: RankItem | null = null;
    if (currentUserId) {
      const userIdx = sorted.findIndex((s) => s.userId === currentUserId);
      if (userIdx >= 0) {
        const s = sorted[userIdx];
        const profile = userProfileMap.get(s.userId);
        myRank = {
          rank: userIdx + 1,
          userId: s.userId,
          userName: profile?.userName || `学习者${s.userId.slice(-4)}`,
          avatarUrl: profile?.avatarUrl,
          value: this.getValueForType(s, type),
          studyMinutes: s.studyMinutes,
          wins: s.wins,
          totalMatches: s.totalMatches,
          level: s.level,
          typingWpm: s.typingWpm || 0,
          typingAccuracy: s.typingAccuracy || 0,
        };
      } else {
        // Current user not in list — build entry with zero values
        const learnerRow = await this.db
          .select({
            userProfile: learners.userProfile,
            level: learners.level,
          })
          .from(learners)
          .where(eq(learners.userProfile, currentUserId))
          .limit(1);
        const level = learnerRow[0]?.level || 'beginner';
        myRank = {
          rank: 0,
          userId: currentUserId,
          userName: '我',
          value: 0,
          studyMinutes: 0,
          wins: 0,
          totalMatches: 0,
          level: level,
          typingWpm: 0,
          typingAccuracy: 0,
        };
      }
    }

    return { items, myRank };
  }

  // --- Private helpers ---

  private validateParams(type: string, period: string): void {
    const validTypes: RankingType[] = ['studyTime', 'wins', 'winRate', 'typingWpm', 'typingAccuracy'];
    const validPeriods: RankingPeriod[] = ['weekly', 'monthly', 'yearly'];
    if (!validTypes.includes(type as RankingType)) {
      throw new BadRequestException(`无效的排行榜类型: ${type}`);
    }
    if (!validPeriods.includes(period as RankingPeriod)) {
      throw new BadRequestException(`无效的排行榜周期: ${period}`);
    }
  }

  private getPeriodStart(period: RankingPeriod): Date {
    const now = new Date();
    const result = new Date(now);
    result.setHours(0, 0, 0, 0);

    if (period === 'weekly') {
      // Monday as first day of week (0=Sun, 1=Mon ... 6=Sat)
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      result.setDate(now.getDate() + diff);
    } else if (period === 'monthly') {
      result.setDate(1);
    } else if (period === 'yearly') {
      result.setMonth(0, 1);
    }
    return result;
  }

  /**
   * Compute aggregated stats for all users within the period.
   */
  private async computeAllStats(periodStartIso: string): Promise<UserStats[]> {
    const statsMap = new Map<string, UserStats>();

    // 1. Study minutes from check_in_records
    try {
      const studyRows = await this.db
        .select({
          userId: checkInRecords.userProfile,
          totalMinutes: sql<number>`COALESCE(SUM(${checkInRecords.studyMinutes}), 0)`,
        })
        .from(checkInRecords)
        .where(gte(checkInRecords.checkInDate, sql`${periodStartIso}::date`))
        .groupBy(checkInRecords.userProfile);

      for (const row of studyRows) {
        const uid = String(row.userId ?? '');
        if (!uid) continue;
        statsMap.set(uid, {
          userId: uid,
          studyMinutes: Number(row.totalMinutes ?? 0),
          wins: 0,
          totalMatches: 0,
          level: 'beginner',
          typingWpm: 0,
          typingAccuracy: 0,
        });
      }
    } catch (err) {
      this.logger.error(`check_in_records 聚合失败: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 2. Add time from sentence records (time_spent_seconds + estimated time per correct answer)
    try {
      const sentenceRows = await this.db
        .select({
          userId: userSentenceRecords.userProfile,
          totalSeconds: sql<number>`COALESCE(SUM(${userSentenceRecords.timeSpentSeconds}), 0)`,
          correctCount: sql<number>`COALESCE(SUM(CASE WHEN ${userSentenceRecords.isCorrect} THEN 1 ELSE 0 END), 0)`,
          totalCount: sql<number>`COUNT(*)`,
        })
        .from(userSentenceRecords)
        .where(gte(userSentenceRecords.createdAt, sql`${periodStartIso}::timestamptz`))
        .groupBy(userSentenceRecords.userProfile);

      for (const row of sentenceRows) {
        const uid = String(row.userId ?? '');
        if (!uid) continue;
        const seconds = Number(row.totalSeconds ?? 0);
        const correctCount = Number(row.correctCount ?? 0);
        const totalCount = Number(row.totalCount ?? 0);
        const existing = statsMap.get(uid);
        if (existing) {
          existing.studyMinutes += Math.round(seconds / 60);
          // use sentence corrects as "wins" fallback if no PK data
          existing.wins = Math.max(existing.wins, correctCount);
          existing.totalMatches = Math.max(existing.totalMatches, totalCount);
        } else {
          statsMap.set(uid, {
            userId: uid,
            studyMinutes: Math.round(seconds / 60),
            wins: correctCount,
            totalMatches: totalCount,
            level: 'beginner',
            typingWpm: 0,
            typingAccuracy: 0,
          });
        }
      }
    } catch (err) {
      this.logger.error(`user_sentence_records 聚合失败: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 3. Add dictation time estimate (30 seconds per attempt)
    try {
      const dictationRows = await this.db
        .select({
          userId: userDictationRecords.userProfile,
          totalAttempts: sql<number>`COALESCE(SUM(${userDictationRecords.attempts}), 0)`,
          correctCount: sql<number>`COALESCE(SUM(CASE WHEN ${userDictationRecords.isCorrect} THEN 1 ELSE 0 END), 0)`,
          totalCount: sql<number>`COUNT(*)`,
        })
        .from(userDictationRecords)
        .where(gte(userDictationRecords.createdAt, sql`${periodStartIso}::timestamptz`))
        .groupBy(userDictationRecords.userProfile);

      for (const row of dictationRows) {
        const uid = String(row.userId ?? '');
        if (!uid) continue;
        const attempts = Number(row.totalAttempts ?? 0);
        const minutes = Math.round((attempts * 30) / 60);
        const existing = statsMap.get(uid);
        if (existing) {
          existing.studyMinutes += minutes;
          existing.wins += Number(row.correctCount ?? 0);
          existing.totalMatches += Number(row.totalCount ?? 0);
        } else {
          statsMap.set(uid, {
            userId: uid,
            studyMinutes: minutes,
            wins: Number(row.correctCount ?? 0),
            totalMatches: Number(row.totalCount ?? 0),
            level: 'beginner',
            typingWpm: 0,
            typingAccuracy: 0,
          });
        }
      }
    } catch (err) {
      this.logger.error(`user_dictation_records 聚合失败: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 4. PK match records (override wins/totalMatches from pk_match_records if available)
    try {
      const pkRows = await this.db
        .select({
          userId: pkMatchRecords.userProfile,
          wins: sql<number>`COALESCE(SUM(CASE WHEN ${pkMatchRecords.result} = 'win' THEN 1 ELSE 0 END), 0)`,
          total: sql<number>`COUNT(*)`,
        })
        .from(pkMatchRecords)
        .where(gte(pkMatchRecords.createdAt, sql`${periodStartIso}::timestamptz`))
        .groupBy(pkMatchRecords.userProfile);

      for (const row of pkRows) {
        const uid = String(row.userId ?? '');
        if (!uid) continue;
        const winCount = Number(row.wins ?? 0);
        const totalCount = Number(row.total ?? 0);
        const existing = statsMap.get(uid);
        if (existing) {
          existing.wins = Math.max(existing.wins, winCount);
          existing.totalMatches = Math.max(existing.totalMatches, totalCount);
        } else {
          statsMap.set(uid, {
            userId: uid,
            studyMinutes: 0,
            wins: winCount,
            totalMatches: totalCount,
            level: 'beginner',
            typingWpm: 0,
            typingAccuracy: 0,
          });
        }
      }
    } catch (err) {
      this.logger.error(`pk_match_records 聚合失败: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 5. Typing stats (best WPM / best accuracy + practice time contribution)
    try {
      const typingRows = await this.db
        .select({
          userId: typingStats.userId,
          bestWpm: typingStats.bestWpm,
          bestAccuracy: typingStats.bestAccuracy,
          totalPracticeTime: typingStats.totalPracticeTime,
        })
        .from(typingStats);

      for (const row of typingRows) {
        const uid = String(row.userId ?? '');
        if (!uid) continue;
        const bestWpm = Number(row.bestWpm ?? 0);
        const bestAccuracy = Number(row.bestAccuracy ?? 0);
        const practiceSeconds = Number(row.totalPracticeTime ?? 0);
        const practiceMinutes = Math.round(practiceSeconds / 60);
        const existing = statsMap.get(uid);
        if (existing) {
          existing.typingWpm = Math.max(existing.typingWpm, bestWpm);
          existing.typingAccuracy = Math.max(existing.typingAccuracy, bestAccuracy);
          existing.studyMinutes += practiceMinutes;
        } else {
          statsMap.set(uid, {
            userId: uid,
            studyMinutes: practiceMinutes,
            wins: 0,
            totalMatches: 0,
            level: 'beginner',
            typingWpm: bestWpm,
            typingAccuracy: bestAccuracy,
          });
        }
      }
    } catch (err) {
      this.logger.error(`typing_stats 聚合失败: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 6. Get learner levels
    const allUserIds = Array.from(statsMap.keys());
    if (allUserIds.length > 0) {
      try {
        const learnerRows = await this.db
          .select({
            userProfile: learners.userProfile,
            level: learners.level,
          })
          .from(learners)
          .where(inArray(learners.userProfile, allUserIds));
        for (const row of learnerRows) {
          const uid = String(row.userProfile ?? '');
          const stat = statsMap.get(uid);
          if (stat && row.level) {
            stat.level = row.level;
          }
        }
      } catch (err) {
        this.logger.error(`learners 查询失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return Array.from(statsMap.values()).filter(
      (s) => s.studyMinutes > 0 || s.wins > 0 || s.typingWpm > 0,
    );
  }

  private getValueForType(stats: UserStats, type: RankingType): number {
    if (type === 'studyTime') return stats.studyMinutes;
    if (type === 'wins') return stats.wins;
    if (type === 'winRate') {
      if (stats.totalMatches < 5) return 0;
      return Math.round((stats.wins / stats.totalMatches) * 10000) / 100; // percentage with 2 decimals
    }
    if (type === 'typingWpm') return stats.typingWpm;
    if (type === 'typingAccuracy') return stats.typingAccuracy;
    return 0;
  }

  private sortByType(stats: UserStats[], type: RankingType): UserStats[] {
    const copy = [...stats];
    if (type === 'studyTime') {
      copy.sort((a, b) => b.studyMinutes - a.studyMinutes || b.wins - a.wins);
    } else if (type === 'wins') {
      copy.sort((a, b) => b.wins - a.wins || b.studyMinutes - a.studyMinutes);
    } else if (type === 'winRate') {
      // Only include users with >= 5 matches for winRate ranking
      const eligible = copy.filter((s) => s.totalMatches >= 5);
      eligible.sort((a, b) => {
        const rateA = a.wins / a.totalMatches;
        const rateB = b.wins / b.totalMatches;
        return rateB - rateA || b.wins - a.wins;
      });
      return eligible;
    } else if (type === 'typingWpm') {
      copy.sort((a, b) => b.typingWpm - a.typingWpm || b.typingAccuracy - a.typingAccuracy);
    } else if (type === 'typingAccuracy') {
      copy.sort((a, b) => b.typingAccuracy - a.typingAccuracy || b.typingWpm - a.typingWpm);
    }
    return copy;
  }
}
