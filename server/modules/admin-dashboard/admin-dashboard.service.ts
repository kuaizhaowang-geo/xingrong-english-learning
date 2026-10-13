import { Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import {
  and,
  count,
  desc,
  gte,
  lt,
  sql,
  sum,
} from 'drizzle-orm';

import {
  courses,
  textbooks,
  wordItems,
  sentencePuzzles,
  learners,
  checkInRecords,
  userSentenceRecords,
} from '@server/database/schema';
import type {
  DashboardStats,
  DailyStudyTrend,
  SubjectDistribution,
  UserRegisterTrend,
  AdminRankItem,
  RecentActivity,
} from '@shared/api.interface';

const SUBJECT_LABELS: Record<string, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取仪表盘统计卡片数据
   */
  async getStats(): Promise<DashboardStats> {
    const today = this.getTodayDateString();
    const tomorrow = this.getTomorrowDateString();

    // 并行执行多个统计查询
    const [
      userCountResult,
      courseCountResult,
      textbookCountResult,
      wordCountResult,
      sentenceCountResult,
      todayCheckInResult,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(learners),
      this.db.select({ count: count() }).from(courses),
      this.db.select({ count: count() }).from(textbooks),
      this.db.select({ count: count() }).from(wordItems),
      this.db.select({ count: count() }).from(sentencePuzzles),
      this.db
        .select({
          totalMinutes: sum(checkInRecords.studyMinutes),
          userCount: sql<number>`count(distinct (${checkInRecords.userProfile}).user_id)`,
          checkInCount: count(),
        })
        .from(checkInRecords)
        .where(
          and(
            gte(checkInRecords.checkInDate, today),
            lt(checkInRecords.checkInDate, tomorrow),
          ),
        ),
    ]);

    const todayRow = todayCheckInResult[0];

    return {
      totalUsers: Number(userCountResult[0]?.count ?? 0),
      totalCourses: Number(courseCountResult[0]?.count ?? 0),
      totalTextbooks: Number(textbookCountResult[0]?.count ?? 0),
      totalWords: Number(wordCountResult[0]?.count ?? 0),
      totalSentences: Number(sentenceCountResult[0]?.count ?? 0),
      todayStudyMinutes: Number(todayRow?.totalMinutes ?? 0),
      todayActiveUsers: Number(todayRow?.userCount ?? 0),
      todayCheckIns: Number(todayRow?.checkInCount ?? 0),
    };
  }

  /**
   * 近 N 日学习时长趋势
   */
  async getStudyTrend(days = 7): Promise<DailyStudyTrend[]> {
    const { startDate, endDate } = this.getDateRange(days);

    const rows = await this.db
      .select({
        date: checkInRecords.checkInDate,
        minutes: sum(checkInRecords.studyMinutes),
        users: sql<number>`count(distinct (${checkInRecords.userProfile}).user_id)`,
      })
      .from(checkInRecords)
      .where(
        and(
          gte(checkInRecords.checkInDate, startDate),
          lt(checkInRecords.checkInDate, endDate),
        ),
      )
      .groupBy(checkInRecords.checkInDate)
      .orderBy(checkInRecords.checkInDate);

    // 构造完整日期序列，填充无数据的日期
    const resultMap = new Map<string, { minutes: number; users: number }>();
    for (const row of rows) {
      resultMap.set(String(row.date), {
        minutes: Number(row.minutes ?? 0),
        users: Number(row.users ?? 0),
      });
    }

    const result: DailyStudyTrend[] = [];
    for (let i = 0; i < days; i += 1) {
      const dateStr = this.formatDate(this.addDays(new Date(startDate), i));
      const data = resultMap.get(dateStr) ?? { minutes: 0, users: 0 };
      result.push({
        date: dateStr,
        minutes: data.minutes,
        users: data.users,
      });
    }

    return result;
  }

  /**
   * 教材学科分布
   */
  async getSubjectDistribution(): Promise<SubjectDistribution[]> {
    const rows = await this.db
      .select({
        subject: textbooks.subject,
        count: count(),
      })
      .from(textbooks)
      .groupBy(textbooks.subject);

    return rows.map((row) => ({
      subject: row.subject,
      label: SUBJECT_LABELS[row.subject] ?? row.subject,
      count: Number(row.count),
    }));
  }

  /**
   * 近 N 日用户注册增长趋势
   */
  async getRegisterTrend(days = 7): Promise<UserRegisterTrend[]> {
    const { startDate, endDate } = this.getDateRange(days);

    const rows = await this.db
      .select({
        date: sql<string>`${learners.createdAt}::date`,
        count: count(),
      })
      .from(learners)
      .where(
        and(
          gte(learners.createdAt, new Date(startDate)),
          lt(learners.createdAt, new Date(endDate)),
        ),
      )
      .groupBy(sql`${learners.createdAt}::date`)
      .orderBy(sql`${learners.createdAt}::date`);

    const resultMap = new Map<string, number>();
    for (const row of rows) {
      resultMap.set(String(row.date), Number(row.count));
    }

    const result: UserRegisterTrend[] = [];
    for (let i = 0; i < days; i += 1) {
      const dateStr = this.formatDate(this.addDays(new Date(startDate), i));
      result.push({
        date: dateStr,
        count: resultMap.get(dateStr) ?? 0,
      });
    }

    return result;
  }

  /**
   * 学习排行榜 Top N
   */
  async getStudyRanking(limit = 10): Promise<AdminRankItem[]> {
    const rows = await this.db
      .select({
        id: learners.id,
        nickname: learners.nickname,
        avatarUrl: learners.avatarUrl,
        totalStudyMinutes: learners.totalStudyMinutes,
        level: learners.level,
      })
      .from(learners)
      .orderBy(desc(learners.totalStudyMinutes))
      .limit(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.id,
      userName: row.nickname ?? '匿名用户',
      avatarUrl: row.avatarUrl ?? undefined,
      score: row.totalStudyMinutes,
      studyMinutes: row.totalStudyMinutes,
      level: row.level,
      name: row.nickname ?? '匿名用户',
      minutes: row.totalStudyMinutes,
    }));
  }

  /**
   * 最近动态：混合最新注册用户、最近打卡、最近学习记录
   */
  async getRecentActivities(limit = 20): Promise<RecentActivity[]> {
    const perType = Math.ceil(limit / 3);

    const [newUsers, recentCheckIns, recentStudies] = await Promise.all([
      // 最新注册用户
      this.db
        .select({
          id: learners.id,
          nickname: learners.nickname,
          createdAt: learners.createdAt,
        })
        .from(learners)
        .orderBy(desc(learners.createdAt))
        .limit(perType),
      // 最近打卡
      this.db
        .select({
          id: checkInRecords.id,
          studyMinutes: checkInRecords.studyMinutes,
          checkInDate: checkInRecords.checkInDate,
          userNickname: sql<string>`(select l.nickname from ${learners} l where (l.user_profile).user_id = (${checkInRecords.userProfile}).user_id limit 1)`,
        })
        .from(checkInRecords)
        .orderBy(desc(checkInRecords.createdAt))
        .limit(perType),
      // 最近学习记录（句子练习）
      this.db
        .select({
          id: userSentenceRecords.id,
          isCorrect: userSentenceRecords.isCorrect,
          createdAt: userSentenceRecords.createdAt,
          userNickname: sql<string>`(select l.nickname from ${learners} l where (l.user_profile).user_id = (${userSentenceRecords.userProfile}).user_id limit 1)`,
        })
        .from(userSentenceRecords)
        .orderBy(desc(userSentenceRecords.createdAt))
        .limit(perType),
    ]);

    const activities: RecentActivity[] = [];

    for (const u of newUsers) {
      activities.push({
        id: `reg-${u.id}`,
        type: 'register',
        userName: u.nickname ?? '新用户',
        detail: '注册了账号',
        time: u.createdAt.toISOString(),
      });
    }

    for (const c of recentCheckIns) {
      activities.push({
        id: `ci-${c.id}`,
        type: 'checkin',
        userName: (c as unknown as { userNickname: string | null }).userNickname ?? '用户',
        detail: `打卡学习 ${c.studyMinutes} 分钟`,
        time: this.checkInDateToIso(String(c.checkInDate)),
      });
    }

    for (const s of recentStudies) {
      activities.push({
        id: `sr-${s.id}`,
        type: 'study',
        userName: (s as unknown as { userNickname: string | null }).userNickname ?? '用户',
        detail: (s.isCorrect ? '完成了句子练习（正确）' : '完成了句子练习'),
        time: s.createdAt.toISOString(),
      });
    }

    // 按时间倒序排序，取前 limit 条
    activities.sort((a, b) => b.time.localeCompare(a.time));
    return activities.slice(0, limit);
  }

  // ===== 工具方法 =====

  private getTodayDateString(): string {
    return this.formatDate(new Date());
  }

  private getTomorrowDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return this.formatDate(d);
  }

  private getDateRange(days: number): { startDate: string; endDate: string } {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    return {
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
    };
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(d: Date, days: number): Date {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  }

  private checkInDateToIso(dateStr: string): string {
    // date 类型的字符串转 ISO 格式（统一用当天 00:00:00 UTC）
    return `${dateStr}T00:00:00.000Z`;
  }
}
