import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { courses, courseLessons, sentencePuzzles, dictationItems, wordItems } from '@server/database/schema';
import type {
  AdminCourseItem,
  AdminSentenceItem,
  CourseLesson,
  DictationItem,
  PagedResponse,
  WordItem,
  WordParse,
} from '@shared/api.interface';
import { AdminAuditService } from '../admin-audit/admin-audit.service';

type CourseSelect = typeof courses.$inferSelect;
type LessonSelect = typeof courseLessons.$inferSelect;

const LOCK_TTL_MS = 30 * 60 * 1000; // 30 分钟

@Injectable()
export class AdminCoursesService {
  private readonly logger = new Logger(AdminCoursesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly auditService: AdminAuditService,
  ) {}

  private mapCourseItem(row: CourseSelect): AdminCourseItem {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      subject: row.subject,
      status: row.status,
      version: row.version,
      grade: row.grade ?? undefined,
      editorId: row.editorId ?? undefined,
      coverImage: row.coverImage ?? undefined,
      totalLessons: row.totalLessons,
      sharedCount: row.sharedCount,
      favoriteCount: 0,
      isPublished: row.isPublished,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapLesson(row: LessonSelect): CourseLesson {
    return {
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
    };
  }

  private mapWordItem(row: typeof wordItems.$inferSelect): WordItem {
    return {
      id: row.id,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      meaning: row.meaning,
      partOfSpeech: row.partOfSpeech ?? undefined,
      exampleSentence: row.exampleSentence ?? undefined,
      exampleTranslation: row.exampleTranslation ?? undefined,
      rootAffix: row.rootAffix ?? undefined,
      memoryTip: row.memoryTip ?? undefined,
      level: row.level ?? 'intermediate',
      tags: row.tags ?? [],
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      wordOrder: row.wordOrder ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
    };
  }

  // ===== 学科隔离：校验课程 subject 与当前管理员 subject 一致 =====
  private async assertCourseSubject(
    courseId: string,
    subject: string | undefined,
  ): Promise<void> {
    if (!subject) return; // 不传 subject 表示不限制（super_admin）

    const rows: { subject: string }[] = await this.db
      .select({ subject: courses.subject })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    if (rows[0].subject !== subject) {
      throw new ForbiddenException('无权操作其他学科的课程');
    }
  }

  // ===== 操作日志便捷封装 =====
  private async logAction(
    userId: string,
    userName: string,
    action: string,
    targetId: string,
    detail: Record<string, unknown> = {},
  ): Promise<void> {
    await this.auditService.log({
      userId,
      userName,
      action,
      targetType: 'course',
      targetId,
      detail,
    });
  }

  // ===== 课程列表 =====
  async getCourses(params: {
    category?: string;
    keyword?: string;
    subject?: string;
    status?: string;
    grade?: string;
    page: number;
    pageSize: number;
  }): Promise<PagedResponse<AdminCourseItem>> {
    const { category, keyword, subject, status, grade, page, pageSize } =
      params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (category) {
      conditions.push(eq(courses.category, category));
    }
    if (keyword) {
      conditions.push(ilike(courses.title, `%${keyword}%`));
    }
    if (subject) {
      conditions.push(eq(courses.subject, subject));
    }
    if (status) {
      conditions.push(eq(courses.status, status));
    }
    if (grade) {
      conditions.push(eq(courses.grade, grade));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(courses)
        .where(whereClause),
      this.db
        .select()
        .from(courses)
        .where(whereClause)
        .orderBy(desc(courses.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total: number = Number(countResult[0]?.count ?? 0);
    const items: AdminCourseItem[] = rows.map((row: CourseSelect) =>
      this.mapCourseItem(row),
    );

    return { items, total, page, pageSize };
  }

  // ===== 课程详情 =====
  async getCourse(
    id: string,
    subject?: string,
  ): Promise<
    AdminCourseItem & {
      description?: string;
      level: string;
      price: string;
      isFree: boolean;
    }
  > {
    await this.assertCourseSubject(id, subject);

    const rows: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    const row = rows[0];
    return {
      ...this.mapCourseItem(row),
      description: row.description ?? undefined,
      level: row.level,
      price: String(row.price),
      isFree: row.isFree,
    };
  }

  // ===== 创建课程 =====
  async createCourse(
    data: {
      title: string;
      category: string;
      description?: string;
      coverImage?: string;
      isPublished?: boolean;
      level?: string;
      price?: string | number;
      isFree?: boolean;
      subject?: string;
      grade?: string;
    },
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    if (!data.title?.trim() || !data.category) {
      throw new BadRequestException('课程标题和分类不能为空');
    }

    const insertData: typeof courses.$inferInsert = {
      title: data.title.trim(),
      category: data.category,
      description: data.description,
      coverImage: data.coverImage,
      isPublished: data.isPublished ?? false,
      level: data.level ?? 'beginner',
      price: data.price != null ? String(data.price) : '0',
      isFree: data.isFree ?? true,
      subject: data.subject ?? 'english',
      grade: data.grade,
      status: 'draft',
      version: 1,
    };

    const inserted: CourseSelect[] = await this.db
      .insert(courses)
      .values(insertData)
      .returning();

    const course = inserted[0];

    if (operator) {
      await this.logAction(operator.id, operator.name, 'create_course', course.id, {
        title: course.title,
        category: course.category,
        subject: course.subject,
      });
    }

    return this.mapCourseItem(course);
  }

  // ===== 更新课程 =====
  async updateCourse(
    id: string,
    data: {
      title?: string;
      category?: string;
      description?: string;
      coverImage?: string;
      isPublished?: boolean;
      level?: string;
      price?: string | number;
      isFree?: boolean;
      subject?: string;
      grade?: string;
      status?: string;
    },
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    await this.assertCourseSubject(id, subject);

    const patch: Partial<typeof courses.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.category !== undefined) patch.category = data.category;
    if (data.description !== undefined) patch.description = data.description;
    if (data.coverImage !== undefined) patch.coverImage = data.coverImage;
    if (data.isPublished !== undefined) patch.isPublished = data.isPublished;
    if (data.level !== undefined) patch.level = data.level;
    if (data.price !== undefined) patch.price = String(data.price);
    if (data.isFree !== undefined) patch.isFree = data.isFree;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.grade !== undefined) patch.grade = data.grade;
    if (data.status !== undefined) patch.status = data.status;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();
    // 软锁定：更新课程时顺手刷新 lockAt
    if (operator) {
      patch.lockAt = new Date();
    }

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set(patch)
      .where(eq(courses.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    if (operator) {
      const changedFields = Object.keys(patch).filter(
        (k) => !['updatedAt', 'lockAt'].includes(k),
      );
      await this.logAction(operator.id, operator.name, 'update_course', id, {
        changedFields,
      });
    }

    return this.mapCourseItem(updated[0]);
  }

  // ===== 删除课程 =====
  async deleteCourse(
    id: string,
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<void> {
    await this.assertCourseSubject(id, subject);

    // 先取出标题用于日志
    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);

    // 外键级联删除已在 schema 中配置 (onDelete cascade)，直接删课程即可
    const deleted: { id: string }[] = await this.db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning({ id: courses.id });

    if (deleted.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    if (operator && existing.length > 0) {
      await this.logAction(operator.id, operator.name, 'delete_course', id, {
        title: existing[0].title,
      });
    }

    this.logger.log(`删除课程: ${id}`);
  }

  // ===== 课时列表 =====
  async getLessons(
    courseId: string,
    subject?: string,
  ): Promise<CourseLesson[]> {
    await this.assertCourseSubject(courseId, subject);

    const rows: LessonSelect[] = await this.db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(asc(courseLessons.lessonOrder));

    return rows.map((row: LessonSelect) => this.mapLesson(row));
  }

  // ===== 新增课时 =====
  async createLesson(
    courseId: string,
    data: {
      title: string;
      lessonOrder?: number;
      durationMinutes?: number;
      contentType?: string;
      description?: string;
    },
    subject?: string,
  ): Promise<CourseLesson> {
    await this.assertCourseSubject(courseId, subject);

    if (!data.title?.trim()) {
      throw new BadRequestException('课时标题不能为空');
    }

    const insertData: typeof courseLessons.$inferInsert = {
      courseId,
      title: data.title.trim(),
      lessonOrder: data.lessonOrder ?? 0,
      durationMinutes: data.durationMinutes ?? 0,
      contentType: data.contentType ?? 'mixed',
      description: data.description,
    };

    const inserted: LessonSelect[] = await this.db
      .insert(courseLessons)
      .values(insertData)
      .returning();

    // 同步更新课程 totalLessons
    await this.db
      .update(courses)
      .set({
        totalLessons: sql`${courses.totalLessons} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));

    return this.mapLesson(inserted[0]);
  }

  // ===== 更新课时 =====
  async updateLesson(
    id: string,
    data: {
      title?: string;
      lessonOrder?: number;
      durationMinutes?: number;
      contentType?: string;
      description?: string;
    },
    subject?: string,
  ): Promise<CourseLesson> {
    // 先通过 lesson 找到 course 再做学科校验
    const lessonRows: { courseId: string }[] = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, id))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const patch: Partial<typeof courseLessons.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.lessonOrder !== undefined) patch.lessonOrder = data.lessonOrder;
    if (data.durationMinutes !== undefined)
      patch.durationMinutes = data.durationMinutes;
    if (data.contentType !== undefined) patch.contentType = data.contentType;
    if (data.description !== undefined) patch.description = data.description;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: LessonSelect[] = await this.db
      .update(courseLessons)
      .set(patch)
      .where(eq(courseLessons.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    return this.mapLesson(updated[0]);
  }

  // ===== 删除课时 =====
  async deleteLesson(
    id: string,
    subject?: string,
  ): Promise<void> {
    // 先通过 lesson 找到 course 再做学科校验
    const preRows: { courseId: string }[] = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, id))
      .limit(1);
    if (preRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(preRows[0].courseId, subject);

    const result = await this.db
      .delete(courseLessons)
      .where(eq(courseLessons.id, id))
      .returning({ id: courseLessons.id, courseId: courseLessons.courseId });

    if (result.length === 0) {
      throw new NotFoundException('课时不存在');
    }

    // 同步更新课程 totalLessons
    const courseId = result[0].courseId;
    await this.db
      .update(courses)
      .set({
        totalLessons: sql`${courses.totalLessons} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));
  }

  // ===== 课时句子列表 =====
  async getLessonSentences(
    lessonId: string,
    subject?: string,
  ): Promise<AdminSentenceItem[]> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const rows = await this.db
      .select()
      .from(sentencePuzzles)
      .where(eq(sentencePuzzles.lessonId, lessonId))
      .orderBy(asc(sentencePuzzles.puzzleOrder), asc(sentencePuzzles.createdAt));

    return rows.map((row) => ({
      id: row.id,
      sentence: row.sentence,
      translation: row.translation,
      wordParses: row.wordParses as WordParse[],
      sentenceAnalysis: row.sentenceAnalysis ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      puzzleOrder: row.puzzleOrder ?? 0,
    }));
  }

  // ===== 新增课时句子 =====
  async createLessonSentence(
    lessonId: string,
    data: {
      sentence: string;
      translation: string;
      wordParses?: WordParse[];
      sentenceAnalysis?: string;
      imageUrl?: string;
      puzzleOrder?: number;
      difficulty?: number;
      tags?: string[];
    },
    subject?: string,
  ): Promise<AdminSentenceItem> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    const courseId = lessonRows[0].courseId;
    await this.assertCourseSubject(courseId, subject);

    const inserted = await this.db
      .insert(sentencePuzzles)
      .values({
        lessonId,
        courseId,
        sentence: data.sentence,
        translation: data.translation,
        grammarComponents: [],
        wordParses: data.wordParses ?? [],
        sentenceAnalysis: data.sentenceAnalysis ?? null,
        imageUrl: data.imageUrl ?? null,
        puzzleOrder: data.puzzleOrder ?? 0,
        difficulty: data.difficulty ?? 1,
        tags: data.tags ?? [],
      })
      .returning();

    // 更新课时 sentenceCount
    await this.db
      .update(courseLessons)
      .set({ sentenceCount: sql`${courseLessons.sentenceCount} + 1` })
      .where(eq(courseLessons.id, lessonId));

    return {
      id: inserted[0].id,
      sentence: inserted[0].sentence,
      translation: inserted[0].translation,
      wordParses: inserted[0].wordParses as WordParse[],
      sentenceAnalysis: inserted[0].sentenceAnalysis ?? undefined,
      imageUrl: inserted[0].imageUrl ?? undefined,
      lessonId: inserted[0].lessonId ?? undefined,
      courseId: inserted[0].courseId ?? undefined,
      textbookId: inserted[0].textbookId ?? undefined,
      unitId: inserted[0].unitId ?? undefined,
      puzzleOrder: inserted[0].puzzleOrder ?? 0,
    };
  }

  // ===== 更新课时句子 =====
  async updateLessonSentence(
    lessonId: string,
    sentenceId: string,
    data: {
      sentence?: string;
      translation?: string;
      wordParses?: WordParse[];
      sentenceAnalysis?: string;
      imageUrl?: string;
      puzzleOrder?: number;
      difficulty?: number;
      tags?: string[];
    },
    subject?: string,
  ): Promise<AdminSentenceItem> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const patch: Partial<typeof sentencePuzzles.$inferInsert> = {};
    if (data.sentence !== undefined) patch.sentence = data.sentence;
    if (data.translation !== undefined) patch.translation = data.translation;
    if (data.wordParses !== undefined) patch.wordParses = data.wordParses as unknown as string[];
    if (data.sentenceAnalysis !== undefined)
      patch.sentenceAnalysis = data.sentenceAnalysis;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.puzzleOrder !== undefined) patch.puzzleOrder = data.puzzleOrder;
    if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
    if (data.tags !== undefined) patch.tags = data.tags;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(sentencePuzzles)
      .set(patch)
      .where(
        and(
          eq(sentencePuzzles.id, sentenceId),
          eq(sentencePuzzles.lessonId, lessonId),
        ),
      )
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('句子不存在');
    }

    return {
      id: updated[0].id,
      sentence: updated[0].sentence,
      translation: updated[0].translation,
      wordParses: updated[0].wordParses as WordParse[],
      sentenceAnalysis: updated[0].sentenceAnalysis ?? undefined,
      imageUrl: updated[0].imageUrl ?? undefined,
      lessonId: updated[0].lessonId ?? undefined,
      courseId: updated[0].courseId ?? undefined,
      textbookId: updated[0].textbookId ?? undefined,
      unitId: updated[0].unitId ?? undefined,
      puzzleOrder: updated[0].puzzleOrder ?? 0,
    };
  }

  // ===== 删除课时句子 =====
  async deleteLessonSentence(
    lessonId: string,
    sentenceId: string,
    subject?: string,
  ): Promise<void> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const result = await this.db
      .delete(sentencePuzzles)
      .where(
        and(
          eq(sentencePuzzles.id, sentenceId),
          eq(sentencePuzzles.lessonId, lessonId),
        ),
      )
      .returning({ id: sentencePuzzles.id });

    if (result.length === 0) {
      throw new NotFoundException('句子不存在');
    }

    // 更新课时 sentenceCount
    await this.db
      .update(courseLessons)
      .set({ sentenceCount: sql`${courseLessons.sentenceCount} - 1` })
      .where(eq(courseLessons.id, lessonId));
  }

  // ===== 课时听写列表 =====
  async getLessonDictations(
    lessonId: string,
    subject?: string,
  ): Promise<DictationItem[]> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const rows = await this.db
      .select()
      .from(dictationItems)
      .where(eq(dictationItems.lessonId, lessonId))
      .orderBy(asc(dictationItems.itemOrder), asc(dictationItems.createdAt));

    return rows.map((row) => ({
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      sentence: row.sentence,
      translation: row.translation,
      hint: row.hint ?? undefined,
      difficulty: row.difficulty ?? 1,
      itemOrder: row.itemOrder ?? 0,
    }));
  }

  // ===== 新增课时听写 =====
  async createLessonDictation(
    lessonId: string,
    data: {
      sentence: string;
      translation: string;
      hint?: string;
      difficulty?: number;
      itemOrder?: number;
      tags?: string[];
    },
    subject?: string,
  ): Promise<DictationItem> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    const courseId = lessonRows[0].courseId;
    await this.assertCourseSubject(courseId, subject);

    const inserted = await this.db
      .insert(dictationItems)
      .values({
        lessonId,
        courseId,
        sentence: data.sentence,
        translation: data.translation,
        hint: data.hint ?? null,
        difficulty: data.difficulty ?? 1,
        itemOrder: data.itemOrder ?? 0,
        tags: data.tags ?? [],
      })
      .returning();

    // 更新课时 dictationCount
    await this.db
      .update(courseLessons)
      .set({ dictationCount: sql`${courseLessons.dictationCount} + 1` })
      .where(eq(courseLessons.id, lessonId));

    return {
      id: inserted[0].id,
      lessonId: inserted[0].lessonId ?? undefined,
      courseId: inserted[0].courseId ?? undefined,
      textbookId: inserted[0].textbookId ?? undefined,
      unitId: inserted[0].unitId ?? undefined,
      sentence: inserted[0].sentence,
      translation: inserted[0].translation,
      hint: inserted[0].hint ?? undefined,
      difficulty: inserted[0].difficulty ?? 1,
      itemOrder: inserted[0].itemOrder ?? 0,
    };
  }

  // ===== 更新课时听写 =====
  async updateLessonDictation(
    lessonId: string,
    dictationId: string,
    data: {
      sentence?: string;
      translation?: string;
      hint?: string;
      difficulty?: number;
      itemOrder?: number;
      tags?: string[];
    },
    subject?: string,
  ): Promise<DictationItem> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const patch: Partial<typeof dictationItems.$inferInsert> = {};
    if (data.sentence !== undefined) patch.sentence = data.sentence;
    if (data.translation !== undefined) patch.translation = data.translation;
    if (data.hint !== undefined) patch.hint = data.hint;
    if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
    if (data.itemOrder !== undefined) patch.itemOrder = data.itemOrder;
    if (data.tags !== undefined) patch.tags = data.tags;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(dictationItems)
      .set(patch)
      .where(
        and(
          eq(dictationItems.id, dictationId),
          eq(dictationItems.lessonId, lessonId),
        ),
      )
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('听写不存在');
    }

    return {
      id: updated[0].id,
      lessonId: updated[0].lessonId ?? undefined,
      courseId: updated[0].courseId ?? undefined,
      textbookId: updated[0].textbookId ?? undefined,
      unitId: updated[0].unitId ?? undefined,
      sentence: updated[0].sentence,
      translation: updated[0].translation,
      hint: updated[0].hint ?? undefined,
      difficulty: updated[0].difficulty ?? 1,
      itemOrder: updated[0].itemOrder ?? 0,
    };
  }

  // ===== 删除课时听写 =====
  async deleteLessonDictation(
    lessonId: string,
    dictationId: string,
    subject?: string,
  ): Promise<void> {
    const lessonRows = await this.db
      .select({ courseId: courseLessons.courseId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (lessonRows.length === 0) {
      throw new NotFoundException('课时不存在');
    }
    await this.assertCourseSubject(lessonRows[0].courseId, subject);

    const result = await this.db
      .delete(dictationItems)
      .where(
        and(
          eq(dictationItems.id, dictationId),
          eq(dictationItems.lessonId, lessonId),
        ),
      )
      .returning({ id: dictationItems.id });

    if (result.length === 0) {
      throw new NotFoundException('听写不存在');
    }

    // 更新课时 dictationCount
    await this.db
      .update(courseLessons)
      .set({ dictationCount: sql`${courseLessons.dictationCount} - 1` })
      .where(eq(courseLessons.id, lessonId));
  }

  // ===== 课程单词列表 =====
  async getCourseWords(
    courseId: string,
    keyword?: string,
    subject?: string,
  ): Promise<WordItem[]> {
    await this.assertCourseSubject(courseId, subject);

    const courseTag = `course:${courseId}`;
    const tagFilter = sql`${wordItems.tags} @> ARRAY[${courseTag}]::text[]`;

    const conditions = [tagFilter];
    if (keyword) {
      conditions.push(
        or(
          ilike(wordItems.word, `%${keyword}%`),
          ilike(wordItems.meaning, `%${keyword}%`),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(wordItems)
      .where(and(...conditions))
      .orderBy(asc(wordItems.wordOrder), desc(wordItems.createdAt));

    return rows.map((row) => this.mapWordItem(row));
  }

  // ===== 新增课程单词 =====
  async createCourseWord(
    courseId: string,
    data: {
      word: string;
      phonetic?: string;
      meaning: string;
      partOfSpeech?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      level?: string;
      tags?: string[];
      wordOrder?: number;
    },
    subject?: string,
  ): Promise<WordItem> {
    await this.assertCourseSubject(courseId, subject);

    if (!data.word?.trim() || !data.meaning?.trim()) {
      throw new BadRequestException('单词和释义不能为空');
    }

    const courseTag = `course:${courseId}`;
    const tags = data.tags ? [...data.tags] : [];
    if (!tags.includes(courseTag)) {
      tags.push(courseTag);
    }

    const inserted = await this.db
      .insert(wordItems)
      .values({
        word: data.word.trim(),
        phonetic: data.phonetic ?? null,
        meaning: data.meaning.trim(),
        partOfSpeech: data.partOfSpeech ?? null,
        exampleSentence: data.exampleSentence ?? null,
        exampleTranslation: data.exampleTranslation ?? null,
        level: data.level ?? 'intermediate',
        tags,
        wordOrder: data.wordOrder ?? 0,
      })
      .returning();

    return this.mapWordItem(inserted[0]);
  }

  // ===== 更新课程单词 =====
  async updateCourseWord(
    courseId: string,
    wordId: string,
    data: {
      word?: string;
      phonetic?: string;
      meaning?: string;
      partOfSpeech?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      level?: string;
      tags?: string[];
      wordOrder?: number;
    },
    subject?: string,
  ): Promise<WordItem> {
    await this.assertCourseSubject(courseId, subject);

    const courseTag = `course:${courseId}`;

    // 校验单词必须属于该课程
    const existing = await this.db
      .select()
      .from(wordItems)
      .where(
        and(
          eq(wordItems.id, wordId),
          sql`${wordItems.tags} @> ARRAY[${courseTag}]::text[]`,
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('单词不存在或不属于该课程');
    }

    const patch: Partial<typeof wordItems.$inferInsert> = {};
    if (data.word !== undefined) patch.word = data.word;
    if (data.phonetic !== undefined) patch.phonetic = data.phonetic;
    if (data.meaning !== undefined) patch.meaning = data.meaning;
    if (data.partOfSpeech !== undefined) patch.partOfSpeech = data.partOfSpeech;
    if (data.exampleSentence !== undefined)
      patch.exampleSentence = data.exampleSentence;
    if (data.exampleTranslation !== undefined)
      patch.exampleTranslation = data.exampleTranslation;
    if (data.level !== undefined) patch.level = data.level;
    if (data.wordOrder !== undefined) patch.wordOrder = data.wordOrder;
    if (data.tags !== undefined) {
      // 确保 course:<courseId> tag 保留
      const newTags = [...data.tags];
      if (!newTags.includes(courseTag)) {
        newTags.push(courseTag);
      }
      patch.tags = newTags;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(wordItems)
      .set(patch)
      .where(eq(wordItems.id, wordId))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    return this.mapWordItem(updated[0]);
  }

  // ===== 删除课程单词 =====
  async deleteCourseWord(
    courseId: string,
    wordId: string,
    subject?: string,
  ): Promise<void> {
    await this.assertCourseSubject(courseId, subject);

    const courseTag = `course:${courseId}`;

    const result = await this.db
      .delete(wordItems)
      .where(
        and(
          eq(wordItems.id, wordId),
          sql`${wordItems.tags} @> ARRAY[${courseTag}]::text[]`,
        ),
      )
      .returning({ id: wordItems.id });

    if (result.length === 0) {
      throw new NotFoundException('单词不存在或不属于该课程');
    }
  }

  // ===== 提交审核 =====
  async submitReview(
    id: string,
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    if (existing[0].status !== 'draft') {
      throw new BadRequestException(
        `当前状态为 ${existing[0].status}，仅草稿状态可提交审核`,
      );
    }

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set({
        status: 'review',
        editorId: operator?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    if (operator) {
      await this.logAction(operator.id, operator.name, 'submit_review', id, {
        from: 'draft',
        to: 'review',
      });
    }

    return this.mapCourseItem(updated[0]);
  }

  // ===== 审核通过 =====
  async approveReview(
    id: string,
    comment: string | undefined,
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    if (existing[0].status !== 'review') {
      throw new BadRequestException(
        `当前状态为 ${existing[0].status}，仅审核中状态可审核通过`,
      );
    }

    const newVersion = (existing[0].version ?? 1) + 1;

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set({
        status: 'published',
        isPublished: true,
        version: newVersion,
        reviewComment: comment ?? null,
        lockOwner: null,
        lockAt: null,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    if (operator) {
      await this.logAction(operator.id, operator.name, 'approve_review', id, {
        from: 'review',
        to: 'published',
        version: newVersion,
        comment: comment ?? '',
      });
    }

    return this.mapCourseItem(updated[0]);
  }

  // ===== 审核驳回 =====
  async rejectReview(
    id: string,
    comment: string,
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    if (existing[0].status !== 'review') {
      throw new BadRequestException(
        `当前状态为 ${existing[0].status}，仅审核中状态可审核驳回`,
      );
    }

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set({
        status: 'draft',
        reviewComment: comment,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    if (operator) {
      await this.logAction(operator.id, operator.name, 'reject_review', id, {
        from: 'review',
        to: 'draft',
        comment,
      });
    }

    return this.mapCourseItem(updated[0]);
  }

  // ===== 发布（草稿/已发布/已下架 可发布）=====
  async publish(
    id: string,
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    const fromStatus = existing[0].status;
    if (!['draft', 'published', 'offline'].includes(fromStatus)) {
      throw new BadRequestException(
        `当前状态为 ${fromStatus}，不支持直接发布`,
      );
    }

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set({
        status: 'published',
        isPublished: true,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    if (operator) {
      await this.logAction(operator.id, operator.name, 'publish', id, {
        from: fromStatus,
        to: 'published',
      });
    }

    return this.mapCourseItem(updated[0]);
  }

  // ===== 下架 =====
  async offline(
    id: string,
    subject?: string,
    operator?: { id: string; name: string },
  ): Promise<AdminCourseItem> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    if (existing[0].status !== 'published') {
      throw new BadRequestException(
        `当前状态为 ${existing[0].status}，仅已发布状态可下架`,
      );
    }

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set({
        status: 'offline',
        isPublished: false,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    if (operator) {
      await this.logAction(operator.id, operator.name, 'offline', id, {
        from: 'published',
        to: 'offline',
      });
    }

    return this.mapCourseItem(updated[0]);
  }

  // ===== 获取编辑锁 =====
  async acquireLock(
    id: string,
    userId: string,
    subject?: string,
  ): Promise<{ acquired: boolean; lockOwner?: string }> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    const row = existing[0];
    const now = Date.now();
    const lockExpired =
      !row.lockAt || now - row.lockAt.getTime() > LOCK_TTL_MS;

    // 已是自己的锁，直接续期
    if (row.lockOwner && row.lockOwner === userId) {
      await this.db
        .update(courses)
        .set({ lockAt: new Date() })
        .where(eq(courses.id, id));
      return { acquired: true, lockOwner: userId };
    }

    // 无锁或已过期，抢占
    if (!row.lockOwner || lockExpired) {
      await this.db
        .update(courses)
        .set({ lockOwner: userId, lockAt: new Date() })
        .where(eq(courses.id, id));
      return { acquired: true, lockOwner: userId };
    }

    // 被别人占用
    return { acquired: false, lockOwner: row.lockOwner };
  }

  // ===== 释放编辑锁 =====
  async releaseLock(
    id: string,
    userId: string,
    subject?: string,
  ): Promise<void> {
    await this.assertCourseSubject(id, subject);

    const existing: CourseSelect[] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    const row = existing[0];
    if (row.lockOwner && row.lockOwner !== userId) {
      throw new ForbiddenException('仅锁定者本人可释放编辑锁');
    }

    await this.db
      .update(courses)
      .set({ lockOwner: null, lockAt: null })
      .where(eq(courses.id, id));
  }
}
