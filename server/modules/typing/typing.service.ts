import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { typingCourses, typingRecords, typingStats } from '@server/database/schema';
import { eq, and, desc, asc, sql, count, inArray } from 'drizzle-orm';
import type {
  TypingCourse,
  TypingRecord,
  TypingStats,
  TypingCourseListResponse,
  TypingSubmitDto,
  TypingLevel,
  TypingPracticeMode,
  WhackAMoleRecord,
  WhackAMoleSubmitDto,
  WhackAMoleStats,
} from '@shared/api.interface';

const LEVEL_LABELS: Record<TypingLevel, string> = {
  beginner: '入门',
  elementary: '初级',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家',
};

interface CourseBest {
  courseId: string;
  bestWpm: number;
  bestAccuracy: number;
  completed: boolean;
}

interface TypingTrendItem {
  date: string;
  avgWpm: number;
  avgAccuracy: number;
  duration: number;
}

interface TypingRecordListResponse {
  items: TypingRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class TypingService {
  private readonly logger = new Logger(TypingService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ===== 课程 =====

  async getCourses(
    levelFilter: string | undefined,
    practiceMode: string | undefined,
    categoryFilter: string | undefined,
    userId: string | undefined,
  ): Promise<TypingCourseListResponse> {
    try {
      const baseQuery = this.db.select().from(typingCourses);
      const conditions = [];
      if (levelFilter) conditions.push(eq(typingCourses.level, levelFilter));
      if (practiceMode) conditions.push(eq(typingCourses.practiceMode, practiceMode));
      if (categoryFilter) conditions.push(eq(typingCourses.category, categoryFilter));
      const query = conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery;

      const courses = await query
        .orderBy(asc(typingCourses.orderIndex), asc(typingCourses.id));

      let bestMap: Map<string, CourseBest> = new Map();
      if (userId && courses.length > 0) {
        const courseIds = courses.map((c) => c.id);
        const bestResults = await this.db
          .select({
            courseId: typingRecords.courseId,
            bestWpm: sql<number>`MAX(${typingRecords.wpm})`,
            bestAccuracy: sql<number>`MAX(${typingRecords.accuracy})`,
            completed: sql<number>`COUNT(*)`,
          })
          .from(typingRecords)
          .where(
            and(
              eq(typingRecords.userId, userId),
              inArray(typingRecords.courseId, courseIds),
            ),
          )
          .groupBy(typingRecords.courseId);

        for (const row of bestResults) {
          bestMap.set(row.courseId, {
            courseId: row.courseId,
            bestWpm: Number(row.bestWpm),
            bestAccuracy: Number(row.bestAccuracy),
            completed: row.completed > 0,
          });
        }
      }

      const items: TypingCourse[] = courses.map((c) => {
        const best = bestMap.get(c.id);
        return {
          id: c.id,
          level: c.level as TypingLevel,
          name: c.name,
          description: c.description ?? undefined,
          content: c.content,
          difficulty: c.difficulty,
          orderIndex: c.orderIndex,
          unlockCondition: c.unlockCondition ?? undefined,
          createdAt: c.createdAt.toISOString(),
          completed: best?.completed,
          bestWpm: best?.bestWpm,
          bestAccuracy: best?.bestAccuracy,
          practiceMode: c.practiceMode as TypingPracticeMode,
          wordList: c.wordList ?? undefined,
          category: c.category,
        };
      });

      // 统计各 level 的数量
      const levelCounts = new Map<string, number>();
      for (const c of items) {
        levelCounts.set(c.level, (levelCounts.get(c.level) ?? 0) + 1);
      }

      const levels = (Object.keys(LEVEL_LABELS) as TypingLevel[])
        .map((lv) => ({
          level: lv,
          label: LEVEL_LABELS[lv],
          count: levelCounts.get(lv) ?? 0,
        }))
        .filter((l) => l.count > 0 || !levelFilter);

      return { items, levels };
    } catch (error) {
      this.logger.error('获取课程列表失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getCourse(id: string): Promise<TypingCourse> {
    try {
      const courses = await this.db
        .select()
        .from(typingCourses)
        .where(eq(typingCourses.id, id))
        .limit(1);

      if (courses.length === 0) {
        throw new NotFoundException('课程不存在');
      }

      const c = courses[0];
      return {
        id: c.id,
        level: c.level as TypingLevel,
        name: c.name,
        description: c.description ?? undefined,
        content: c.content,
        difficulty: c.difficulty,
        orderIndex: c.orderIndex,
        unlockCondition: c.unlockCondition ?? undefined,
        createdAt: c.createdAt.toISOString(),
        practiceMode: c.practiceMode as TypingPracticeMode,
        wordList: c.wordList ?? undefined,
        category: c.category,
      };
    } catch (error) {
      this.logger.error(`获取课程详情失败 id=${id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  // ===== 练习记录 =====

  async submitRecord(userId: string, dto: TypingSubmitDto): Promise<TypingRecord> {
    try {
      return await this.db.transaction(async (tx) => {
        // 插入记录
        const inserted = await tx
          .insert(typingRecords)
          .values({
            userId,
            courseId: dto.courseId,
            wpm: String(dto.wpm),
            accuracy: String(dto.accuracy),
            duration: dto.duration,
            errors: dto.errors,
            weakKeys: dto.weakKeys,
            cpm: String(dto.cpm),
            totalChars: dto.totalChars,
            correctChars: dto.correctChars,
            practiceMode: dto.practiceMode ?? 'sentence',
          })
          .returning();

        const record = inserted[0];

        // 重新计算统计数据
        const agg = await tx
          .select({
            totalPracticeTime: sql<number>`COALESCE(SUM(${typingRecords.duration}), 0)`,
            avgWpm: sql<number>`COALESCE(AVG(${typingRecords.wpm}), 0)`,
            avgAccuracy: sql<number>`COALESCE(AVG(${typingRecords.accuracy}), 0)`,
            bestWpm: sql<number>`COALESCE(MAX(${typingRecords.wpm}), 0)`,
            avgCpm: sql<number>`COALESCE(AVG(${typingRecords.cpm}), 0)`,
            bestCpm: sql<number>`COALESCE(MAX(${typingRecords.cpm}), 0)`,
            bestAccuracy: sql<number>`COALESCE(MAX(${typingRecords.accuracy}), 0)`,
            totalCount: sql<number>`COUNT(*)`,
          })
          .from(typingRecords)
          .where(eq(typingRecords.userId, userId));

        const {
          totalPracticeTime,
          avgWpm,
          avgAccuracy,
          bestWpm,
          avgCpm,
          bestCpm,
          bestAccuracy,
          totalCount,
        } = agg[0];

        // upsert 统计
        await tx
          .insert(typingStats)
          .values({
            userId,
            totalPracticeTime: Number(totalPracticeTime),
            averageWpm: String(avgWpm),
            averageAccuracy: String(avgAccuracy),
            bestWpm: String(bestWpm),
            weakKeys: dto.weakKeys,
            averageCpm: String(avgCpm),
            bestCpm: String(bestCpm),
            bestAccuracy: String(bestAccuracy),
            totalPracticeCount: Number(totalCount),
          })
          .onConflictDoUpdate({
            target: typingStats.userId,
            set: {
              totalPracticeTime: Number(totalPracticeTime),
              averageWpm: String(avgWpm),
              averageAccuracy: String(avgAccuracy),
              bestWpm: String(bestWpm),
              weakKeys: dto.weakKeys,
              averageCpm: String(avgCpm),
              bestCpm: String(bestCpm),
              bestAccuracy: String(bestAccuracy),
              totalPracticeCount: Number(totalCount),
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          });

        return this.mapToTypingRecord(record);
      });
    } catch (error) {
      this.logger.error('提交打字成绩失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getRecords(
    userId: string,
    courseId: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<TypingRecordListResponse> {
    try {
      const conditions = [eq(typingRecords.userId, userId)];
      if (courseId) conditions.push(eq(typingRecords.courseId, courseId));

      const where = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [records, countResult] = await Promise.all([
        this.db
          .select()
          .from(typingRecords)
          .where(where)
          .orderBy(desc(typingRecords.createdAt))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(typingRecords)
          .where(where),
      ]);

      const total = Number(countResult[0].count);

      return {
        items: records.map((r) => this.mapToTypingRecord(r)),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error('获取练习记录失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  // ===== 统计 =====

  async getStats(userId: string): Promise<TypingStats> {
    try {
      const stats = await this.db
        .select()
        .from(typingStats)
        .where(eq(typingStats.userId, userId))
        .limit(1);

      if (stats.length === 0) {
        return {
          id: '',
          userId,
          totalPracticeTime: 0,
          averageWpm: 0,
          averageCpm: 0,
          averageAccuracy: 0,
          bestWpm: 0,
          bestCpm: 0,
          bestAccuracy: 0,
          totalPracticeCount: 0,
          weakKeys: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const s = stats[0];
      return {
        id: s.id,
        userId: s.userId,
        totalPracticeTime: s.totalPracticeTime,
        averageWpm: Number(s.averageWpm),
        averageCpm: Number(s.averageCpm),
        averageAccuracy: Number(s.averageAccuracy),
        bestWpm: Number(s.bestWpm),
        bestCpm: Number(s.bestCpm),
        bestAccuracy: Number(s.bestAccuracy),
        totalPracticeCount: s.totalPracticeCount,
        weakKeys: s.weakKeys ?? undefined,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('获取统计数据失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getTrend(userId: string): Promise<TypingTrendItem[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const startIso = sevenDaysAgo.toISOString();

      const results = await this.db
        .select({
          date: sql<string>`DATE(${typingRecords.createdAt})`,
          avgWpm: sql<number>`COALESCE(AVG(${typingRecords.wpm}), 0)`,
          avgAccuracy: sql<number>`COALESCE(AVG(${typingRecords.accuracy}), 0)`,
          duration: sql<number>`COALESCE(SUM(${typingRecords.duration}), 0)`,
        })
        .from(typingRecords)
        .where(
          and(
            eq(typingRecords.userId, userId),
            sql`${typingRecords.createdAt} >= ${startIso}`,
          ),
        )
        .groupBy(sql`DATE(${typingRecords.createdAt})`)
        .orderBy(sql`DATE(${typingRecords.createdAt})`);

      // 填充最近 7 天，没有数据的天补 0
      const resultMap = new Map<string, TypingTrendItem>();
      for (const row of results) {
        resultMap.set(row.date, {
          date: row.date,
          avgWpm: Number(row.avgWpm),
          avgAccuracy: Number(row.avgAccuracy),
          duration: Number(row.duration),
        });
      }

      const trend: TypingTrendItem[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        trend.push(
          resultMap.get(dateStr) ?? {
            date: dateStr,
            avgWpm: 0,
            avgAccuracy: 0,
            duration: 0,
          },
        );
      }

      return trend;
    } catch (error) {
      this.logger.error('获取趋势数据失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  // ===== 工具方法 =====

  // ===== 打地鼠游戏 =====

  async submitWhackAMoleRecord(
    userId: string,
    dto: WhackAMoleSubmitDto,
  ): Promise<WhackAMoleRecord> {
    try {
      const result = await this.db.execute(sql`
        INSERT INTO whack_a_mole_records (
          user_id, level, score, hits, misses, accuracy, max_combo, duration, stars
        ) VALUES (
          ${userId}, ${dto.levelId}, ${dto.score}, ${dto.correctHits}, ${dto.misses},
          ${dto.accuracy}::numeric, ${dto.maxCombo}, ${dto.duration}, ${dto.stars}
        )
        RETURNING id, user_id, level, score, hits, misses, accuracy, max_combo, duration, stars, _created_at
      `);

      const row = (result as unknown as { rows: unknown[] }).rows[0] as Record<string, unknown>;
      return this.mapToWhackAMoleRecord(row);
    } catch (error) {
      this.logger.error('提交打地鼠成绩失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getWhackAMoleStats(userId: string): Promise<WhackAMoleStats> {
    try {
      const aggResult = await this.db.execute(sql`
        SELECT
          COUNT(*) AS total_games,
          COALESCE(MAX(score), 0) AS highest_score,
          COALESCE(MAX(level), 0) AS highest_level,
          COALESCE(SUM(stars), 0) AS total_stars
        FROM whack_a_mole_records
        WHERE user_id = ${userId}
      `);

      const aggRow = (aggResult as unknown as { rows: Record<string, unknown>[] }).rows[0];

      const levelResult = await this.db.execute(sql`
        SELECT level, MAX(score) AS best_score, MAX(stars) AS max_stars, COUNT(*) AS completed
        FROM whack_a_mole_records
        WHERE user_id = ${userId}
        GROUP BY level
        ORDER BY level
      `);

      const levelRows = (levelResult as unknown as { rows: Record<string, unknown>[] }).rows;
      const levelRecords: WhackAMoleStats['levelRecords'] = levelRows.map((row: Record<string, unknown>) => ({
        levelId: Number(row.level),
        bestScore: Number(row.best_score),
        stars: Number(row.max_stars),
        completed: Number(row.completed) > 0,
      }));

      return {
        userId,
        totalGames: Number(aggRow.total_games),
        highestScore: Number(aggRow.highest_score),
        highestLevel: Number(aggRow.highest_level),
        totalStars: Number(aggRow.total_stars),
        levelRecords,
      };
    } catch (error) {
      this.logger.error('获取打地鼠统计失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getWhackAMoleRecords(
    userId: string,
    limit?: number,
  ): Promise<WhackAMoleRecord[]> {
    try {
      const limitNum = limit ?? 20;
      const result = await this.db.execute(sql`
        SELECT id, user_id, level, score, hits, misses, accuracy, max_combo, duration, stars, _created_at
        FROM whack_a_mole_records
        WHERE user_id = ${userId}
        ORDER BY _created_at DESC
        LIMIT ${limitNum}
      `);

      const rows = (result as unknown as { rows: Record<string, unknown>[] }).rows;
      return rows.map((row: Record<string, unknown>) => this.mapToWhackAMoleRecord(row));
    } catch (error) {
      this.logger.error('获取打地鼠记录失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  // ===== 工具方法 =====

  private mapToTypingRecord(record: typeof typingRecords.$inferSelect): TypingRecord {
    return {
      id: record.id,
      userId: record.userId,
      courseId: record.courseId,
      wpm: Number(record.wpm),
      cpm: Number(record.cpm),
      accuracy: Number(record.accuracy),
      duration: record.duration,
      errors: record.errors,
      totalChars: record.totalChars,
      correctChars: record.correctChars,
      weakKeys: record.weakKeys ?? undefined,
      practiceMode: record.practiceMode as TypingPracticeMode,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private mapToWhackAMoleRecord(row: Record<string, unknown>): WhackAMoleRecord {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      levelId: Number(row.level),
      score: Number(row.score),
      correctHits: Number(row.hits),
      misses: Number(row.misses),
      accuracy: Number(row.accuracy),
      maxCombo: Number(row.max_combo),
      stars: Number(row.stars),
      duration: Number(row.duration),
      createdAt: new Date(String(row._created_at)).toISOString(),
    };
  }
}
