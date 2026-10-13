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
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';

import {
  dictationItems,
  textbooks,
  textbookUnits,
} from '@server/database/schema';
import type {
  AdminDictationItem,
  PagedResponse,
} from '@shared/api.interface';

interface GetDictationsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
}

interface CreateDictationDto {
  sentence: string;
  translation: string;
  hint?: string;
  difficulty?: number;
  itemOrder?: number;
  textbookId?: string;
  unitId?: string;
  tags?: string[];
}

interface BatchDictationItem {
  sentence: string;
  translation: string;
  hint?: string;
  difficulty?: number;
  itemOrder?: number;
  tags?: string[];
}

@Injectable()
export class AdminDictationsService {
  private readonly logger = new Logger(AdminDictationsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getDictations(
    params: GetDictationsParams,
  ): Promise<PagedResponse<AdminDictationItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildWhereConditions(params);

    const selectFields = {
      id: dictationItems.id,
      sentence: dictationItems.sentence,
      translation: dictationItems.translation,
      hint: dictationItems.hint,
      difficulty: dictationItems.difficulty,
      itemOrder: dictationItems.itemOrder,
      textbookId: dictationItems.textbookId,
      unitId: dictationItems.unitId,
      textbookTitle: textbooks.title,
      unitTitle: textbookUnits.title,
    };

    const baseQuery = this.db
      .select(selectFields)
      .from(dictationItems)
      .leftJoin(textbooks, eq(dictationItems.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(dictationItems.unitId, textbookUnits.id))
      .orderBy(
        asc(dictationItems.itemOrder),
        desc(dictationItems.createdAt),
      )
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ count: count() })
      .from(dictationItems);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery,
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const items: AdminDictationItem[] = itemsResult.map((row) =>
      this.toAdminDictationItem(row),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async getDictation(id: string): Promise<AdminDictationItem> {
    const rows = await this.db
      .select({
        id: dictationItems.id,
        sentence: dictationItems.sentence,
        translation: dictationItems.translation,
        hint: dictationItems.hint,
        difficulty: dictationItems.difficulty,
        itemOrder: dictationItems.itemOrder,
        textbookId: dictationItems.textbookId,
        unitId: dictationItems.unitId,
        textbookTitle: textbooks.title,
        unitTitle: textbookUnits.title,
      })
      .from(dictationItems)
      .leftJoin(textbooks, eq(dictationItems.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(dictationItems.unitId, textbookUnits.id))
      .where(eq(dictationItems.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('听写不存在');
    }

    return this.toAdminDictationItem(rows[0]);
  }

  async createDictation(data: CreateDictationDto): Promise<AdminDictationItem> {
    const inserted = await this.db
      .insert(dictationItems)
      .values({
        sentence: data.sentence,
        translation: data.translation,
        hint: data.hint,
        difficulty: data.difficulty ?? 1,
        itemOrder: data.itemOrder ?? 0,
        textbookId: data.textbookId,
        unitId: data.unitId,
        tags: data.tags ?? [],
      })
      .returning({ id: dictationItems.id });

    return this.getDictation(inserted[0].id);
  }

  async batchCreateDictations(
    textbookId: string | undefined,
    unitId: string | undefined,
    items: BatchDictationItem[],
  ): Promise<{ count: number }> {
    if (!items || items.length === 0) {
      throw new BadRequestException('听写列表不能为空');
    }

    const values = items.map((item: BatchDictationItem) => ({
      sentence: item.sentence,
      translation: item.translation,
      hint: item.hint,
      difficulty: item.difficulty ?? 1,
      itemOrder: item.itemOrder ?? 0,
      textbookId,
      unitId,
      tags: item.tags ?? [],
    }));

    const inserted = await this.db
      .insert(dictationItems)
      .values(values)
      .returning({ id: dictationItems.id });

    this.logger.log(`批量创建听写 ${inserted.length} 条`);

    return { count: inserted.length };
  }

  async updateDictation(
    id: string,
    data: Partial<CreateDictationDto>,
  ): Promise<AdminDictationItem> {
    const patch: Partial<typeof dictationItems.$inferInsert> = {};

    if (data.sentence !== undefined) patch.sentence = data.sentence;
    if (data.translation !== undefined) patch.translation = data.translation;
    if (data.hint !== undefined) patch.hint = data.hint;
    if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
    if (data.itemOrder !== undefined) patch.itemOrder = data.itemOrder;
    if (data.textbookId !== undefined) patch.textbookId = data.textbookId;
    if (data.unitId !== undefined) patch.unitId = data.unitId;
    if (data.tags !== undefined) patch.tags = data.tags;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(dictationItems)
      .set(patch)
      .where(eq(dictationItems.id, id))
      .returning({ id: dictationItems.id });

    if (updated.length === 0) {
      throw new NotFoundException('听写不存在');
    }

    return this.getDictation(updated[0].id);
  }

  async deleteDictation(id: string): Promise<void> {
    const deleted = await this.db
      .delete(dictationItems)
      .where(eq(dictationItems.id, id))
      .returning({ id: dictationItems.id });

    if (deleted.length === 0) {
      throw new NotFoundException('听写不存在');
    }
  }

  private buildWhereConditions(params: GetDictationsParams) {
    const conditions = [];

    if (params.textbookId) {
      conditions.push(eq(dictationItems.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(dictationItems.unitId, params.unitId));
    }
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(dictationItems.sentence, keyword),
          ilike(dictationItems.translation, keyword),
        ),
      );
    }

    return conditions;
  }

  private toAdminDictationItem(row: {
    id: string;
    sentence: string;
    translation: string;
    hint: string | null;
    difficulty: number | null;
    itemOrder: number | null;
    textbookId: string | null;
    unitId: string | null;
    textbookTitle: string | null;
    unitTitle: string | null;
  }): AdminDictationItem {
    return {
      id: row.id,
      sentence: row.sentence,
      translation: row.translation,
      hint: row.hint ?? undefined,
      difficulty: row.difficulty ?? 1,
      itemOrder: row.itemOrder ?? 0,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      textbookTitle: row.textbookTitle ?? undefined,
      unitTitle: row.unitTitle ?? undefined,
    };
  }
}
