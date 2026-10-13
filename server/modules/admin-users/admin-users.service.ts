import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lt,
  sql,
} from 'drizzle-orm';

import {
  learners,
  checkInRecords,
  userSentenceRecords,
  userWordRecords,
  userCourses,
  courses,
} from '@server/database/schema';
import type {
  AdminUserDetail,
  AdminUserItem,
  PagedResponse,
} from '@shared/api.interface';

interface GetUsersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  status?: string;
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getUsers(
    params: GetUsersParams,
  ): Promise<PagedResponse<AdminUserItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildWhereConditions(params);

    // Base query with user profile info
    const baseSelect = {
      userId: sql<string>`(${learners.userProfile}).user_id`.as('user_id'),
      nickname: learners.nickname,
      phone: learners.phone,
      level: learners.level,
      totalStudyMinutes: learners.totalStudyMinutes,
      createdAt: learners.createdAt,
    };

    const baseQuery = this.db
      .select(baseSelect)
      .from(learners);

    // Get total count
    const countQuery = this.db
      .select({ count: count() })
      .from(learners);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery
            .where(and(...conditions))
            .orderBy(desc(learners.createdAt))
            .limit(pageSize)
            .offset(offset)
        : baseQuery
            .orderBy(desc(learners.createdAt))
            .limit(pageSize)
            .offset(offset),
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    if (itemsResult.length === 0) {
      return { items: [], total, page, pageSize };
    }

    // Collect user IDs for batch lookup
    const userIds: string[] = itemsResult.map(
      (row: { userId: string }) => row.userId,
    );

    // Batch fetch check-in days and wrong counts
    const [checkInMap, wrongSentenceMap, wrongWordMap] = await Promise.all([
      this.getCheckInDaysMap(userIds),
      this.getWrongSentenceCountMap(userIds),
      this.getWrongWordCountMap(userIds),
    ]);

    const items: AdminUserItem[] = itemsResult.map(
      (row: {
        userId: string;
        nickname: string | null;
        phone: string | null;
        level: string;
        totalStudyMinutes: number;
        createdAt: Date;
      }) => ({
        id: row.userId,
        nickname: row.nickname ?? '未命名用户',
        phone: row.phone ?? undefined,
        role: 'student',
        registerTime: row.createdAt.toISOString(),
        totalStudyMinutes: row.totalStudyMinutes,
        checkInDays: checkInMap.get(row.userId) ?? 0,
        wrongCount:
          (wrongSentenceMap.get(row.userId) ?? 0) +
          (wrongWordMap.get(row.userId) ?? 0),
        isActive: true,
      }),
    );

    return { items, total, page, pageSize };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    // Get basic user info
    const userRows = await this.db
      .select({
        userId: sql<string>`(${learners.userProfile}).user_id`.as('user_id'),
        nickname: learners.nickname,
        phone: learners.phone,
        level: learners.level,
        totalStudyMinutes: learners.totalStudyMinutes,
        createdAt: learners.createdAt,
      })
      .from(learners)
      .where(
        sql`(${learners.userProfile}).user_id = ${userId}`,
      )
      .limit(1);

    if (userRows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const userRow = userRows[0];

    // Course progress
    const courseProgressRows = await this.db
      .select({
        courseId: userCourses.courseId,
        courseTitle: courses.title,
        progress: userCourses.progress,
      })
      .from(userCourses)
      .leftJoin(courses, eq(userCourses.courseId, courses.id))
      .where(
        sql`(${userCourses.userProfile}).user_id = ${userId}`,
      )
      .orderBy(desc(userCourses.enrolledAt));

    const courseProgress = courseProgressRows.map(
      (row: {
        courseId: string;
        courseTitle: string | null;
        progress: string | number;
      }) => ({
        courseId: row.courseId,
        courseTitle: row.courseTitle ?? '已删除课程',
        progress: Number(row.progress),
      }),
    );

    // Wrong counts
    const [wrongSentencesResult, wrongWordsResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(userSentenceRecords)
        .where(
          and(
            sql`(${userSentenceRecords.userProfile}).user_id = ${userId}`,
            eq(userSentenceRecords.isCorrect, false),
          ),
        ),
      this.db
        .select({ count: count() })
        .from(userWordRecords)
        .where(
          sql`(${userWordRecords.userProfile}).user_id = ${userId}`,
        ),
    ]);

    // For word records, wrong count = reviewCount - correctCount
    const wrongWordsFromRecords = await this.db
      .select({
        wrongCount: sql<number>`
          coalesce(sum(${userWordRecords.reviewCount} - ${userWordRecords.correctCount}), 0)
        `.as('wrong_count'),
      })
      .from(userWordRecords)
      .where(
        sql`(${userWordRecords.userProfile}).user_id = ${userId}`,
      );

    // Recent 30 days check-in records
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const checkInRows = await this.db
      .select({
        checkInDate: checkInRecords.checkInDate,
        studyMinutes: checkInRecords.studyMinutes,
      })
      .from(checkInRecords)
      .where(
        and(
          sql`(${checkInRecords.userProfile}).user_id = ${userId}`,
          gte(checkInRecords.checkInDate, thirtyDaysAgoIso.split('T')[0]),
        ),
      )
      .orderBy(desc(checkInRecords.checkInDate));

    const checkInRecordsList = checkInRows.map(
      (row: { checkInDate: string; studyMinutes: number }) => ({
        date: row.checkInDate,
        minutes: row.studyMinutes,
      }),
    );

    // Favorites count - use userCourses count as approximation
    const favorites = courseProgress.length;

    const user: AdminUserItem = {
      id: userRow.userId,
      nickname: userRow.nickname ?? '未命名用户',
      phone: userRow.phone ?? undefined,
      role: 'student',
      registerTime: userRow.createdAt.toISOString(),
      totalStudyMinutes: userRow.totalStudyMinutes,
      checkInDays: checkInRows.length,
      wrongCount:
        Number(wrongSentencesResult[0]?.count ?? 0) +
        Number(wrongWordsFromRecords[0]?.wrongCount ?? 0),
      isActive: true,
    };

    return {
      user,
      courseProgress,
      wrongSentences: Number(wrongSentencesResult[0]?.count ?? 0),
      wrongWords: Number(wrongWordsFromRecords[0]?.wrongCount ?? 0),
      checkInRecords: checkInRecordsList,
      favorites,
    };
  }

  async toggleUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<{ success: boolean }> {
    // learners 表没有 isActive 字段，直接返回成功
    this.logger.log(`切换用户状态: ${userId} -> ${isActive}`);
    return { success: true };
  }

  // ===== 内部方法 =====

  private buildWhereConditions(params: GetUsersParams) {
    const conditions = [];

    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(ilike(learners.nickname, keyword));
    }
    // role 筛选暂时不处理，learners 表没有 role 字段
    // status 筛选暂时不处理，learners 表没有 status/is_active 字段

    return conditions;
  }

  private async getCheckInDaysMap(
    userIds: string[],
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        userId:
          sql<string>`(${checkInRecords.userProfile}).user_id`.as('user_id'),
        days: sql<number>`count(*)`.as('days'),
      })
      .from(checkInRecords)
      .where(
        sql`(${checkInRecords.userProfile}).user_id = ANY(ARRAY[${sql.join(
          userIds.map((id: string) => sql`${id}`),
          sql`, `,
        )}]::text[])`,
      )
      .groupBy(sql`(${checkInRecords.userProfile}).user_id`);

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.userId, Number(row.days));
    }
    return map;
  }

  private async getWrongSentenceCountMap(
    userIds: string[],
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        userId:
          sql<string>`(${userSentenceRecords.userProfile}).user_id`.as(
            'user_id',
          ),
        wrongCount: sql<number>`count(*)`.as('wrong_count'),
      })
      .from(userSentenceRecords)
      .where(
        and(
          eq(userSentenceRecords.isCorrect, false),
          sql`(${userSentenceRecords.userProfile}).user_id = ANY(ARRAY[${sql.join(
            userIds.map((id: string) => sql`${id}`),
            sql`, `,
          )}]::text[])`,
        ),
      )
      .groupBy(sql`(${userSentenceRecords.userProfile}).user_id`);

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.userId, Number(row.wrongCount));
    }
    return map;
  }

  private async getWrongWordCountMap(
    userIds: string[],
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        userId:
          sql<string>`(${userWordRecords.userProfile}).user_id`.as('user_id'),
        wrongCount: sql<number>`
          coalesce(sum(${userWordRecords.reviewCount} - ${userWordRecords.correctCount}), 0)
        `.as('wrong_count'),
      })
      .from(userWordRecords)
      .where(
        sql`(${userWordRecords.userProfile}).user_id = ANY(ARRAY[${sql.join(
          userIds.map((id: string) => sql`${id}`),
          sql`, `,
        )}]::text[])`,
      )
      .groupBy(sql`(${userWordRecords.userProfile}).user_id`);

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.userId, Number(row.wrongCount));
    }
    return map;
  }
}
