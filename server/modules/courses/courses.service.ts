import { Injectable, Inject, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { courses, courseLessons } from '@server/database/schema';
import { eq, and, count, desc, asc, ilike, or } from 'drizzle-orm';
import type { CourseItem, CourseLesson, PagedResponse } from '@shared/api.interface';
import { MATH_CHINESE_SEED_COURSES } from './course-seed-data';

type CourseSelect = typeof courses.$inferSelect;
type LessonSelect = typeof courseLessons.$inferSelect;

@Injectable()
export class CoursesService implements OnModuleInit {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedMathChineseCourses();
    } catch (err: unknown) {
      this.logger.warn(`seed math/chinese courses skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async seedMathChineseCourses(): Promise<void> {
    const existing = await this.db
      .select({ count: count() })
      .from(courses)
      .where(or(eq(courses.category, 'math_primary'), eq(courses.category, 'chinese_primary')));
    if (existing[0]?.count > 0) {
      await this.updateSeedCovers();
      await this.ensureSeedLessons();
      this.logger.log('math/chinese primary courses already seeded, covers updated');
      return;
    }
    const values = MATH_CHINESE_SEED_COURSES.map((c) => ({
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      category: c.category,
      coverImage: c.coverImage || '',
      price: c.price,
      originalPrice: c.originalPrice,
      sharedCount: c.sharedCount ?? 0,
      level: c.level,
      totalLessons: c.totalLessons,
      totalMinutes: c.totalMinutes,
      tags: c.tags,
      isFree: c.isFree,
      isPublished: c.isPublished,
      sortOrder: c.sortOrder ?? 0,
    }));
    await this.db.insert(courses).values(values);
    await this.ensureSeedLessons();
    this.logger.log(`seeded ${values.length} math/chinese primary courses`);
  }

  private async ensureSeedLessons(): Promise<void> {
    const courseRows = await this.db
      .select({ id: courses.id, title: courses.title, category: courses.category, totalLessons: courses.totalLessons })
      .from(courses)
      .where(or(eq(courses.category, 'math_primary'), eq(courses.category, 'chinese_primary')));

    for (const course of courseRows) {
      const lessonCount = await this.db
        .select({ count: count() })
        .from(courseLessons)
        .where(eq(courseLessons.courseId, course.id));
      if ((lessonCount[0]?.count as number) > 0) continue;

      const isMath = course.category === 'math_primary';
      const total = course.totalLessons || 12;
      const lessons: Array<typeof courseLessons.$inferInsert> = [];
      for (let i = 1; i <= total; i += 1) {
        const lessonTitle = isMath
          ? `第${i}课 ${this.mathLessonTopic(course.title, i)}`
          : `第${i}课 ${this.chineseLessonTopic(course.title, i)}`;
        lessons.push({
          courseId: course.id,
          title: lessonTitle,
          description: isMath
            ? `口算训练与应用题练习，共 20 道题`
            : `课文朗读、生字学习与古诗背诵练习`,
          lessonOrder: i,
          durationMinutes: 15,
          contentType: isMath ? 'math' : 'chinese',
          sentenceCount: 0,
          wordCount: isMath ? 0 : 15,
          dictationCount: 0,
        });
      }
      await this.db.insert(courseLessons).values(lessons);
      this.logger.log(`seeded ${lessons.length} lessons for course ${course.title}`);
    }
  }

  private mathLessonTopic(courseTitle: string, idx: number): string {
    const gradeTopics: Record<string, string[]> = {
      '小学一年级数学': ['数一数', '比多少', '1-5的认识', '加减法一', '6-10的认识', '加减法二', '11-20各数', '20以内进位加', '认识钟表', '位置', '认识图形', '总复习'],
      '小学二年级数学': ['长度单位', '100以内加减二', '角的初步认识', '表内乘法一', '观察物体', '表内乘法二', '认识时间', '数学广角', '总复习一', '总复习二', '应用题一', '应用题二', '综合练习一', '综合练习二'],
      '小学三年级数学': ['时、分、秒', '万以内加减一', '测量', '万以内加减二', '倍的认识', '多位数乘一位数', '长方形和正方形', '分数的初步认识', '数学广角', '总复习一', '总复习二', '应用题一', '应用题二', '综合练习一', '综合练习二', '综合练习三'],
      '小学四年级数学': ['大数的认识', '公顷和平方千米', '角的度量', '三位数乘两位数', '平行四边形和梯形', '除数是两位数的除法', '条形统计图', '数学广角', '四则运算', '运算定律', '小数的意义', '三角形', '总复习一', '总复习二', '应用题一', '应用题二', '综合练习一', '综合练习二'],
      '小学五年级数学': ['小数乘法', '小数除法', '观察物体', '简易方程', '多边形的面积', '统计与可能性', '数学广角', '因数与倍数', '长方体和正方体', '分数的意义', '分数的加减法', '总复习一', '总复习二', '应用题一', '应用题二', '综合练习一', '综合练习二', '综合练习三', '综合练习四', '综合练习五'],
      '小学六年级数学': ['分数乘法', '位置与方向', '分数除法', '比', '圆', '百分数', '扇形统计图', '数学广角', '负数', '百分数二', '圆柱与圆锥', '比例', '总复习一', '总复习二', '应用题一', '应用题二', '综合练习一', '综合练习二', '综合练习三', '综合练习四'],
    };
    const topics = gradeTopics[courseTitle] || [];
    return topics[idx - 1] || `练习${idx}`;
  }

  private chineseLessonTopic(courseTitle: string, idx: number): string {
    const gradeTopics: Record<string, string[]> = {
      '小学一年级语文': ['拼音入门', '识字一', '汉语拼音', '课文一', '课文二', '课文三', '识字二', '课文四', '课文五', '课文六', '古诗一', '总复习'],
      '小学二年级语文': ['识字一', '课文一', '课文二', '识字二', '课文三', '课文四', '课文五', '课文六', '课文七', '古诗二首', '看图写话', '总复习一', '总复习二', '综合练习'],
      '小学三年级语文': ['课文一', '课文二', '古诗一', '课文三', '课文四', '课文五', '习作一', '课文六', '课文七', '课文八', '古诗二', '习作二', '总复习一', '总复习二', '综合练习一', '综合练习二'],
      '小学四年级语文': ['课文一', '课文二', '古诗一', '课文三', '课文四', '习作一', '课文五', '课文六', '课文七', '古诗二', '习作二', '课文八', '总复习一', '总复习二', '综合练习一', '综合练习二', '综合练习三', '综合练习四'],
      '小学五年级语文': ['课文一', '课文二', '古诗一', '课文三', '课文四', '习作一', '课文五', '课文六', '课文七', '古诗二', '习作二', '课文八', '课文九', '总复习一', '总复习二', '综合练习一', '综合练习二', '综合练习三', '综合练习四', '综合练习五'],
      '小学六年级语文': ['课文一', '课文二', '古诗一', '课文三', '课文四', '习作一', '课文五', '课文六', '课文七', '古诗二', '习作二', '课文八', '课文九', '总复习一', '总复习二', '综合练习一', '综合练习二', '综合练习三', '综合练习四', '综合练习五'],
    };
    const topics = gradeTopics[courseTitle] || [];
    return topics[idx - 1] || `练习${idx}`;
  }

  private async updateSeedCovers(): Promise<void> {
    // 仅在封面为空时补默认占位，避免覆盖已设置的封面
    await this.db
      .update(courses)
      .set({ coverImage: '' })
      .where(and(
        or(eq(courses.category, 'math_primary'), eq(courses.category, 'chinese_primary')),
        eq(courses.coverImage, ''),
      ));
  }

  private mapCourse(row: CourseSelect): CourseItem {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      description: row.description ?? undefined,
      category: row.category,
      coverImage: row.coverImage ?? undefined,
      price: String(row.price),
      originalPrice: row.originalPrice != null ? String(row.originalPrice) : undefined,
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

  async getList(params: {
    category?: string;
    level?: string;
    search?: string;
    page: number;
    pageSize: number;
    sort?: string;
  }): Promise<PagedResponse<CourseItem>> {
    const cacheKey: string = `courses:list:${JSON.stringify(params)}`;
    const cached: PagedResponse<CourseItem> | undefined = await this.cache.get<PagedResponse<CourseItem>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { category, level, search, page, pageSize, sort } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (category && category !== 'all') {
      conditions.push(eq(courses.category, category));
    }
    if (level) {
      conditions.push(eq(courses.level, level));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(or(
        ilike(courses.title, searchTerm),
        ilike(courses.subtitle, searchTerm),
      ));
    }
    conditions.push(eq(courses.isPublished, true));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sort) {
      case 'popular':
        orderBy = [desc(courses.sharedCount), desc(courses.createdAt)];
        break;
      case 'newest':
        orderBy = [desc(courses.createdAt)];
        break;
      case 'price_asc':
        orderBy = [asc(courses.price)];
        break;
      case 'price_desc':
        orderBy = [desc(courses.price)];
        break;
      default:
        orderBy = [asc(courses.sortOrder), desc(courses.createdAt)];
    }

    const [countResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(courses).where(whereClause),
      this.db.select().from(courses).where(whereClause).orderBy(...orderBy).limit(pageSize).offset(offset),
    ]);

    const total: number = Number(countResult[0]?.count ?? 0);
    const items: CourseItem[] = rows.map((row: CourseSelect) => this.mapCourse(row));

    const result: PagedResponse<CourseItem> = { items, total, page, pageSize };
    await this.cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async getDetail(id: string): Promise<CourseItem & { lessons: CourseLesson[] }> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestException('课程 ID 格式无效');
    }
    const courseRows: CourseSelect[] = await this.db.select().from(courses).where(eq(courses.id, id));
    if (courseRows.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    const course: CourseItem = this.mapCourse(courseRows[0]);

    const lessonRows: LessonSelect[] = await this.db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, id))
      .orderBy(asc(courseLessons.lessonOrder));

    const lessons: CourseLesson[] = lessonRows.map((row: LessonSelect) => this.mapLesson(row));

    return { ...course, lessons };
  }

  async create(data: Partial<typeof courses.$inferInsert>): Promise<CourseItem> {
    if (!data.title || !data.category) {
      throw new BadRequestException('课程标题和分类不能为空');
    }
    const insertData: typeof courses.$inferInsert = {
      title: data.title,
      category: data.category,
      subtitle: data.subtitle,
      description: data.description,
      coverImage: data.coverImage,
      price: data.price,
      originalPrice: data.originalPrice,
      level: data.level,
      totalLessons: data.totalLessons,
      totalMinutes: data.totalMinutes,
      tags: data.tags,
      isFree: data.isFree,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    };
    const inserted: CourseSelect[] = await this.db.insert(courses).values(insertData).returning();
    return this.mapCourse(inserted[0]);
  }

  async update(id: string, data: Partial<typeof courses.$inferInsert>): Promise<CourseItem> {
    const patch: Partial<typeof courses.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.subtitle !== undefined) patch.subtitle = data.subtitle;
    if (data.description !== undefined) patch.description = data.description;
    if (data.category !== undefined) patch.category = data.category;
    if (data.coverImage !== undefined) patch.coverImage = data.coverImage;
    if (data.price !== undefined) patch.price = data.price;
    if (data.originalPrice !== undefined) patch.originalPrice = data.originalPrice;
    if (data.level !== undefined) patch.level = data.level;
    if (data.totalLessons !== undefined) patch.totalLessons = data.totalLessons;
    if (data.totalMinutes !== undefined) patch.totalMinutes = data.totalMinutes;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.isFree !== undefined) patch.isFree = data.isFree;
    if (data.isPublished !== undefined) patch.isPublished = data.isPublished;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: CourseSelect[] = await this.db
      .update(courses)
      .set(patch)
      .where(eq(courses.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('课程不存在');
    }
    return this.mapCourse(updated[0]);
  }

  async remove(id: string): Promise<void> {
    const deleted: { id: string }[] = await this.db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning({ id: courses.id });

    if (deleted.length === 0) {
      throw new NotFoundException('课程不存在');
    }
  }
}
