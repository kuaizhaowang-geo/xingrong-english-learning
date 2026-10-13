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
  or,
} from 'drizzle-orm';

import {
  chineseCharacters,
  textbooks,
  textbookUnits,
} from '@server/database/schema';
import type {
  AdminChineseCharItem,
  PagedResponse,
} from '@shared/api.interface';

interface GetChineseCharsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
}

interface CreateChineseCharDto {
  character: string;
  pinyin?: string;
  radical?: string;
  strokes?: number;
  meaning?: string;
  examples?: string;
  charOrder?: number;
  structure?: string;
  words?: string[];
  difficulty?: string;
  grade?: string;
  semester?: string;
  textbookId: string;
  unitId: string;
}

interface UpdateChineseCharDto extends Partial<CreateChineseCharDto> {}

interface BatchChineseCharItem {
  character: string;
  pinyin?: string;
  radical?: string;
  strokes?: number;
  meaning?: string;
  examples?: string;
  charOrder?: number;
  structure?: string;
  words?: string[];
  difficulty?: string;
  grade?: string;
  semester?: string;
}

@Injectable()
export class AdminChineseCharsService {
  private readonly logger = new Logger(AdminChineseCharsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getChineseChars(
    params: GetChineseCharsParams,
  ): Promise<PagedResponse<AdminChineseCharItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildWhereConditions(params);

    const selectFields = {
      id: chineseCharacters.id,
      character: chineseCharacters.character,
      pinyin: chineseCharacters.pinyin,
      radical: chineseCharacters.radical,
      strokes: chineseCharacters.strokes,
      meaning: chineseCharacters.meaning,
      examples: chineseCharacters.examples,
      charOrder: chineseCharacters.charOrder,
      structure: chineseCharacters.structure,
      words: chineseCharacters.words,
      difficulty: chineseCharacters.difficulty,
      textbookId: chineseCharacters.textbookId,
      unitId: chineseCharacters.unitId,
      textbookTitle: textbooks.title,
      unitTitle: textbookUnits.title,
    };

    const baseQuery = this.db
      .select(selectFields)
      .from(chineseCharacters)
      .leftJoin(textbooks, eq(chineseCharacters.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(chineseCharacters.unitId, textbookUnits.id))
      .orderBy(asc(chineseCharacters.charOrder), desc(chineseCharacters.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ count: count() })
      .from(chineseCharacters);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery,
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const items: AdminChineseCharItem[] = itemsResult.map(
      (row) => this.toAdminChineseCharItem(row),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async getChineseChar(id: string): Promise<AdminChineseCharItem> {
    const rows = await this.db
      .select({
        id: chineseCharacters.id,
        character: chineseCharacters.character,
        pinyin: chineseCharacters.pinyin,
        radical: chineseCharacters.radical,
        strokes: chineseCharacters.strokes,
        meaning: chineseCharacters.meaning,
        examples: chineseCharacters.examples,
        charOrder: chineseCharacters.charOrder,
        structure: chineseCharacters.structure,
        words: chineseCharacters.words,
        difficulty: chineseCharacters.difficulty,
        textbookId: chineseCharacters.textbookId,
        unitId: chineseCharacters.unitId,
        textbookTitle: textbooks.title,
        unitTitle: textbookUnits.title,
      })
      .from(chineseCharacters)
      .leftJoin(textbooks, eq(chineseCharacters.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(chineseCharacters.unitId, textbookUnits.id))
      .where(eq(chineseCharacters.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('汉字不存在');
    }

    return this.toAdminChineseCharItem(rows[0]);
  }

  async createChineseChar(
    data: CreateChineseCharDto,
  ): Promise<AdminChineseCharItem> {
    const inserted = await this.db
      .insert(chineseCharacters)
      .values({
        character: data.character,
        pinyin: data.pinyin,
        radical: data.radical,
        strokes: data.strokes,
        meaning: data.meaning,
        examples: data.examples,
        charOrder: data.charOrder ?? 0,
        structure: data.structure,
        words: data.words ?? [],
        difficulty: data.difficulty ?? 'easy',
        grade: data.grade,
        semester: data.semester,
        textbookId: data.textbookId,
        unitId: data.unitId,
      })
      .returning({ id: chineseCharacters.id });

    return this.getChineseChar(inserted[0].id);
  }

  async updateChineseChar(
    id: string,
    data: UpdateChineseCharDto,
  ): Promise<AdminChineseCharItem> {
    const patch: Partial<typeof chineseCharacters.$inferInsert> = {};

    if (data.character !== undefined) patch.character = data.character;
    if (data.pinyin !== undefined) patch.pinyin = data.pinyin;
    if (data.radical !== undefined) patch.radical = data.radical;
    if (data.strokes !== undefined) patch.strokes = data.strokes;
    if (data.meaning !== undefined) patch.meaning = data.meaning;
    if (data.examples !== undefined) patch.examples = data.examples;
    if (data.charOrder !== undefined) patch.charOrder = data.charOrder;
    if (data.structure !== undefined) patch.structure = data.structure;
    if (data.words !== undefined) patch.words = data.words;
    if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
    if (data.grade !== undefined) patch.grade = data.grade;
    if (data.semester !== undefined) patch.semester = data.semester;
    if (data.textbookId !== undefined) patch.textbookId = data.textbookId;
    if (data.unitId !== undefined) patch.unitId = data.unitId;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(chineseCharacters)
      .set(patch)
      .where(eq(chineseCharacters.id, id))
      .returning({ id: chineseCharacters.id });

    if (updated.length === 0) {
      throw new NotFoundException('汉字不存在');
    }

    return this.getChineseChar(updated[0].id);
  }

  async deleteChineseChar(id: string): Promise<void> {
    const deleted = await this.db
      .delete(chineseCharacters)
      .where(eq(chineseCharacters.id, id))
      .returning({ id: chineseCharacters.id });

    if (deleted.length === 0) {
      throw new NotFoundException('汉字不存在');
    }
  }

  async batchCreateChineseChars(
    textbookId: string | undefined,
    unitId: string | undefined,
    chars: BatchChineseCharItem[],
  ): Promise<{ count: number }> {
    if (!chars || chars.length === 0) {
      throw new BadRequestException('汉字列表不能为空');
    }

    const values = chars.map((c: BatchChineseCharItem) => ({
      character: c.character,
      pinyin: c.pinyin,
      radical: c.radical,
      strokes: c.strokes,
      meaning: c.meaning,
      examples: c.examples,
      charOrder: c.charOrder ?? 0,
      structure: c.structure,
      words: c.words ?? [],
      difficulty: c.difficulty ?? 'easy',
      grade: c.grade,
      semester: c.semester,
      textbookId,
      unitId,
    }));

    const inserted = await this.db
      .insert(chineseCharacters)
      .values(values)
      .onConflictDoNothing({ target: chineseCharacters.character })
      .returning({ id: chineseCharacters.id });

    this.logger.log(`批量创建汉字 ${inserted.length} 条`);

    return { count: inserted.length };
  }

  // ===== 内部方法 =====

  private buildWhereConditions(params: GetChineseCharsParams) {
    const conditions = [];

    if (params.textbookId) {
      conditions.push(eq(chineseCharacters.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(chineseCharacters.unitId, params.unitId));
    }
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(chineseCharacters.character, keyword),
          ilike(chineseCharacters.pinyin, keyword),
          ilike(chineseCharacters.meaning, keyword),
        ),
      );
    }

    return conditions;
  }

  private toAdminChineseCharItem(row: {
    id: string;
    character: string;
    pinyin: string | null;
    radical: string | null;
    strokes: number | null;
    meaning: string | null;
    examples: string | null;
    charOrder: number | null;
    structure: string | null;
    words: string[] | null;
    difficulty: string | null;
    textbookId: string | null;
    unitId: string | null;
    textbookTitle: string | null;
    unitTitle: string | null;
  }): AdminChineseCharItem {
    return {
      id: row.id,
      character: row.character,
      pinyin: row.pinyin ?? undefined,
      radical: row.radical ?? undefined,
      strokes: row.strokes ?? undefined,
      meaning: row.meaning ?? undefined,
      examples: row.examples ?? undefined,
      charOrder: row.charOrder ?? undefined,
      structure: row.structure ?? undefined,
      words: row.words ?? undefined,
      difficulty: row.difficulty ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      textbookTitle: row.textbookTitle ?? undefined,
      unitTitle: row.unitTitle ?? undefined,
    };
  }
}
