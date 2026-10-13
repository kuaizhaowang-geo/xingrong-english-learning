import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, asc, sql, inArray, lte, count } from 'drizzle-orm';
import type {
  ReviewItem,
  ReviewListResponse,
  MarkUnfamiliarDto,
  ReviewStats,
} from '@shared/api.interface';
import { reviewItems } from '@server/database/schema';

interface ListParams {
  userId: string;
  subject?: string;
  itemType?: string;
  status?: string;
  dueOnly?: boolean;
  page?: number;
  pageSize?: number;
}

const EBBINGHAUS_INTERVALS_DAYS: number[] = [1, 3, 7, 15, 30];

@Injectable()
export class ReviewItemsService {
  private readonly logger = new Logger(ReviewItemsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private getNextReviewTime(level: number, now: Date): Date {
    const idx = Math.min(level, EBBINGHAUS_INTERVALS_DAYS.length - 1);
    const days = EBBINGHAUS_INTERVALS_DAYS[idx];
    const next = new Date(now);
    next.setDate(next.getDate() + days);
    return next;
  }

  private mapRowToItem(row: typeof reviewItems.$inferSelect): ReviewItem {
    return {
      id: row.id,
      subject: row.subject,
      itemType: row.itemType,
      content: row.content,
      answer: row.answer ?? undefined,
      sourceId: row.sourceId ?? undefined,
      courseId: row.courseId ?? undefined,
      lessonId: row.lessonId ?? undefined,
      markTime: row.markTime.toISOString(),
      reviewCount: row.reviewCount,
      ebbinghausLevel: row.ebbinghausLevel,
      nextReviewTime: row.nextReviewTime.toISOString(),
      status: row.status as 'pending' | 'mastered',
      lastReviewTime: row.lastReviewTime
        ? row.lastReviewTime.toISOString()
        : undefined,
    };
  }

  // ===== 1. list =====
  async list(params: ListParams): Promise<ReviewListResponse> {
    const { userId, subject, itemType, status, dueOnly, page, pageSize } =
      params;

    const conditions = [
      sql`(${reviewItems.createdBy}).user_id = ${userId}`,
    ];

    if (subject) {
      conditions.push(eq(reviewItems.subject, subject));
    }
    if (itemType) {
      conditions.push(eq(reviewItems.itemType, itemType));
    }
    if (status) {
      conditions.push(eq(reviewItems.status, status));
    }
    if (dueOnly) {
      const now = new Date();
      conditions.push(
        and(
          eq(reviewItems.status, 'pending'),
          lte(reviewItems.nextReviewTime, now),
        ),
      );
    }

    const whereClause = and(...conditions);

    const currentPage = page && page > 0 ? page : 1;
    const currentPageSize = pageSize && pageSize > 0 ? pageSize : 20;
    const offset = (currentPage - 1) * currentPageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(reviewItems)
        .where(whereClause)
        .orderBy(asc(reviewItems.nextReviewTime))
        .limit(currentPageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(reviewItems)
        .where(whereClause),
    ]);

    const items: ReviewItem[] = rows.map((row) => this.mapRowToItem(row));
    const total = Number(totalRows[0]?.count ?? 0);

    return { items, total };
  }

  // ===== 2. markUnfamiliar =====
  async markUnfamiliar(
    userId: string,
    dto: MarkUnfamiliarDto,
  ): Promise<ReviewItem> {
    if (!dto.subject) {
      throw new BadRequestException('subject 不能为空');
    }
    if (!dto.itemType) {
      throw new BadRequestException('itemType 不能为空');
    }
    if (!dto.content) {
      throw new BadRequestException('content 不能为空');
    }

    const now = new Date();

    // 幂等检查：相同 source_id + item_type 的 pending 记录
    if (dto.sourceId) {
      const existing = await this.db
        .select()
        .from(reviewItems)
        .where(
          and(
            sql`(${reviewItems.createdBy}).user_id = ${userId}`,
            eq(reviewItems.sourceId, dto.sourceId),
            eq(reviewItems.itemType, dto.itemType),
            eq(reviewItems.status, 'pending'),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        const updated = await this.db
          .update(reviewItems)
          .set({
            markTime: now,
            content: dto.content,
            answer: dto.answer ?? null,
            courseId: dto.courseId ?? null,
            lessonId: dto.lessonId ?? null,
          })
          .where(eq(reviewItems.id, existing[0].id))
          .returning();
        return this.mapRowToItem(updated[0]);
      }
    }

    const nextReview = this.getNextReviewTime(0, now);

    const inserted = await this.db
      .insert(reviewItems)
      .values({
        subject: dto.subject,
        itemType: dto.itemType,
        content: dto.content,
        answer: dto.answer ?? null,
        sourceId: dto.sourceId ?? null,
        courseId: dto.courseId ?? null,
        lessonId: dto.lessonId ?? null,
        markTime: now,
        reviewCount: 0,
        ebbinghausLevel: 0,
        nextReviewTime: nextReview,
        status: 'pending',
        createdBy: userId,
      })
      .returning();

    return this.mapRowToItem(inserted[0]);
  }

  // ===== 3. markMastered =====
  async markMastered(userId: string, id: string): Promise<ReviewItem> {
    const existing = await this.db
      .select()
      .from(reviewItems)
      .where(
        and(
          sql`(${reviewItems.createdBy}).user_id = ${userId}`,
          eq(reviewItems.id, id),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('复习项不存在');
    }

    const updated = await this.db
      .update(reviewItems)
      .set({ status: 'mastered' })
      .where(eq(reviewItems.id, id))
      .returning();

    return this.mapRowToItem(updated[0]);
  }

  // ===== 4. recordReview =====
  async recordReview(
    userId: string,
    id: string,
    isCorrect: boolean,
  ): Promise<ReviewItem> {
    const existing = await this.db
      .select()
      .from(reviewItems)
      .where(
        and(
          sql`(${reviewItems.createdBy}).user_id = ${userId}`,
          eq(reviewItems.id, id),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('复习项不存在');
    }

    const now = new Date();
    const row = existing[0];

    let newLevel: number;
    if (isCorrect) {
      newLevel = Math.min(row.ebbinghausLevel + 1, 4);
    } else {
      newLevel = 0;
    }

    const nextReview = this.getNextReviewTime(newLevel, now);

    const updated = await this.db
      .update(reviewItems)
      .set({
        reviewCount: row.reviewCount + 1,
        lastReviewTime: now,
        ebbinghausLevel: newLevel,
        nextReviewTime: nextReview,
      })
      .where(eq(reviewItems.id, id))
      .returning();

    return this.mapRowToItem(updated[0]);
  }

  // ===== 5. getStats =====
  async getStats(userId: string): Promise<ReviewStats> {
    const now = new Date();
    const nowIso = now.toISOString();

    const results = await this.db
      .select({
        total: sql<number>`count(*)`,
        mastered: sql<number>`
          count(*) filter (where ${reviewItems.status} = 'mastered')
        `,
        pending: sql<number>`
          count(*) filter (where ${reviewItems.status} = 'pending')
        `,
        todayDue: sql<number>`
          count(*) filter (
            where ${reviewItems.status} = 'pending'
              and ${reviewItems.nextReviewTime} <= ${nowIso}
          )
        `,
      })
      .from(reviewItems)
      .where(sql`(${reviewItems.createdBy}).user_id = ${userId}`);

    const row = results[0];
    return {
      total: Number(row?.total ?? 0),
      mastered: Number(row?.mastered ?? 0),
      pending: Number(row?.pending ?? 0),
      todayDue: Number(row?.todayDue ?? 0),
    };
  }

  // ===== 6. delete =====
  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(reviewItems)
      .where(
        and(
          sql`(${reviewItems.createdBy}).user_id = ${userId}`,
          eq(reviewItems.id, id),
        ),
      )
      .returning({ id: reviewItems.id });

    if (deleted.length === 0) {
      throw new NotFoundException('复习项不存在');
    }
  }

  // ===== 7. batchDelete =====
  async batchDelete(userId: string, ids: string[]): Promise<void> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids 不能为空数组');
    }

    await this.db
      .delete(reviewItems)
      .where(
        and(
          sql`(${reviewItems.createdBy}).user_id = ${userId}`,
          inArray(reviewItems.id, ids),
        ),
      );
  }
}
