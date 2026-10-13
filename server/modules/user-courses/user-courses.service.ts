import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  inArray,
} from 'drizzle-orm';

import {
  courses,
  courseLessons,
  userCourses,
  userLessonProgress,
} from '@server/database/schema';
import type {
  CourseItem,
  CourseLesson,
  EnrollCourseDto,
  UserCourse,
  UserLessonProgressItem,
} from '@shared/api.interface';

@Injectable()
export class UserCoursesService {
  private readonly logger = new Logger(UserCoursesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 我的课程包列表（含课程基本信息）
   */
  async listMyCourses(userId: string): Promise<{ items: UserCourse[] }> {
    const rows = await this.db
      .select()
      .from(userCourses)
      .where(eq(userCourses.userProfile, userId))
      .orderBy(desc(userCourses.lastStudyAt), desc(userCourses.enrolledAt));

    if (rows.length === 0) {
      return { items: [] };
    }

    const courseIds: string[] = rows.map(
      (row: typeof userCourses.$inferSelect) => row.courseId,
    );
    const courseRows = await this.db
      .select()
      .from(courses)
      .where(inArray(courses.id, courseIds));
    const courseMap = new Map<string, typeof courses.$inferSelect>();
    for (const c of courseRows) {
      courseMap.set(c.id, c);
    }

    const items: UserCourse[] = rows.map(
      (row: typeof userCourses.$inferSelect): UserCourse => {
        const course = courseMap.get(row.courseId);
        return this.toUserCourse(row, course ? this.toCourseItem(course) : undefined);
      },
    );

    return { items };
  }

  /**
   * 加入/购买课程（幂等）
   */
  async enrollCourse(
    userId: string,
    dto: EnrollCourseDto,
  ): Promise<UserCourse> {
    if (!dto.courseId) {
      throw new BadRequestException('courseId 必填');
    }
    if (!this.isValidUuid(dto.courseId)) {
      throw new BadRequestException('courseId 格式无效');
    }

    // 校验课程是否存在
    const courseRows = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, dto.courseId))
      .limit(1);
    if (courseRows.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    // 已加入则返回已有记录
    const existing = await this.db
      .select()
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userProfile, userId),
          eq(userCourses.courseId, dto.courseId),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      return this.toUserCourse(
        existing[0],
        this.toCourseItem(courseRows[0]),
      );
    }

    // 插入新记录，处理并发唯一冲突
    try {
      const inserted = await this.db
        .insert(userCourses)
        .values({
          userProfile: userId,
          courseId: dto.courseId,
          progress: '0',
          completedLessons: 0,
          totalStudyMinutes: 0,
          status: 'in_progress',
        })
        .returning();
      return this.toUserCourse(
        inserted[0],
        this.toCourseItem(courseRows[0]),
      );
    } catch (error: unknown) {
      const code = this.extractPostgresErrorCode(error);
      if (code === '23505') {
        const retry = await this.db
          .select()
          .from(userCourses)
          .where(
            and(
              eq(userCourses.userProfile, userId),
              eq(userCourses.courseId, dto.courseId),
            ),
          )
          .limit(1);
        if (retry.length > 0) {
          return this.toUserCourse(
            retry[0],
            this.toCourseItem(courseRows[0]),
          );
        }
      }
      this.logger.error(
        `加入课程失败: ${JSON.stringify(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 校验 UUID 格式是否合法
   */
  private isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  /**
   * 某课程的学习详情：课程信息 + 所有课时进度列表
   * 用户未加入课程时返回 null，由 controller 决定返回内容
   */
  async getCourseDetail(
    userId: string,
    courseId: string,
  ): Promise<{
    userCourse: UserCourse;
    course: CourseItem;
    lessons: Array<CourseLesson & { progress?: UserLessonProgressItem }>;
  } | null> {
    if (!this.isValidUuid(courseId)) {
      throw new BadRequestException('courseId 格式无效');
    }

    const courseRows = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (courseRows.length === 0) {
      return null;
    }
    const courseItem: CourseItem = this.toCourseItem(courseRows[0]);

    const userCourseRow = await this.db
      .select()
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userProfile, userId),
          eq(userCourses.courseId, courseId),
        ),
      )
      .limit(1);
    if (userCourseRow.length === 0) {
      // 课程存在但用户未加入，返回课程信息 + 空进度
      return {
        userCourse: {
          id: '',
          courseId,
          enrolledAt: new Date(0).toISOString(),
          progress: 0,
          completedLessons: 0,
          totalStudyMinutes: 0,
          status: 'not_enrolled',
          course: courseItem,
        },
        course: courseItem,
        lessons: [],
      };
    }

    // 所有课时
    const lessonRows = await this.db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.lessonOrder);
    const lessons: CourseLesson[] = lessonRows.map(
      (row: typeof courseLessons.$inferSelect): CourseLesson => ({
        id: row.id,
        courseId: row.courseId,
        title: row.title,
        description: row.description ?? undefined,
        lessonOrder: row.lessonOrder,
        durationMinutes: row.durationMinutes,
        contentType: row.contentType,
        sentenceCount: row.sentenceCount,
        wordCount: row.wordCount,
        dictationCount: row.dictationCount,
      }),
    );

    // 用户对各课时的进度
    const progressRows = await this.db
      .select()
      .from(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userProfile, userId),
          eq(userLessonProgress.courseId, courseId),
        ),
      );
    const progressMap = new Map<string, UserLessonProgressItem>();
    for (const p of progressRows) {
      progressMap.set(p.lessonId, this.toUserLessonProgressItem(p));
    }

    const lessonsWithProgress = lessons.map(
      (lesson: CourseLesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id),
      }),
    );

    return {
      userCourse: this.toUserCourse(userCourseRow[0], courseItem),
      course: courseItem,
      lessons: lessonsWithProgress,
    };
  }

  /**
   * 更新某课程的学习进度（累计学习时长、完成课时数等）
   */
  async updateCourseProgress(
    userId: string,
    courseId: string,
    patch: {
      totalStudyMinutes?: number;
      completedLessons?: number;
    },
  ): Promise<UserCourse> {
    if (!this.isValidUuid(courseId)) {
      throw new BadRequestException('courseId 格式无效');
    }
    // 校验归属
    const existing = await this.db
      .select()
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userProfile, userId),
          eq(userCourses.courseId, courseId),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('未加入该课程');
    }

    const updateData: Partial<typeof userCourses.$inferInsert> = {};
    if (patch.totalStudyMinutes !== undefined) {
      updateData.totalStudyMinutes = patch.totalStudyMinutes;
    }
    if (patch.completedLessons !== undefined) {
      updateData.completedLessons = patch.completedLessons;
    }
    updateData.lastStudyAt = new Date();

    // 若更新了 completedLessons，重算 progress
    let completed = existing[0].completedLessons;
    if (patch.completedLessons !== undefined) {
      completed = patch.completedLessons;
    }

    // 取课程总课时数算 progress
    const courseRows = await this.db
      .select({ totalLessons: courses.totalLessons })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    const totalLessons: number = courseRows[0]?.totalLessons ?? 0;
    const progressNum: number =
      totalLessons > 0 ? Math.min(100, (completed / totalLessons) * 100) : 0;
    updateData.progress = String(progressNum);

    // 完成全部课时则标记 completed
    if (totalLessons > 0 && completed >= totalLessons) {
      updateData.status = 'completed';
    }

    const updated = await this.db
      .update(userCourses)
      .set(updateData)
      .where(eq(userCourses.id, existing[0].id))
      .returning();

    const courseItem = await this.getCourseItemById(courseId);
    return this.toUserCourse(updated[0], courseItem);
  }

  /**
   * 标记课时完成
   * 同时更新 user_lesson_progress 和 user_courses 的进度
   */
  async completeLesson(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<{
    userCourse: UserCourse;
    lessonProgress: UserLessonProgressItem;
  }> {
    if (!this.isValidUuid(courseId)) {
      throw new BadRequestException('courseId 格式无效');
    }
    if (!this.isValidUuid(lessonId)) {
      throw new BadRequestException('lessonId 格式无效');
    }
    // 校验是否已加入课程
    const userCourseRow = await this.db
      .select()
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userProfile, userId),
          eq(userCourses.courseId, courseId),
        ),
      )
      .limit(1);
    if (userCourseRow.length === 0) {
      throw new NotFoundException('未加入该课程');
    }

    // 校验课时属于该课程
    const lessonRows = await this.db
      .select()
      .from(courseLessons)
      .where(
        and(
          eq(courseLessons.id, lessonId),
          eq(courseLessons.courseId, courseId),
        ),
      )
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在或不属于该课程');
    }

    // 插入或更新课时进度
    const existingProgress = await this.db
      .select()
      .from(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userProfile, userId),
          eq(userLessonProgress.lessonId, lessonId),
        ),
      )
      .limit(1);

    let progressRow: typeof userLessonProgress.$inferSelect;
    if (existingProgress.length > 0) {
      if (existingProgress[0].status === 'completed') {
        // 已完成，直接返回
        progressRow = existingProgress[0];
      } else {
        const updated = await this.db
          .update(userLessonProgress)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(userLessonProgress.id, existingProgress[0].id))
          .returning();
        progressRow = updated[0];
      }
    } else {
      const inserted = await this.db
        .insert(userLessonProgress)
        .values({
          userProfile: userId,
          courseId,
          lessonId,
          status: 'completed',
          studyMinutes: lessonRows[0].durationMinutes,
          completedAt: new Date(),
        })
        .returning();
      progressRow = inserted[0];
    }

    // 统计该课程已完成课时数
    const completedCountResult = await this.db
      .select({ count: count() })
      .from(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userProfile, userId),
          eq(userLessonProgress.courseId, courseId),
          eq(userLessonProgress.status, 'completed'),
        ),
      );
    const completedCount: number = Number(
      completedCountResult[0]?.count ?? 0,
    );

    // 计算进度百分比
    const courseRows = await this.db
      .select({ totalLessons: courses.totalLessons })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    const totalLessons: number = courseRows[0]?.totalLessons ?? 0;
    const progressNum: number =
      totalLessons > 0
        ? Math.min(100, (completedCount / totalLessons) * 100)
        : 0;

    // 更新 user_courses
    const userCourseUpdate: Partial<typeof userCourses.$inferInsert> = {
      completedLessons: completedCount,
      progress: String(progressNum),
      lastStudyAt: new Date(),
    };
    if (totalLessons > 0 && completedCount >= totalLessons) {
      userCourseUpdate.status = 'completed';
    }

    const updatedUserCourse = await this.db
      .update(userCourses)
      .set(userCourseUpdate)
      .where(eq(userCourses.id, userCourseRow[0].id))
      .returning();

    const courseItem = await this.getCourseItemById(courseId);
    return {
      userCourse: this.toUserCourse(updatedUserCourse[0], courseItem),
      lessonProgress: this.toUserLessonProgressItem(progressRow),
    };
  }

  // ===== 内部转换方法 =====

  private toUserCourse(
    row: typeof userCourses.$inferSelect,
    course?: CourseItem,
  ): UserCourse {
    return {
      id: row.id,
      courseId: row.courseId,
      enrolledAt: row.enrolledAt
        ? row.enrolledAt.toISOString()
        : new Date(0).toISOString(),
      progress: Number(row.progress ?? 0),
      completedLessons: row.completedLessons,
      totalStudyMinutes: row.totalStudyMinutes,
      lastStudyAt: row.lastStudyAt
        ? row.lastStudyAt.toISOString()
        : undefined,
      status: row.status,
      course,
    };
  }

  private toCourseItem(row: typeof courses.$inferSelect): CourseItem {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      description: row.description ?? undefined,
      category: row.category,
      coverImage: row.coverImage ?? undefined,
      price: String(row.price),
      originalPrice: row.originalPrice
        ? String(row.originalPrice)
        : undefined,
      sharedCount: row.sharedCount,
      level: row.level,
      totalLessons: row.totalLessons,
      totalMinutes: row.totalMinutes,
      tags: row.tags ?? [],
      isFree: row.isFree,
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toUserLessonProgressItem(
    row: typeof userLessonProgress.$inferSelect,
  ): UserLessonProgressItem {
    return {
      id: row.id,
      courseId: row.courseId,
      lessonId: row.lessonId,
      status: row.status,
      score: row.score,
      studyMinutes: row.studyMinutes,
      completedAt: row.completedAt
        ? row.completedAt.toISOString()
        : undefined,
    };
  }

  private async getCourseItemById(
    courseId: string,
  ): Promise<CourseItem | undefined> {
    const rows = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    return rows.length > 0 ? this.toCourseItem(rows[0]) : undefined;
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
