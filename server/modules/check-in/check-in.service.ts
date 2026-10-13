import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { checkInRecords, learners } from '@server/database/schema';
import { eq, and, desc, gte, lt, sql } from 'drizzle-orm';
import type { CheckInRecord } from '@shared/api.interface';

interface CheckInStats {
  continuousDays: number;
  totalDays: number;
  monthDays: number;
}

@Injectable()
export class CheckInService {
  private readonly logger = new Logger(CheckInService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async createOrUpdate(
    userId: string,
    dto: {
      studyMinutes?: number;
      wordsLearned?: number;
      sentencesCompleted?: number;
      chineseLessonsLearned?: number;
      mathTopicsLearned?: number;
    },
  ): Promise<CheckInRecord> {
    const studyMinutes = dto.studyMinutes ?? 0;
    const wordsLearned = dto.wordsLearned ?? 0;
    const sentencesCompleted = dto.sentencesCompleted ?? 0;
    const chineseLessonsLearned = dto.chineseLessonsLearned ?? 0;
    const mathTopicsLearned = dto.mathTopicsLearned ?? 0;

    if (studyMinutes < 0 || wordsLearned < 0 || sentencesCompleted < 0
        || chineseLessonsLearned < 0 || mathTopicsLearned < 0) {
      throw new BadRequestException('打卡数据不能为负数');
    }

    try {
      return await this.db.transaction(async (tx) => {
        // 查询今日是否已有打卡记录
        const todayRecords = await tx
          .select()
          .from(checkInRecords)
          .where(
            and(
              eq(checkInRecords.userProfile, userId),
              sql`${checkInRecords.checkInDate} = CURRENT_DATE`,
            ),
          );

        const isFirstCheckInToday = todayRecords.length === 0;
        let recordId: string;

        if (isFirstCheckInToday) {
          // 创建今日打卡记录
          const inserted = await tx
            .insert(checkInRecords)
           .values({
               userProfile: userId,
               checkInDate: sql`CURRENT_DATE`,
               studyMinutes,
               wordsLearned,
               sentencesCompleted,
               chineseLessonsLearned,
               mathTopicsLearned,
             })
            .returning({ id: checkInRecords.id });
          recordId = inserted[0].id;
        } else {
          // 更新今日打卡记录（累加）
          const existing = todayRecords[0];
          const updated = await tx
            .update(checkInRecords)
             .set({
               studyMinutes: (existing.studyMinutes ?? 0) + studyMinutes,
               wordsLearned: (existing.wordsLearned ?? 0) + wordsLearned,
               sentencesCompleted: (existing.sentencesCompleted ?? 0) + sentencesCompleted,
               chineseLessonsLearned: (existing.chineseLessonsLearned ?? 0) + chineseLessonsLearned,
               mathTopicsLearned: (existing.mathTopicsLearned ?? 0) + mathTopicsLearned,
             })
            .where(eq(checkInRecords.id, existing.id))
            .returning({ id: checkInRecords.id });
          recordId = updated[0].id;
        }

        // 更新 learners 表统计
         await this.updateLearnerStats(tx, userId, {
           studyMinutes,
           wordsLearned,
           sentencesCompleted,
           chineseLessonsLearned,
           mathTopicsLearned,
           isNewCheckIn: isFirstCheckInToday,
         });

        // 返回最新记录
        const result = await tx
         .select({
             id: checkInRecords.id,
             checkInDate: checkInRecords.checkInDate,
             studyMinutes: checkInRecords.studyMinutes,
             wordsLearned: checkInRecords.wordsLearned,
             sentencesCompleted: checkInRecords.sentencesCompleted,
             chineseLessonsLearned: checkInRecords.chineseLessonsLearned,
             mathTopicsLearned: checkInRecords.mathTopicsLearned,
           })
           .from(checkInRecords)
           .where(eq(checkInRecords.id, recordId));

        return this.mapToCheckInRecord(result[0]);
      });
    } catch (error) {
      this.logger.error('打卡失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private async updateLearnerStats(
    tx: PostgresJsDatabase,
    userId: string,
    stats: {
      studyMinutes: number;
      wordsLearned: number;
      sentencesCompleted: number;
      chineseLessonsLearned: number;
      mathTopicsLearned: number;
      isNewCheckIn: boolean;
    },
  ): Promise<void> {
    // 查找学习者记录
    const learnerRecords = await tx
      .select()
      .from(learners)
      .where(eq(learners.userProfile, userId))
      .limit(1);

    if (learnerRecords.length === 0) {
      let continuousDays = 1;

      const yesterdayRecord = await tx
        .select({ id: checkInRecords.id })
        .from(checkInRecords)
        .where(
          and(
            eq(checkInRecords.userProfile, userId),
            sql`${checkInRecords.checkInDate} = CURRENT_DATE - INTERVAL '1 day'`,
          ),
        )
        .limit(1);

      if (yesterdayRecord.length === 0 && stats.isNewCheckIn) {
        continuousDays = 1;
      } else if (stats.isNewCheckIn) {
        continuousDays = 1;
      }

      await tx.insert(learners).values({
        userProfile: userId,
        totalStudyMinutes: stats.studyMinutes,
        totalWords: stats.wordsLearned,
        totalChineseLessons: stats.chineseLessonsLearned,
        totalMathTopics: stats.mathTopicsLearned,
        continuousCheckInDays: continuousDays,
        totalCheckInDays: stats.isNewCheckIn ? 1 : 0,
      });
      return;
    }

    const learner = learnerRecords[0];

    if (stats.isNewCheckIn) {
      const yesterdayRecord = await tx
        .select({ id: checkInRecords.id })
        .from(checkInRecords)
        .where(
          and(
            eq(checkInRecords.userProfile, userId),
            sql`${checkInRecords.checkInDate} = CURRENT_DATE - INTERVAL '1 day'`,
          ),
        )
        .limit(1);

      const hasYesterdayRecord = yesterdayRecord.length > 0;

      await tx.update(learners)
        .set({
          totalStudyMinutes: sql`${learners.totalStudyMinutes} + ${stats.studyMinutes}`,
          totalWords: sql`${learners.totalWords} + ${stats.wordsLearned}`,
          totalChineseLessons: sql`${learners.totalChineseLessons} + ${stats.chineseLessonsLearned}`,
          totalMathTopics: sql`${learners.totalMathTopics} + ${stats.mathTopicsLearned}`,
          continuousCheckInDays: sql`
            CASE 
              WHEN ${hasYesterdayRecord ? 1 : 0} = 1 THEN ${learners.continuousCheckInDays} + 1
              ELSE 1
            END
          `,
          totalCheckInDays: sql`${learners.totalCheckInDays} + 1`,
        })
        .where(eq(learners.id, learner.id));
    } else {
      await tx.update(learners)
        .set({
          totalStudyMinutes: sql`${learners.totalStudyMinutes} + ${stats.studyMinutes}`,
          totalWords: sql`${learners.totalWords} + ${stats.wordsLearned}`,
          totalChineseLessons: sql`${learners.totalChineseLessons} + ${stats.chineseLessonsLearned}`,
          totalMathTopics: sql`${learners.totalMathTopics} + ${stats.mathTopicsLearned}`,
        })
        .where(eq(learners.id, learner.id));
    }
  }

  async getTodayStatus(userId: string): Promise<{ checkedIn: boolean; record?: CheckInRecord }> {
    try {
       const records = await this.db
         .select({
           id: checkInRecords.id,
           checkInDate: checkInRecords.checkInDate,
           studyMinutes: checkInRecords.studyMinutes,
           wordsLearned: checkInRecords.wordsLearned,
           sentencesCompleted: checkInRecords.sentencesCompleted,
           chineseLessonsLearned: checkInRecords.chineseLessonsLearned,
           mathTopicsLearned: checkInRecords.mathTopicsLearned,
         })
         .from(checkInRecords)
         .where(
           and(
             eq(checkInRecords.userProfile, userId),
             sql`${checkInRecords.checkInDate} = CURRENT_DATE`,
           ),
         )
         .limit(1);

      if (records.length === 0) {
        return { checkedIn: false };
      }

      return {
        checkedIn: true,
        record: this.mapToCheckInRecord(records[0]),
      };
    } catch (error) {
      this.logger.error('获取今日打卡状态失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getHistory(userId: string): Promise<CheckInRecord[]> {
    try {
       const records = await this.db
         .select({
           id: checkInRecords.id,
           checkInDate: checkInRecords.checkInDate,
           studyMinutes: checkInRecords.studyMinutes,
           wordsLearned: checkInRecords.wordsLearned,
           sentencesCompleted: checkInRecords.sentencesCompleted,
           chineseLessonsLearned: checkInRecords.chineseLessonsLearned,
           mathTopicsLearned: checkInRecords.mathTopicsLearned,
         })
         .from(checkInRecords)
         .where(
           and(
             eq(checkInRecords.userProfile, userId),
             sql`${checkInRecords.checkInDate} >= CURRENT_DATE - INTERVAL '29 days'`,
           ),
         )
         .orderBy(desc(checkInRecords.checkInDate))
         .limit(30);

      return records.map((r) => this.mapToCheckInRecord(r));
    } catch (error) {
      this.logger.error('获取打卡历史失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getStats(userId: string): Promise<CheckInStats> {
    try {
      // 从 learners 表获取连续打卡天数和总打卡天数
      const learnerRecords = await this.db
        .select({
          continuousCheckInDays: learners.continuousCheckInDays,
          totalCheckInDays: learners.totalCheckInDays,
        })
        .from(learners)
        .where(eq(learners.userProfile, userId))
        .limit(1);

      let continuousDays = 0;
      let totalDays = 0;

      if (learnerRecords.length > 0) {
        continuousDays = learnerRecords[0].continuousCheckInDays ?? 0;
        totalDays = learnerRecords[0].totalCheckInDays ?? 0;
      }

      // 计算本月打卡天数
      const monthResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(checkInRecords)
        .where(
          and(
            eq(checkInRecords.userProfile, userId),
            sql`${checkInRecords.checkInDate} >= date_trunc('month', CURRENT_DATE)::date`,
            sql`${checkInRecords.checkInDate} < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
          ),
        );

      const monthDays = Number(monthResult[0]?.count ?? 0);

      return {
        continuousDays,
        totalDays,
        monthDays,
      };
    } catch (error) {
      this.logger.error('获取打卡统计失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private mapToCheckInRecord(row: {
    id: string;
    checkInDate: string;
    studyMinutes: number | null;
    wordsLearned: number | null;
    sentencesCompleted: number | null;
    chineseLessonsLearned: number | null;
    mathTopicsLearned: number | null;
  }): CheckInRecord {
    return {
      id: row.id,
      checkInDate: row.checkInDate,
      studyMinutes: row.studyMinutes ?? 0,
      wordsLearned: row.wordsLearned ?? 0,
      sentencesCompleted: row.sentencesCompleted ?? 0,
      chineseLessonsLearned: row.chineseLessonsLearned ?? 0,
      mathTopicsLearned: row.mathTopicsLearned ?? 0,
    };
  }
}
