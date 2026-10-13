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
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
} from 'drizzle-orm';

import {
  wordItems,
  textbooks,
  textbookUnits,
} from '@server/database/schema';
import type {
  AdminWordItem,
  PagedResponse,
} from '@shared/api.interface';

interface GetWordsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
  level?: string;
}

interface CreateWordDto {
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  level?: string;
  tags?: string[];
  textbookId?: string;
  unitId?: string;
  wordOrder?: number;
  imageUrl?: string;
}

interface UpdateWordDto extends Partial<CreateWordDto> {}

interface BatchWordItem {
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  level?: string;
  tags?: string[];
  wordOrder?: number;
  imageUrl?: string;
}

@Injectable()
export class AdminWordsService {
  private readonly logger = new Logger(AdminWordsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getWords(params: GetWordsParams): Promise<PagedResponse<AdminWordItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildWhereConditions(params);

    const selectFields = {
      id: wordItems.id,
      word: wordItems.word,
      phonetic: wordItems.phonetic,
      meaning: wordItems.meaning,
      partOfSpeech: wordItems.partOfSpeech,
      exampleSentence: wordItems.exampleSentence,
      exampleTranslation: wordItems.exampleTranslation,
      textbookId: wordItems.textbookId,
      unitId: wordItems.unitId,
      textbookTitle: textbooks.title,
      unitTitle: textbookUnits.title,
      wordOrder: wordItems.wordOrder,
      imageUrl: wordItems.imageUrl,
    };

    const baseQuery = this.db
      .select(selectFields)
      .from(wordItems)
      .leftJoin(textbooks, eq(wordItems.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(wordItems.unitId, textbookUnits.id))
      .orderBy(asc(wordItems.wordOrder), desc(wordItems.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ count: count() })
      .from(wordItems);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery,
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const items: AdminWordItem[] = itemsResult.map((row) =>
      this.toAdminWordItem(row),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async getWord(id: string): Promise<AdminWordItem> {
    const rows = await this.db
      .select({
        id: wordItems.id,
        word: wordItems.word,
        phonetic: wordItems.phonetic,
        meaning: wordItems.meaning,
        partOfSpeech: wordItems.partOfSpeech,
        exampleSentence: wordItems.exampleSentence,
        exampleTranslation: wordItems.exampleTranslation,
        textbookId: wordItems.textbookId,
        unitId: wordItems.unitId,
        textbookTitle: textbooks.title,
        unitTitle: textbookUnits.title,
        wordOrder: wordItems.wordOrder,
        imageUrl: wordItems.imageUrl,
      })
      .from(wordItems)
      .leftJoin(textbooks, eq(wordItems.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(wordItems.unitId, textbookUnits.id))
      .where(eq(wordItems.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    return this.toAdminWordItem(rows[0]);
  }

  async createWord(data: CreateWordDto): Promise<AdminWordItem> {
    const inserted = await this.db
      .insert(wordItems)
      .values({
        word: data.word,
        phonetic: data.phonetic,
        meaning: data.meaning,
        partOfSpeech: data.partOfSpeech,
        exampleSentence: data.exampleSentence,
        exampleTranslation: data.exampleTranslation,
        level: data.level ?? 'intermediate',
        tags: data.tags ?? [],
        textbookId: data.textbookId,
        unitId: data.unitId,
        wordOrder: data.wordOrder ?? 0,
        imageUrl: data.imageUrl,
      })
      .returning({ id: wordItems.id });

    return this.getWord(inserted[0].id);
  }

  async updateWord(id: string, data: UpdateWordDto): Promise<AdminWordItem> {
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
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.textbookId !== undefined) patch.textbookId = data.textbookId;
    if (data.unitId !== undefined) patch.unitId = data.unitId;
    if (data.wordOrder !== undefined) patch.wordOrder = data.wordOrder;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(wordItems)
      .set(patch)
      .where(eq(wordItems.id, id))
      .returning({ id: wordItems.id });

    if (updated.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    return this.getWord(updated[0].id);
  }

  async deleteWord(id: string): Promise<void> {
    const deleted = await this.db
      .delete(wordItems)
      .where(eq(wordItems.id, id))
      .returning({ id: wordItems.id });

    if (deleted.length === 0) {
      throw new NotFoundException('单词不存在');
    }
  }

  async batchCreateWords(
    textbookId: string | undefined,
    unitId: string | undefined,
    words: BatchWordItem[],
  ): Promise<{ count: number }> {
    if (!words || words.length === 0) {
      throw new BadRequestException('单词列表不能为空');
    }

    const values = words.map((w: BatchWordItem) => ({
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      partOfSpeech: w.partOfSpeech,
      exampleSentence: w.exampleSentence,
      exampleTranslation: w.exampleTranslation,
      level: w.level ?? 'intermediate',
      tags: w.tags ?? [],
      textbookId,
      unitId,
      wordOrder: w.wordOrder ?? 0,
      imageUrl: w.imageUrl,
    }));

    const inserted = await this.db
      .insert(wordItems)
      .values(values)
      .onConflictDoNothing({ target: wordItems.word })
      .returning({ id: wordItems.id });

    this.logger.log(`批量创建单词 ${inserted.length} 条`);

    return { count: inserted.length };
  }

  // ===== 内部方法 =====

  private buildWhereConditions(params: GetWordsParams) {
    const conditions = [];

    if (params.textbookId) {
      conditions.push(eq(wordItems.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(wordItems.unitId, params.unitId));
    }
    if (params.level) {
      conditions.push(eq(wordItems.level, params.level));
    }
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(ilike(wordItems.word, keyword), ilike(wordItems.meaning, keyword)),
      );
    }

    return conditions;
  }

  private toAdminWordItem(row: {
    id: string;
    word: string;
    phonetic: string | null;
    meaning: string;
    partOfSpeech: string | null;
    exampleSentence: string | null;
    exampleTranslation: string | null;
    textbookId: string | null;
    unitId: string | null;
    textbookTitle: string | null;
    unitTitle: string | null;
    wordOrder: number | null;
    imageUrl: string | null;
  }): AdminWordItem {
    return {
      id: row.id,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      meaning: row.meaning,
      partOfSpeech: row.partOfSpeech ?? undefined,
      exampleSentence: row.exampleSentence ?? undefined,
      exampleTranslation: row.exampleTranslation ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      textbookTitle: row.textbookTitle ?? undefined,
      unitTitle: row.unitTitle ?? undefined,
      wordOrder: row.wordOrder ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
    };
  }
}
