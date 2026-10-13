import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { eq, sql, count } from 'drizzle-orm';

import { learners, userCourses } from '@server/database/schema';
import type {
  LearnerProfile,
  LearnerPreferences,
  UpdateLearnerDto,
} from '@shared/api.interface';

@Injectable()
export class LearnersService {
  private readonly logger = new Logger(LearnersService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取当前学习者信息，如不存在则自动创建
   */
  async getOrCreateProfile(userId: string): Promise<LearnerProfile> {
    const existing = await this.db
      .select()
      .from(learners)
      .where(eq(learners.userProfile, userId))
      .limit(1);

    if (existing.length > 0) {
      return this.toLearnerProfile(existing[0]);
    }

    // 不存在则创建（幂等：并发时捕获唯一冲突后再查）
    try {
      const inserted = await this.db
        .insert(learners)
        .values({
          userProfile: userId,
          level: 'beginner',
          totalStudyMinutes: 0,
          totalWords: 0,
          continuousCheckInDays: 0,
          totalCheckInDays: 0,
          vipStatus: false,
        })
        .returning();
      return this.toLearnerProfile(inserted[0]);
    } catch (error: unknown) {
      const code = this.extractPostgresErrorCode(error);
      if (code === '23505') {
        // 唯一冲突：并发插入，重新查询
        const retry = await this.db
          .select()
          .from(learners)
          .where(eq(learners.userProfile, userId))
          .limit(1);
        if (retry.length > 0) {
          return this.toLearnerProfile(retry[0]);
        }
      }
      this.logger.error(
        `创建学习者档案失败: ${JSON.stringify(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 更新当前学习者信息
   */
  async updateProfile(
    userId: string,
    dto: UpdateLearnerDto,
  ): Promise<LearnerProfile> {
    const patch: Partial<typeof learners.$inferInsert> = {};
    if (dto.nickname !== undefined) patch.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl;
    if (dto.preferences !== undefined) {
      patch.preferences = dto.preferences as unknown as typeof patch.preferences;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(learners)
      .set(patch)
      .where(eq(learners.userProfile, userId))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('学习者档案不存在');
    }

    return this.toLearnerProfile(updated[0]);
  }

  /**
   * 获取当前学习者统计数据
   * 统计字段从 learners 表取，已加入课程数从 user_courses 聚合
   */
  async getStats(userId: string): Promise<{
    totalStudyMinutes: number;
    totalWords: number;
    continuousCheckInDays: number;
    totalCheckInDays: number;
    enrolledCoursesCount: number;
  }> {
    const profile = await this.getOrCreateProfile(userId);

    const courseCountResult = await this.db
      .select({ count: count() })
      .from(userCourses)
      .where(eq(userCourses.userProfile, userId));

    const enrolledCoursesCount: number = Number(
      courseCountResult[0]?.count ?? 0,
    );

    return {
      totalStudyMinutes: profile.totalStudyMinutes,
      totalWords: profile.totalWords,
      continuousCheckInDays: profile.continuousCheckInDays,
      totalCheckInDays: profile.totalCheckInDays,
      enrolledCoursesCount,
    };
  }

  // ===== 内部方法 =====

  private toLearnerProfile(
    row: typeof learners.$inferSelect,
  ): LearnerProfile {
     return {
       id: row.id,
       nickname: row.nickname ?? undefined,
       avatarUrl: row.avatarUrl ?? undefined,
       phone: row.phone ?? undefined,
       level: row.level,
       totalStudyMinutes: row.totalStudyMinutes,
       totalWords: row.totalWords,
       totalChineseLessons: row.totalChineseLessons ?? 0,
       totalMathTopics: row.totalMathTopics ?? 0,
       continuousCheckInDays: row.continuousCheckInDays,
       totalCheckInDays: row.totalCheckInDays,
       vipStatus: row.vipStatus,
       vipExpireAt: row.vipExpireAt ? row.vipExpireAt.toISOString() : undefined,
       preferences: (row.preferences as LearnerPreferences | null) ?? undefined,
     };
  }

  private extractPostgresErrorCode(error: unknown): string | undefined {
    let current: unknown = error;
    for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
      const { code, cause } = current as { code?: unknown; cause?: unknown };
      if (typeof code === 'string') return code;
      current = cause;
    }
    return undefined;
  }
}
