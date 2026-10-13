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
} from '@lark-apaas/fullstack-nestjs-core';
import {
  eq, and, ilike, or, asc, desc, count, sql,
} from 'drizzle-orm';
import {
  userTextbooks,
  userTextbookUnits,
  userTextbookWords,
  userTextbookSentences,
} from '@server/database/schema';

// ===== DTO Types =====

export interface CreateTextbookDto {
  name: string;
  subject?: string;
  grade?: string;
  version?: string;
  description?: string;
  coverImage?: string;
}

export interface UpdateTextbookDto {
  name?: string;
  subject?: string;
  grade?: string;
  version?: string;
  description?: string;
  coverImage?: string;
}

export interface CreateUnitDto {
  title: string;
  unitOrder?: number;
  description?: string;
  coverImage?: string;
}

export interface UpdateUnitDto {
  title?: string;
  unitOrder?: number;
  description?: string;
  coverImage?: string;
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

export interface TextbookListResponse {
  items: UserTextbookDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserTextbookDto {
  id: string;
  name: string;
  coverImage?: string;
  subject: string;
  grade?: string;
  version?: string;
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

export interface TextbookDetailDto extends UserTextbookDto {
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
  textbookId: string;
  title: string;
  unitOrder: number;
  description?: string;
  coverImage?: string;
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

@Injectable()
export class UserTextbooksService {
  private readonly logger = new Logger(UserTextbooksService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ===== Helper: user_profile column comparison =====

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByTextbook(userId: string): any {
    return sql`(${userTextbooks.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByUnit(userId: string): any {
    return sql`(${userTextbookUnits.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByWord(userId: string): any {
    return sql`(${userTextbookWords.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdBySentence(userId: string): any {
    return sql`(${userTextbookSentences.createdBy}).user_id = ${userId}`;
  }

  // ===== Row → DTO mappers =====

  private toTextbookDto(row: typeof userTextbooks.$inferSelect): UserTextbookDto {
    return {
      id: row.id,
      name: row.name,
      coverImage: row.coverImage ?? undefined,
      subject: row.subject,
      grade: row.grade ?? undefined,
      version: row.version ?? undefined,
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

  private toUnitDto(row: typeof userTextbookUnits.$inferSelect): UnitDto {
    return {
      id: row.id,
      textbookId: row.textbookId,
      title: row.title,
      unitOrder: row.unitOrder,
      description: row.description ?? undefined,
      coverImage: row.coverImage ?? undefined,
      wordCount: row.wordCount,
      sentenceCount: row.sentenceCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toUnitSummary(row: typeof userTextbookUnits.$inferSelect): UnitSummaryDto {
    return {
      id: row.id,
      title: row.title,
      unitOrder: row.unitOrder,
      wordCount: row.wordCount,
      sentenceCount: row.sentenceCount,
    };
  }

  private toWordDto(row: typeof userTextbookWords.$inferSelect): WordDto {
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

  private toSentenceDto(row: typeof userTextbookSentences.$inferSelect): SentenceDto {
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
   * Verify textbook belongs to user.
   * Throws NotFound if not found, Forbidden if not owner.
   */
  private async verifyTextbookOwner(userId: string, textbookId: string): Promise<typeof userTextbooks.$inferSelect> {
    const rows = await this.db
      .select()
      .from(userTextbooks)
      .where(eq(userTextbooks.id, textbookId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('教材不存在');
    const row = rows[0];
    // createdBy is a custom type that resolves to userId string
    if (row.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该教材');
    }
    return row;
  }

  private async verifyUnitOwner(userId: string, unitId: string): Promise<typeof userTextbookUnits.$inferSelect> {
    const rows = await this.db
      .select()
      .from(userTextbookUnits)
      .where(eq(userTextbookUnits.id, unitId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('单元不存在');
    const row = rows[0];
    if (row.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该单元');
    }
    return row;
  }

  // ===== Textbook CRUD =====

  async getTextbooks(
    userId: string,
    subject?: string,
    grade?: string,
    keyword?: string,
    page = 1,
    pageSize = 20,
  ): Promise<TextbookListResponse> {
    // 读取范围：自己创建的 + 公开且已审核通过的
    const visibilityConditions = or(
      this.createdByTextbook(userId),
      and(
        eq(userTextbooks.visibility, 'public'),
        eq(userTextbooks.status, 'approved'),
      ),
    );

    const conditions = [visibilityConditions];
    if (subject) conditions.push(eq(userTextbooks.subject, subject));
    if (grade) conditions.push(eq(userTextbooks.grade, grade));
    if (keyword) {
      conditions.push(sql`(
        ${userTextbooks.name} ILIKE ${`%${keyword}%`} OR
        ${userTextbooks.description} ILIKE ${`%${keyword}%`}
      )`);
    }

    const offset = (page - 1) * pageSize;
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(userTextbooks)
      .where(where);

    const rows = await this.db
      .select()
      .from(userTextbooks)
      .where(where)
      .orderBy(desc(userTextbooks.updatedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: rows.map((r) => this.toTextbookDto(r)),
      total: Number(total),
      page,
      pageSize,
    };
  }

  async getTextbook(userId: string, id: string): Promise<TextbookDetailDto> {
    const rows = await this.db
      .select()
      .from(userTextbooks)
      .where(and(
        eq(userTextbooks.id, id),
        or(
          this.createdByTextbook(userId),
          and(
            eq(userTextbooks.visibility, 'public'),
            eq(userTextbooks.status, 'approved'),
          ),
        ),
      ))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('教材不存在');

    const textbook = rows[0];
    const units = await this.db
      .select()
      .from(userTextbookUnits)
      .where(eq(userTextbookUnits.textbookId, id))
      .orderBy(asc(userTextbookUnits.unitOrder), asc(userTextbookUnits.createdAt));

    return {
      ...this.toTextbookDto(textbook),
      units: units.map((u) => this.toUnitSummary(u)),
    };
  }

  async createTextbook(
    userId: string,
    dto: CreateTextbookDto,
  ): Promise<UserTextbookDto> {
    const now = new Date();
    const rows = await this.db
      .insert(userTextbooks)
      .values({
        name: dto.name.trim(),
        subject: dto.subject ?? 'english',
        grade: dto.grade,
        version: dto.version,
        description: dto.description,
        coverImage: dto.coverImage,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      })
      .returning();
    return this.toTextbookDto(rows[0]);
  }

  async updateTextbook(
    userId: string,
    id: string,
    dto: UpdateTextbookDto,
  ): Promise<UserTextbookDto> {
    await this.verifyTextbookOwner(userId, id);

    const patch: Partial<typeof userTextbooks.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.subject !== undefined) patch.subject = dto.subject;
    if (dto.grade !== undefined) patch.grade = dto.grade;
    if (dto.version !== undefined) patch.version = dto.version;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.coverImage !== undefined) patch.coverImage = dto.coverImage;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userTextbooks)
      .set(patch)
      .where(eq(userTextbooks.id, id))
      .returning();
    if (rows.length === 0) throw new NotFoundException('教材不存在');
    return this.toTextbookDto(rows[0]);
  }

  async deleteTextbook(userId: string, id: string): Promise<void> {
    await this.verifyTextbookOwner(userId, id);

    const rows = await this.db
      .delete(userTextbooks)
      .where(eq(userTextbooks.id, id))
      .returning({ id: userTextbooks.id });
    if (rows.length === 0) throw new NotFoundException('教材不存在');
  }

  // ===== Unit Management =====

  async getUnits(userId: string, textbookId: string): Promise<UnitDto[]> {
    // Verify textbook access
    await this.getTextbook(userId, textbookId);

    const units = await this.db
      .select()
      .from(userTextbookUnits)
      .where(eq(userTextbookUnits.textbookId, textbookId))
      .orderBy(asc(userTextbookUnits.unitOrder), asc(userTextbookUnits.createdAt));
    return units.map((u) => this.toUnitDto(u));
  }

  async createUnit(
    userId: string,
    textbookId: string,
    dto: CreateUnitDto,
  ): Promise<UnitDto> {
    await this.verifyTextbookOwner(userId, textbookId);

    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      // Get current max unit_order
      const existing = await tx
        .select({ unitOrder: userTextbookUnits.unitOrder })
        .from(userTextbookUnits)
        .where(eq(userTextbookUnits.textbookId, textbookId))
        .orderBy(desc(userTextbookUnits.unitOrder))
        .limit(1);

      const nextOrder = dto.unitOrder ?? (existing.length > 0 ? existing[0].unitOrder + 1 : 1);

      const inserted = await tx
        .insert(userTextbookUnits)
        .values({
          textbookId,
          title: dto.title.trim(),
          unitOrder: nextOrder,
          description: dto.description,
          coverImage: dto.coverImage,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        })
        .returning();

      await tx
        .update(userTextbooks)
        .set({
          unitCount: sql`${userTextbooks.unitCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbooks.id, textbookId));

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

    const patch: Partial<typeof userTextbookUnits.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.unitOrder !== undefined) patch.unitOrder = dto.unitOrder;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.coverImage !== undefined) patch.coverImage = dto.coverImage;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userTextbookUnits)
      .set(patch)
      .where(eq(userTextbookUnits.id, unitId))
      .returning();
    if (rows.length === 0) throw new NotFoundException('单元不存在');

    // Update parent textbook's updatedAt
    await this.db
      .update(userTextbooks)
      .set({
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(userTextbooks.id, unit.textbookId));

    return this.toUnitDto(rows[0]);
  }

  async deleteUnit(userId: string, unitId: string): Promise<void> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .delete(userTextbookUnits)
        .where(eq(userTextbookUnits.id, unitId));

      await tx
        .update(userTextbooks)
        .set({
          unitCount: sql`${userTextbooks.unitCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbooks.id, unit.textbookId));
    });
  }

  // ===== Word Management =====

  async getWords(userId: string, unitId: string): Promise<WordDto[]> {
    // Verify unit access via textbook
    const unit = await this.db
      .select()
      .from(userTextbookUnits)
      .where(eq(userTextbookUnits.id, unitId))
      .limit(1);
    if (unit.length === 0) throw new NotFoundException('单元不存在');
    await this.getTextbook(userId, unit[0].textbookId);

    const words = await this.db
      .select()
      .from(userTextbookWords)
      .where(eq(userTextbookWords.unitId, unitId))
      .orderBy(asc(userTextbookWords.sortOrder), asc(userTextbookWords.createdAt));
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
        .insert(userTextbookWords)
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
        .update(userTextbookUnits)
        .set({
          wordCount: sql`${userTextbookUnits.wordCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbookUnits.id, unitId));

      // Touch textbook
      await tx
        .update(userTextbooks)
        .set({
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbooks.id, unit.textbookId));

      return inserted[0];
    });

    return this.toWordDto(result);
  }

  async updateWord(
    userId: string,
    wordId: string,
    dto: UpdateWordDto,
  ): Promise<WordDto> {
    // Check ownership via unit
    const wordRows = await this.db
      .select()
      .from(userTextbookWords)
      .where(eq(userTextbookWords.id, wordId))
      .limit(1);
    if (wordRows.length === 0) throw new NotFoundException('单词不存在');
    const word = wordRows[0];
    if (word.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该单词');
    }

    const patch: Partial<typeof userTextbookWords.$inferInsert> = {};
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
      .update(userTextbookWords)
      .set(patch)
      .where(eq(userTextbookWords.id, wordId))
      .returning();
    if (rows.length === 0) throw new NotFoundException('单词不存在');
    return this.toWordDto(rows[0]);
  }

  async deleteWord(userId: string, wordId: string): Promise<void> {
    const wordRows = await this.db
      .select()
      .from(userTextbookWords)
      .where(eq(userTextbookWords.id, wordId))
      .limit(1);
    if (wordRows.length === 0) throw new NotFoundException('单词不存在');
    const word = wordRows[0];
    if (word.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该单词');
    }

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .delete(userTextbookWords)
        .where(eq(userTextbookWords.id, wordId));

      await tx
        .update(userTextbookUnits)
        .set({
          wordCount: sql`${userTextbookUnits.wordCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbookUnits.id, word.unitId));
    });
  }

  // ===== Sentence Management =====

  async getSentences(userId: string, unitId: string): Promise<SentenceDto[]> {
    const unit = await this.db
      .select()
      .from(userTextbookUnits)
      .where(eq(userTextbookUnits.id, unitId))
      .limit(1);
    if (unit.length === 0) throw new NotFoundException('单元不存在');
    await this.getTextbook(userId, unit[0].textbookId);

    const sentences = await this.db
      .select()
      .from(userTextbookSentences)
      .where(eq(userTextbookSentences.unitId, unitId))
      .orderBy(asc(userTextbookSentences.sortOrder), asc(userTextbookSentences.createdAt));
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
        .insert(userTextbookSentences)
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
        .update(userTextbookUnits)
        .set({
          sentenceCount: sql`${userTextbookUnits.sentenceCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbookUnits.id, unitId));

      await tx
        .update(userTextbooks)
        .set({
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbooks.id, unit.textbookId));

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
      .from(userTextbookSentences)
      .where(eq(userTextbookSentences.id, sentenceId))
      .limit(1);
    if (sentRows.length === 0) throw new NotFoundException('句子不存在');
    const sent = sentRows[0];
    if (sent.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该句子');
    }

    const patch: Partial<typeof userTextbookSentences.$inferInsert> = {};
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
      .update(userTextbookSentences)
      .set(patch)
      .where(eq(userTextbookSentences.id, sentenceId))
      .returning();
    if (rows.length === 0) throw new NotFoundException('句子不存在');
    return this.toSentenceDto(rows[0]);
  }

  async deleteSentence(userId: string, sentenceId: string): Promise<void> {
    const sentRows = await this.db
      .select()
      .from(userTextbookSentences)
      .where(eq(userTextbookSentences.id, sentenceId))
      .limit(1);
    if (sentRows.length === 0) throw new NotFoundException('句子不存在');
    const sent = sentRows[0];
    if (sent.createdBy !== userId) {
      throw new ForbiddenException('无权限操作该句子');
    }

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .delete(userTextbookSentences)
        .where(eq(userTextbookSentences.id, sentenceId));

      await tx
        .update(userTextbookUnits)
        .set({
          sentenceCount: sql`${userTextbookUnits.sentenceCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userTextbookUnits.id, sent.unitId));
    });
  }

  // ===== Bulk Import =====

  async importWords(
    userId: string,
    unitId: string,
    items: WordImportItem[],
  ): Promise<BatchImportResult> {
    const unit = await this.verifyUnitOwner(userId, unitId);

    // Get existing words for dedupe
    const existing = await this.db
      .select({ word: userTextbookWords.word })
      .from(userTextbookWords)
      .where(eq(userTextbookWords.unitId, unitId));
    const existingSet = new Set(existing.map((e) => e.word.toLowerCase()));

    const toInsert: (typeof userTextbookWords.$inferInsert)[] = [];
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
        await tx.insert(userTextbookWords).values(toInsert);
        await tx
          .update(userTextbookUnits)
          .set({
            wordCount: sql`${userTextbookUnits.wordCount} + ${toInsert.length}`,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userTextbookUnits.id, unitId));
        await tx
          .update(userTextbooks)
          .set({
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userTextbooks.id, unit.textbookId));
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
      .select({ sentence: userTextbookSentences.sentence })
      .from(userTextbookSentences)
      .where(eq(userTextbookSentences.unitId, unitId));
    const existingSet = new Set(existing.map((e) => e.sentence.toLowerCase()));

    const toInsert: (typeof userTextbookSentences.$inferInsert)[] = [];
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
        await tx.insert(userTextbookSentences).values(toInsert);
        await tx
          .update(userTextbookUnits)
          .set({
            sentenceCount: sql`${userTextbookUnits.sentenceCount} + ${toInsert.length}`,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userTextbookUnits.id, unitId));
        await tx
          .update(userTextbooks)
          .set({
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userTextbooks.id, unit.textbookId));
      });
    }

    return {
      success: toInsert.length,
      failed: errors.length,
      errors,
    };
  }

  // ===== Share / Audit =====

  async shareTextbook(userId: string, id: string): Promise<UserTextbookDto> {
    await this.verifyTextbookOwner(userId, id);

    const now = new Date();
    const rows = await this.db
      .update(userTextbooks)
      .set({
        visibility: 'public',
        status: 'pending_audit',
        updatedAt: now,
        updatedBy: userId,
      })
      .where(eq(userTextbooks.id, id))
      .returning();
    if (rows.length === 0) throw new NotFoundException('教材不存在');
    return this.toTextbookDto(rows[0]);
  }

  async unshareTextbook(userId: string, id: string): Promise<UserTextbookDto> {
    await this.verifyTextbookOwner(userId, id);

    const now = new Date();
    const rows = await this.db
      .update(userTextbooks)
      .set({
        visibility: 'private',
        status: 'draft',
        updatedAt: now,
        updatedBy: userId,
      })
      .where(eq(userTextbooks.id, id))
      .returning();
    if (rows.length === 0) throw new NotFoundException('教材不存在');
    return this.toTextbookDto(rows[0]);
  }
}
