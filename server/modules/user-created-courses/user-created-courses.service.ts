import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
  CapabilityService,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  eq, and, or, asc, desc, count, sql,
} from 'drizzle-orm';
import {
  userCreatedCourses,
  userCreatedCourseUnits,
  userCreatedCourseWords,
  userCreatedCourseSentences,
} from '@server/database/schema';
import type {
  GenerateEnglishWordStructureInfoOneInput,
  GenerateEnglishWordStructureInfoOneOutput,
} from '@shared/plugin-types';

// ===== DTO Types =====

export interface CreateCourseDto {
  name: string;
  subject?: string;
  category?: string;
  description?: string;
  coverImage?: string;
}

export interface UpdateCourseDto {
  name?: string;
  subject?: string;
  category?: string;
  description?: string;
  coverImage?: string;
}

export interface CreateUnitDto {
  title: string;
  unitOrder?: number;
  description?: string;
}

export interface UpdateUnitDto {
  title?: string;
  unitOrder?: number;
  description?: string;
}

export interface CreateWordDto {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface UpdateWordDto {
  word?: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning?: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface WordImportItem {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface CreateSentenceDto {
  sentence: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface UpdateSentenceDto {
  sentence?: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface SentenceImportItem {
  sentence: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface ImportError {
  row: number;
  word?: string;
  sentence?: string;
  reason: string;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

export interface CourseListResponse {
  items: UserCreatedCourseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserCreatedCourseDto {
  id: string;
  name: string;
  coverImage?: string;
  subject: string;
  category?: string;
  description?: string;
  unitCount: number;
  visibility: string;
  status: string;
  auditNote?: string;
  learnCount: number;
  likeCount: number;
  favoriteCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetailDto extends UserCreatedCourseDto {
  units: UnitSummaryDto[];
}

export interface UnitSummaryDto {
  id: string;
  title: string;
  unitOrder: number;
  wordCount: number;
  sentenceCount: number;
}

export interface UnitDto {
  id: string;
  courseId: string;
  title: string;
  unitOrder: number;
  description?: string;
  wordCount: number;
  sentenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WordDto {
  id: string;
  unitId: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SentenceDto {
  id: string;
  unitId: string;
  sentence: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateWordError {
  word: string;
  reason: string;
}

export interface BatchGenerateResult {
  total: number;
  success: number;
  failed: number;
  errors: GenerateWordError[];
}

const WORD_PLUGIN_INSTANCE_ID = 'generate_english_word_structure_info_1';
const BATCH_GENERATE_MAX = 20;

@Injectable()
export class UserCreatedCoursesService {
  private readonly logger = new Logger(UserCreatedCoursesService.name);
  private wordCapability: ReturnType<CapabilityService['load']> | null = null;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly capabilityService: CapabilityService,
  ) {}

  private getWordCapability() {
    if (!this.wordCapability) {
      this.wordCapability = this.capabilityService.load(WORD_PLUGIN_INSTANCE_ID);
    }
    return this.wordCapability;
  }

  // ===== Helper: user_profile column comparison =====

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByCourse(userId: string): any {
    return sql`(${userCreatedCourses.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByUnit(userId: string): any {
    return sql`(${userCreatedCourseUnits.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByWord(userId: string): any {
    return sql`(${userCreatedCourseWords.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdBySentence(userId: string): any {
    return sql`(${userCreatedCourseSentences.createdBy}).user_id = ${userId}`;
  }

  // ===== Row → DTO mappers =====

  private toCourseDto(row: typeof userCreatedCourses.$inferSelect): UserCreatedCourseDto {
    return {
      id: row.id,
      name: row.name,
      coverImage: row.coverImage ?? undefined,
      subject: row.subject,
      category: row.category ?? undefined,
      description: row.description ?? undefined,
      unitCount: row.unitCount,
      visibility: row.visibility,
      status: row.status,
      auditNote: row.auditNote ?? undefined,
      learnCount: row.learnCount,
      likeCount: row.likeCount,
      favoriteCount: row.favoriteCount,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toUnitDto(row: typeof userCreatedCourseUnits.$inferSelect): UnitDto {
    return {
      id: row.id,
      courseId: row.courseId,
      title: row.title,
      unitOrder: row.unitOrder,
      description: row.description ?? undefined,
      wordCount: row.wordCount,
      sentenceCount: row.sentenceCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toUnitSummary(row: typeof userCreatedCourseUnits.$inferSelect): UnitSummaryDto {
    return {
      id: row.id,
      title: row.title,
      unitOrder: row.unitOrder,
      wordCount: row.wordCount,
      sentenceCount: row.sentenceCount,
    };
  }

  private toWordDto(row: typeof userCreatedCourseWords.$inferSelect): WordDto {
    return {
      id: row.id,
      unitId: row.unitId,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      partOfSpeech: row.partOfSpeech ?? undefined,
      meaning: row.meaning,
      example: row.example ?? undefined,
      illustrationUrl: row.illustrationUrl ?? undefined,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toSentenceDto(row: typeof userCreatedCourseSentences.$inferSelect): SentenceDto {
    return {
      id: row.id,
      unitId: row.unitId,
      sentence: row.sentence,
      translation: row.translation ?? undefined,
      grammarTag: row.grammarTag ?? undefined,
      illustrationUrl: row.illustrationUrl ?? undefined,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // ===== Ownership verification =====

  /**
   * Verify course belongs to user.
   * Throws NotFound if not found, Forbidden if not owner.
   */
  private async verifyCourseOwner(
    userId: string,
    courseId: string,
  ): Promise<typeof userCreatedCourses.$inferSelect> {
    const rows = await this.db
      .select()
      .from(userCreatedCourses)
      .where(eq(userCreatedCourses.id, courseId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('课程不存在');
    const row = rows[0];
    if (row.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该课程');
    }
    return row;
  }

  private async verifyUnitOwner(
    userId: string,
    unitId: string,
  ): Promise<typeof userCreatedCourseUnits.$inferSelect> {
    const rows = await this.db
      .select()
      .from(userCreatedCourseUnits)
      .where(eq(userCreatedCourseUnits.id, unitId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('单元不存在');
    const row = rows[0];
    if (row.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该单元');
    }
    return row;
  }

  // ===== Course CRUD =====

  async getCourses(
    userId: string,
    subject?: string,
    category?: string,
    keyword?: string,
    page = 1,
    pageSize = 20,
  ): Promise<CourseListResponse> {
    const visibilityConditions = or(
      this.createdByCourse(userId),
      and(
        eq(userCreatedCourses.visibility, 'public'),
        eq(userCreatedCourses.status, 'approved'),
      ),
    );

    const conditions = [visibilityConditions];
    if (subject) conditions.push(eq(userCreatedCourses.subject, subject));
    if (category) conditions.push(eq(userCreatedCourses.category, category));
    if (keyword) {
      conditions.push(sql`(
        ${userCreatedCourses.name} ILIKE ${`%${keyword}%`} OR
        ${userCreatedCourses.description} ILIKE ${`%${keyword}%`}
      )`);
    }

    const offset = (page - 1) * pageSize;
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(userCreatedCourses)
      .where(where);

    const rows = await this.db
      .select()
      .from(userCreatedCourses)
      .where(where)
      .orderBy(desc(userCreatedCourses.updatedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: rows.map((r) => this.toCourseDto(r)),
      total: Number(total),
      page,
      pageSize,
    };
  }

  async getCourse(userId: string, id: string): Promise<CourseDetailDto> {
    const rows = await this.db
      .select()
      .from(userCreatedCourses)
      .where(and(
        eq(userCreatedCourses.id, id),
        or(
          this.createdByCourse(userId),
          and(
            eq(userCreatedCourses.visibility, 'public'),
            eq(userCreatedCourses.status, 'approved'),
          ),
        ),
      ))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('课程不存在');

    const course = rows[0];
    const units = await this.db
      .select()
      .from(userCreatedCourseUnits)
      .where(eq(userCreatedCourseUnits.courseId, id))
      .orderBy(asc(userCreatedCourseUnits.unitOrder), asc(userCreatedCourseUnits.createdAt));

    return {
      ...this.toCourseDto(course),
      units: units.map((u) => this.toUnitSummary(u)),
    };
  }

  async createCourse(
    userId: string,
    dto: CreateCourseDto,
  ): Promise<UserCreatedCourseDto> {
    const now = new Date();
    const rows = await this.db
      .insert(userCreatedCourses)
      .values({
        name: dto.name.trim(),
        subject: dto.subject ?? 'english',
        category: dto.category,
        description: dto.description,
        coverImage: dto.coverImage,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      })
      .returning();
    return this.toCourseDto(rows[0]);
  }

  async updateCourse(
    userId: string,
    id: string,
    dto: UpdateCourseDto,
  ): Promise<UserCreatedCourseDto> {
    await this.verifyCourseOwner(userId, id);

    const patch: Partial<typeof userCreatedCourses.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.subject !== undefined) patch.subject = dto.subject;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.coverImage !== undefined) patch.coverImage = dto.coverImage;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userCreatedCourses)
      .set(patch)
      .where(eq(userCreatedCourses.id, id))
      .returning();
    if (rows.length === 0) throw new NotFoundException('课程不存在');
    return this.toCourseDto(rows[0]);
  }

  async deleteCourse(userId: string, id: string): Promise<void> {
    await this.verifyCourseOwner(userId, id);

    const rows = await this.db
      .delete(userCreatedCourses)
      .where(eq(userCreatedCourses.id, id))
      .returning({ id: userCreatedCourses.id });
    if (rows.length === 0) throw new NotFoundException('课程不存在');
  }

  // ===== Unit Management =====

  async getUnits(userId: string, courseId: string): Promise<UnitDto[]> {
    await this.getCourse(userId, courseId);

    const units = await this.db
      .select()
      .from(userCreatedCourseUnits)
      .where(eq(userCreatedCourseUnits.courseId, courseId))
      .orderBy(asc(userCreatedCourseUnits.unitOrder), asc(userCreatedCourseUnits.createdAt));
    return units.map((u) => this.toUnitDto(u));
  }

  async createUnit(
    userId: string,
    courseId: string,
    dto: CreateUnitDto,
  ): Promise<UnitDto> {
    await this.verifyCourseOwner(userId, courseId);

    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      const existing = await tx
        .select({ unitOrder: userCreatedCourseUnits.unitOrder })
        .from(userCreatedCourseUnits)
        .where(eq(userCreatedCourseUnits.courseId, courseId))
        .orderBy(desc(userCreatedCourseUnits.unitOrder))
        .limit(1);

      const nextOrder = dto.unitOrder ?? (existing.length > 0 ? existing[0].unitOrder + 1 : 1);

      const inserted = await tx
        .insert(userCreatedCourseUnits)
        .values({
          courseId,
          title: dto.title.trim(),
          unitOrder: nextOrder,
          description: dto.description,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        })
        .returning();

      await tx
        .update(userCreatedCourses)
        .set({
          unitCount: sql`${userCreatedCourses.unitCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourses.id, courseId));

      return inserted[0];
    });

    return this.toUnitDto(result);
  }

  async updateUnit(
    userId: string,
    unitId: string,
    dto: UpdateUnitDto,
  ): Promise<UnitDto> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const patch: Partial<typeof userCreatedCourseUnits.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.unitOrder !== undefined) patch.unitOrder = dto.unitOrder;
    if (dto.description !== undefined) patch.description = dto.description;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userCreatedCourseUnits)
      .set(patch)
      .where(eq(userCreatedCourseUnits.id, unitId))
      .returning();
    if (rows.length === 0) throw new NotFoundException('单元不存在');

    await this.db
      .update(userCreatedCourses)
      .set({
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(userCreatedCourses.id, unit.courseId));

    return this.toUnitDto(rows[0]);
  }

  async deleteUnit(userId: string, unitId: string): Promise<void> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .delete(userCreatedCourseUnits)
        .where(eq(userCreatedCourseUnits.id, unitId));

      await tx
        .update(userCreatedCourses)
        .set({
          unitCount: sql`${userCreatedCourses.unitCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourses.id, unit.courseId));
    });
  }

  // ===== Word Management =====

  async getWords(userId: string, unitId: string): Promise<WordDto[]> {
    const unit = await this.db
      .select()
      .from(userCreatedCourseUnits)
      .where(eq(userCreatedCourseUnits.id, unitId))
      .limit(1);
    if (unit.length === 0) throw new NotFoundException('单元不存在');
    await this.getCourse(userId, unit[0].courseId);

    const words = await this.db
      .select()
      .from(userCreatedCourseWords)
      .where(eq(userCreatedCourseWords.unitId, unitId))
      .orderBy(asc(userCreatedCourseWords.sortOrder), asc(userCreatedCourseWords.createdAt));
    return words.map((w) => this.toWordDto(w));
  }

  async createWord(
    userId: string,
    unitId: string,
    dto: CreateWordDto,
  ): Promise<WordDto> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(userCreatedCourseWords)
        .values({
          unitId,
          word: dto.word.trim(),
          phonetic: dto.phonetic,
          partOfSpeech: dto.partOfSpeech,
          meaning: dto.meaning.trim(),
          example: dto.example,
          illustrationUrl: dto.illustrationUrl,
          sortOrder: dto.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        })
        .returning();

      await tx
        .update(userCreatedCourseUnits)
        .set({
          wordCount: sql`${userCreatedCourseUnits.wordCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourseUnits.id, unitId));

      await tx
        .update(userCreatedCourses)
        .set({
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourses.id, unit.courseId));

      return inserted[0];
    });

    return this.toWordDto(result);
  }

  async updateWord(
    userId: string,
    wordId: string,
    dto: UpdateWordDto,
  ): Promise<WordDto> {
    const wordRows = await this.db
      .select()
      .from(userCreatedCourseWords)
      .where(eq(userCreatedCourseWords.id, wordId))
      .limit(1);
    if (wordRows.length === 0) throw new NotFoundException('单词不存在');
    const word = wordRows[0];
    if (word.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该单词');
    }

    const patch: Partial<typeof userCreatedCourseWords.$inferInsert> = {};
    if (dto.word !== undefined) patch.word = dto.word.trim();
    if (dto.phonetic !== undefined) patch.phonetic = dto.phonetic;
    if (dto.partOfSpeech !== undefined) patch.partOfSpeech = dto.partOfSpeech;
    if (dto.meaning !== undefined) patch.meaning = dto.meaning.trim();
    if (dto.example !== undefined) patch.example = dto.example;
    if (dto.illustrationUrl !== undefined) patch.illustrationUrl = dto.illustrationUrl;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userCreatedCourseWords)
      .set(patch)
      .where(eq(userCreatedCourseWords.id, wordId))
      .returning();
    if (rows.length === 0) throw new NotFoundException('单词不存在');
    return this.toWordDto(rows[0]);
  }

  async deleteWord(userId: string, wordId: string): Promise<void> {
    const wordRows = await this.db
      .select()
      .from(userCreatedCourseWords)
      .where(eq(userCreatedCourseWords.id, wordId))
      .limit(1);
    if (wordRows.length === 0) throw new NotFoundException('单词不存在');
    const word = wordRows[0];
    if (word.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该单词');
    }

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .delete(userCreatedCourseWords)
        .where(eq(userCreatedCourseWords.id, wordId));

      await tx
        .update(userCreatedCourseUnits)
        .set({
          wordCount: sql`${userCreatedCourseUnits.wordCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourseUnits.id, word.unitId));
    });
  }

  // ===== Sentence Management =====

  async getSentences(userId: string, unitId: string): Promise<SentenceDto[]> {
    const unit = await this.db
      .select()
      .from(userCreatedCourseUnits)
      .where(eq(userCreatedCourseUnits.id, unitId))
      .limit(1);
    if (unit.length === 0) throw new NotFoundException('单元不存在');
    await this.getCourse(userId, unit[0].courseId);

    const sentences = await this.db
      .select()
      .from(userCreatedCourseSentences)
      .where(eq(userCreatedCourseSentences.unitId, unitId))
      .orderBy(asc(userCreatedCourseSentences.sortOrder), asc(userCreatedCourseSentences.createdAt));
    return sentences.map((s) => this.toSentenceDto(s));
  }

  async createSentence(
    userId: string,
    unitId: string,
    dto: CreateSentenceDto,
  ): Promise<SentenceDto> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(userCreatedCourseSentences)
        .values({
          unitId,
          sentence: dto.sentence.trim(),
          translation: dto.translation,
          grammarTag: dto.grammarTag,
          illustrationUrl: dto.illustrationUrl,
          sortOrder: dto.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        })
        .returning();

      await tx
        .update(userCreatedCourseUnits)
        .set({
          sentenceCount: sql`${userCreatedCourseUnits.sentenceCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourseUnits.id, unitId));

      await tx
        .update(userCreatedCourses)
        .set({
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourses.id, unit.courseId));

      return inserted[0];
    });

    return this.toSentenceDto(result);
  }

  async updateSentence(
    userId: string,
    sentenceId: string,
    dto: UpdateSentenceDto,
  ): Promise<SentenceDto> {
    const sentRows = await this.db
      .select()
      .from(userCreatedCourseSentences)
      .where(eq(userCreatedCourseSentences.id, sentenceId))
      .limit(1);
    if (sentRows.length === 0) throw new NotFoundException('句子不存在');
    const sent = sentRows[0];
    if (sent.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该句子');
    }

    const patch: Partial<typeof userCreatedCourseSentences.$inferInsert> = {};
    if (dto.sentence !== undefined) patch.sentence = dto.sentence.trim();
    if (dto.translation !== undefined) patch.translation = dto.translation;
    if (dto.grammarTag !== undefined) patch.grammarTag = dto.grammarTag;
    if (dto.illustrationUrl !== undefined) patch.illustrationUrl = dto.illustrationUrl;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userCreatedCourseSentences)
      .set(patch)
      .where(eq(userCreatedCourseSentences.id, sentenceId))
      .returning();
    if (rows.length === 0) throw new NotFoundException('句子不存在');
    return this.toSentenceDto(rows[0]);
  }

  async deleteSentence(userId: string, sentenceId: string): Promise<void> {
    const sentRows = await this.db
      .select()
      .from(userCreatedCourseSentences)
      .where(eq(userCreatedCourseSentences.id, sentenceId))
      .limit(1);
    if (sentRows.length === 0) throw new NotFoundException('句子不存在');
    const sent = sentRows[0];
    if (sent.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该句子');
    }

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .delete(userCreatedCourseSentences)
        .where(eq(userCreatedCourseSentences.id, sentenceId));

      await tx
        .update(userCreatedCourseUnits)
        .set({
          sentenceCount: sql`${userCreatedCourseUnits.sentenceCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userCreatedCourseUnits.id, sent.unitId));
    });
  }

  // ===== Bulk Import =====

  async importWords(
    userId: string,
    unitId: string,
    items: WordImportItem[],
  ): Promise<BatchImportResult> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const existing = await this.db
      .select({ word: userCreatedCourseWords.word })
      .from(userCreatedCourseWords)
      .where(eq(userCreatedCourseWords.unitId, unitId));
    const existingSet = new Set(existing.map((e) => e.word.toLowerCase()));

    const toInsert: (typeof userCreatedCourseWords.$inferInsert)[] = [];
    const errors: ImportError[] = [];
    const seen = new Set<string>();
    const now = new Date();

    items.forEach((item, index) => {
      const row = index + 1;
      const word = item.word?.trim();
      if (!word) {
        errors.push({ row, word: item.word, reason: '单词不能为空' });
        return;
      }
      if (!item.meaning?.trim()) {
        errors.push({ row, word, reason: '释义不能为空' });
        return;
      }
      const key = word.toLowerCase();
      if (existingSet.has(key) || seen.has(key)) {
        errors.push({ row, word, reason: '单词已存在' });
        return;
      }
      seen.add(key);
      toInsert.push({
        unitId,
        word,
        phonetic: item.phonetic,
        partOfSpeech: item.partOfSpeech,
        meaning: item.meaning.trim(),
        example: item.example,
        illustrationUrl: item.illustrationUrl,
        sortOrder: item.sortOrder ?? row,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      });
    });

    if (toInsert.length > 0) {
      await this.db.transaction(async (tx) => {
        await tx.insert(userCreatedCourseWords).values(toInsert);
        await tx
          .update(userCreatedCourseUnits)
          .set({
            wordCount: sql`${userCreatedCourseUnits.wordCount} + ${toInsert.length}`,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userCreatedCourseUnits.id, unitId));
        await tx
          .update(userCreatedCourses)
          .set({
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userCreatedCourses.id, unit.courseId));
      });
    }

    return {
      success: toInsert.length,
      failed: errors.length,
      errors,
    };
  }

  async importSentences(
    userId: string,
    unitId: string,
    items: SentenceImportItem[],
  ): Promise<BatchImportResult> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const existing = await this.db
      .select({ sentence: userCreatedCourseSentences.sentence })
      .from(userCreatedCourseSentences)
      .where(eq(userCreatedCourseSentences.unitId, unitId));
    const existingSet = new Set(existing.map((e) => e.sentence.toLowerCase()));

    const toInsert: (typeof userCreatedCourseSentences.$inferInsert)[] = [];
    const errors: ImportError[] = [];
    const seen = new Set<string>();
    const now = new Date();

    items.forEach((item, index) => {
      const row = index + 1;
      const sentence = item.sentence?.trim();
      if (!sentence) {
        errors.push({ row, sentence: item.sentence, reason: '句子不能为空' });
        return;
      }
      const key = sentence.toLowerCase();
      if (existingSet.has(key) || seen.has(key)) {
        errors.push({ row, sentence, reason: '句子已存在' });
        return;
      }
      seen.add(key);
      toInsert.push({
        unitId,
        sentence,
        translation: item.translation,
        grammarTag: item.grammarTag,
        illustrationUrl: item.illustrationUrl,
        sortOrder: item.sortOrder ?? row,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      });
    });

    if (toInsert.length > 0) {
      await this.db.transaction(async (tx) => {
        await tx.insert(userCreatedCourseSentences).values(toInsert);
        await tx
          .update(userCreatedCourseUnits)
          .set({
            sentenceCount: sql`${userCreatedCourseUnits.sentenceCount} + ${toInsert.length}`,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userCreatedCourseUnits.id, unitId));
        await tx
          .update(userCreatedCourses)
          .set({
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userCreatedCourses.id, unit.courseId));
      });
    }

    return {
      success: toInsert.length,
      failed: errors.length,
      errors,
    };
  }

  // ===== Share / Audit =====

  async shareCourse(userId: string, id: string): Promise<UserCreatedCourseDto> {
    await this.verifyCourseOwner(userId, id);

    const now = new Date();
    const rows = await this.db
      .update(userCreatedCourses)
      .set({
        visibility: 'public',
        status: 'pending_audit',
        updatedAt: now,
        updatedBy: userId,
      })
      .where(eq(userCreatedCourses.id, id))
      .returning();
    if (rows.length === 0) throw new NotFoundException('课程不存在');
    return this.toCourseDto(rows[0]);
  }

  async unshareCourse(userId: string, id: string): Promise<UserCreatedCourseDto> {
    await this.verifyCourseOwner(userId, id);

    const now = new Date();
    const rows = await this.db
      .update(userCreatedCourses)
      .set({
        visibility: 'private',
        status: 'draft',
        updatedAt: now,
        updatedBy: userId,
      })
      .where(eq(userCreatedCourses.id, id))
      .returning();
    if (rows.length === 0) throw new NotFoundException('课程不存在');
    return this.toCourseDto(rows[0]);
  }

  // ===== AI Word Generation =====

  async generateWord(
    userId: string,
    unitId: string,
    word: string,
  ): Promise<WordDto> {
    const trimmed = word?.trim();
    if (!trimmed) {
      throw new BadRequestException('单词不能为空');
    }

    let aiResult: GenerateEnglishWordStructureInfoOneOutput;
    try {
      const input: GenerateEnglishWordStructureInfoOneInput = {
        english_word: trimmed,
      };
      const raw = await this.getWordCapability().call('textToJson', input) as
        Record<string, unknown>;
      aiResult = {
        word: typeof raw.word === 'string' ? raw.word : '',
        phonetic: (raw.phonetic ?? {}) as Record<string, unknown>,
        meanings: Array.isArray(raw.meanings) ? raw.meanings : [],
        examples: Array.isArray(raw.examples) ? raw.examples : [],
        synonyms: Array.isArray(raw.synonyms) ? raw.synonyms : [],
        antonyms: Array.isArray(raw.antonyms) ? raw.antonyms : [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI生成单词信息失败: ${trimmed} - ${message}`);
      throw new BadRequestException(`AI生成失败: ${message}`);
    }

    if (!aiResult || !aiResult.word) {
      throw new BadRequestException('AI返回结果无效');
    }

    const phoneticObj = (aiResult.phonetic ?? {}) as Record<string, unknown>;
    const phoneticUs = typeof phoneticObj.us === 'string' ? phoneticObj.us : '';
    const phoneticUk = typeof phoneticObj.uk === 'string' ? phoneticObj.uk : '';
    const phonetic = phoneticUs || phoneticUk || '';

    const meanings = Array.isArray(aiResult.meanings) ? aiResult.meanings : [];
    const firstMeaning = (meanings[0] ?? {}) as Record<string, unknown>;
    const partOfSpeech = typeof firstMeaning.partOfSpeech === 'string'
      ? firstMeaning.partOfSpeech : '';
    const definitions = Array.isArray(firstMeaning.definitions)
      ? firstMeaning.definitions : [];
    const meaning = definitions.length > 0
      ? String(definitions[0] ?? '')
      : (definitions.length > 0 ? definitions.join('；') : '');

    const examples = Array.isArray(aiResult.examples) ? aiResult.examples : [];
    const firstExample = (examples[0] ?? {}) as Record<string, unknown>;
    const exampleSentence = typeof firstExample.sentence === 'string'
      ? firstExample.sentence : '';
    const exampleTranslation = typeof firstExample.translation === 'string'
      ? firstExample.translation : '';
    const example = exampleSentence && exampleTranslation
      ? `${exampleSentence}|${exampleTranslation}`
      : (exampleSentence || exampleTranslation || '');

    const createDto: CreateWordDto = {
      word: aiResult.word || trimmed,
      phonetic,
      partOfSpeech,
      meaning: meaning || '',
      example,
      illustrationUrl: '',
    };

    return this.createWord(userId, unitId, createDto);
  }

  async batchGenerateWords(
    userId: string,
    unitId: string,
    words: string[],
  ): Promise<BatchGenerateResult> {
    if (!Array.isArray(words)) {
      throw new BadRequestException('words 必须为数组');
    }

    const validWords = words
      .map((w) => w?.trim() ?? '')
      .filter((w) => w.length > 0);

    if (validWords.length === 0) {
      throw new BadRequestException('没有有效的单词');
    }

    if (validWords.length > BATCH_GENERATE_MAX) {
      throw new BadRequestException(
        `单次最多生成 ${BATCH_GENERATE_MAX} 个单词，请分批生成`,
      );
    }

    const errors: GenerateWordError[] = [];
    let successCount = 0;

    for (const word of validWords) {
      try {
        await this.generateWord(userId, unitId, word);
        successCount += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        errors.push({ word, reason });
      }
    }

    return {
      total: validWords.length,
      success: successCount,
      failed: errors.length,
      errors,
    };
  }
}
