import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc } from 'drizzle-orm';
import type {
  LearningPlan,
  CreateLearningPlanDto,
  UpdateLearningProgressDto,
} from '@shared/api.interface';
import { learningPlans } from '@server/database/schema';

@Injectable()
export class LearningPlanService {
  private readonly logger = new Logger(LearningPlanService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getPlans(
    userId: string,
    planType?: 'sentence' | 'word',
  ): Promise<LearningPlan[]> {
    const conditions = [eq(learningPlans.userProfile, userId)];
    if (planType) {
      conditions.push(eq(learningPlans.planType, planType));
    }

    const rows = await this.db
      .select()
      .from(learningPlans)
      .where(and(...conditions))
      .orderBy(desc(learningPlans.addedAt));

    const items: LearningPlan[] = rows.map((row) => ({
      id: row.id,
      planType: row.planType as 'sentence' | 'word',
      itemType: row.itemType,
      itemId: row.itemId,
      itemTitle: row.itemTitle,
      itemMeta: row.itemMeta ? (row.itemMeta as Record<string, unknown>) : undefined,
      totalCount: row.totalCount ?? 0,
      completedCount: row.completedCount ?? 0,
      addedAt: row.addedAt.toISOString(),
    }));

    return items;
  }

  async addToPlan(
    userId: string,
    dto: CreateLearningPlanDto,
  ): Promise<LearningPlan> {
    if (!dto.planType || !dto.itemType || !dto.itemId || !dto.itemTitle) {
      throw new BadRequestException('planType, itemType, itemId, itemTitle 不能为空');
    }

    // Check if record exists for this user + planType + itemType + itemId
    const existing = await this.db
      .select()
      .from(learningPlans)
      .where(
        and(
          eq(learningPlans.userProfile, userId),
          eq(learningPlans.planType, dto.planType),
          eq(learningPlans.itemType, dto.itemType),
          eq(learningPlans.itemId, dto.itemId),
        ),
      )
      .limit(1);

    let row: typeof learningPlans.$inferSelect;

    if (existing.length > 0) {
      // Update existing record
      const patch: Partial<typeof learningPlans.$inferInsert> = {};
      if (dto.totalCount !== undefined) {
        patch.totalCount = dto.totalCount;
      }
      if (dto.itemMeta !== undefined) {
        patch.itemMeta = dto.itemMeta;
      }
      patch.itemTitle = dto.itemTitle;

      const updated = await this.db
        .update(learningPlans)
        .set(patch)
        .where(eq(learningPlans.id, existing[0].id))
        .returning();

      row = updated[0];
    } else {
      // Insert new record
      const inserted = await this.db
        .insert(learningPlans)
        .values({
          userProfile: userId,
          planType: dto.planType,
          itemType: dto.itemType,
          itemId: dto.itemId,
          itemTitle: dto.itemTitle,
          itemMeta: dto.itemMeta ?? undefined,
          totalCount: dto.totalCount ?? 0,
          completedCount: 0,
        })
        .returning();

      row = inserted[0];
    }

    return {
      id: row.id,
      planType: row.planType as 'sentence' | 'word',
      itemType: row.itemType,
      itemId: row.itemId,
      itemTitle: row.itemTitle,
      itemMeta: row.itemMeta ? (row.itemMeta as Record<string, unknown>) : undefined,
      totalCount: row.totalCount ?? 0,
      completedCount: row.completedCount ?? 0,
      addedAt: row.addedAt.toISOString(),
    };
  }

  async removeFromPlan(userId: string, id: string): Promise<void> {
    const result = await this.db
      .delete(learningPlans)
      .where(
        and(
          eq(learningPlans.id, id),
          eq(learningPlans.userProfile, userId),
        ),
      )
      .returning({ id: learningPlans.id });

    if (result.length === 0) {
      throw new NotFoundException('计划记录不存在');
    }
  }

  async updateProgress(
    userId: string,
    id: string,
    dto: UpdateLearningProgressDto,
  ): Promise<LearningPlan> {
    if (dto.completedCount === undefined || dto.completedCount < 0) {
      throw new BadRequestException('completedCount 不能为空且不能为负数');
    }

    const updated = await this.db
      .update(learningPlans)
      .set({ completedCount: dto.completedCount })
      .where(
        and(
          eq(learningPlans.id, id),
          eq(learningPlans.userProfile, userId),
        ),
      )
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('计划记录不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      planType: row.planType as 'sentence' | 'word',
      itemType: row.itemType,
      itemId: row.itemId,
      itemTitle: row.itemTitle,
      itemMeta: row.itemMeta ? (row.itemMeta as Record<string, unknown>) : undefined,
      totalCount: row.totalCount ?? 0,
      completedCount: row.completedCount ?? 0,
      addedAt: row.addedAt.toISOString(),
    };
  }
}
