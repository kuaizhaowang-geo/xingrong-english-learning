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
  sentencePuzzles,
  textbooks,
  textbookUnits,
  courseLessons,
} from '@server/database/schema';
import type {
  AdminSentenceItem,
  PagedResponse,
  WordParse,
} from '@shared/api.interface';

interface GetSentencesParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  courseId?: string;
  lessonId?: string;
  keyword?: string;
}

interface CreateSentenceDto {
  sentence: string;
  translation: string;
  wordParses?: WordParse[];
  sentenceAnalysis?: string;
  imageUrl?: string;
  textbookId?: string;
  unitId?: string;
  courseId?: string;
  lessonId?: string;
  puzzleOrder?: number;
  difficulty?: number;
  tags?: string[];
}

interface UpdateSentenceDto extends Partial<CreateSentenceDto> {}

interface BatchSentenceItem {
  sentence: string;
  translation: string;
  grammarComponents?: Array<{ id: string; text: string; type: string }>;
  wordParses?: WordParse[];
  sentenceAnalysis?: string;
  puzzleOrder?: number;
  difficulty?: number;
  tags?: string[];
  sentenceType?: string;
  courseId?: string;
  lessonId?: string;
}

interface BatchCreateParams {
  textbookId?: string;
  unitId?: string;
  courseId?: string;
  lessonId?: string;
  sentences: BatchSentenceItem[];
}

interface BatchResultError {
  index: number;
  sentence?: string;
  error: string;
}

interface BatchCreateResult {
  success: number;
  failed: number;
  errors: BatchResultError[];
}

@Injectable()
export class AdminSentencesService {
  private readonly logger = new Logger(AdminSentencesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getSentences(
    params: GetSentencesParams,
  ): Promise<PagedResponse<AdminSentenceItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildWhereConditions(params);

    const selectFields = {
      id: sentencePuzzles.id,
      sentence: sentencePuzzles.sentence,
      translation: sentencePuzzles.translation,
      wordParses: sentencePuzzles.wordParses,
      sentenceAnalysis: sentencePuzzles.sentenceAnalysis,
      imageUrl: sentencePuzzles.imageUrl,
      textbookId: sentencePuzzles.textbookId,
      unitId: sentencePuzzles.unitId,
      courseId: sentencePuzzles.courseId,
      lessonId: sentencePuzzles.lessonId,
      textbookTitle: textbooks.title,
      unitTitle: textbookUnits.title,
      lessonTitle: courseLessons.title,
      puzzleOrder: sentencePuzzles.puzzleOrder,
    };

    const baseQuery = this.db
      .select(selectFields)
      .from(sentencePuzzles)
      .leftJoin(textbooks, eq(sentencePuzzles.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(sentencePuzzles.unitId, textbookUnits.id))
      .leftJoin(courseLessons, eq(sentencePuzzles.lessonId, courseLessons.id))
      .orderBy(
        asc(sentencePuzzles.puzzleOrder),
        desc(sentencePuzzles.createdAt),
      )
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ count: count() })
      .from(sentencePuzzles);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery,
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const items: AdminSentenceItem[] = itemsResult.map((row) =>
      this.toAdminSentenceItem(row),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async getSentence(id: string): Promise<AdminSentenceItem> {
    const rows = await this.db
      .select({
        id: sentencePuzzles.id,
        sentence: sentencePuzzles.sentence,
        translation: sentencePuzzles.translation,
        wordParses: sentencePuzzles.wordParses,
        sentenceAnalysis: sentencePuzzles.sentenceAnalysis,
        imageUrl: sentencePuzzles.imageUrl,
        textbookId: sentencePuzzles.textbookId,
        unitId: sentencePuzzles.unitId,
        courseId: sentencePuzzles.courseId,
        lessonId: sentencePuzzles.lessonId,
        textbookTitle: textbooks.title,
        unitTitle: textbookUnits.title,
        lessonTitle: courseLessons.title,
        puzzleOrder: sentencePuzzles.puzzleOrder,
      })
      .from(sentencePuzzles)
      .leftJoin(textbooks, eq(sentencePuzzles.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(sentencePuzzles.unitId, textbookUnits.id))
      .leftJoin(courseLessons, eq(sentencePuzzles.lessonId, courseLessons.id))
      .where(eq(sentencePuzzles.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('句子不存在');
    }

    return this.toAdminSentenceItem(rows[0]);
  }

  async createSentence(data: CreateSentenceDto): Promise<AdminSentenceItem> {
    const inserted = await this.db
      .insert(sentencePuzzles)
      .values({
        sentence: data.sentence,
        translation: data.translation,
        grammarComponents: [],
        wordParses: (data.wordParses ?? []) as unknown as Record<string, unknown>[],
        sentenceAnalysis: data.sentenceAnalysis,
        imageUrl: data.imageUrl,
        textbookId: data.textbookId,
        unitId: data.unitId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        puzzleOrder: data.puzzleOrder ?? 0,
        difficulty: data.difficulty ?? 1,
        tags: data.tags ?? [],
      })
      .returning({ id: sentencePuzzles.id });

    return this.getSentence(inserted[0].id);
  }

  async batchCreateSentences(
    params: BatchCreateParams,
  ): Promise<BatchCreateResult> {
    const { textbookId, unitId, courseId, lessonId, sentences } = params;

    if (!sentences || sentences.length === 0) {
      throw new BadRequestException('句子列表不能为空');
    }

    const hasTextbook = !!textbookId || !!unitId;
    const hasCourse = !!courseId || !!lessonId;
    if (!hasTextbook && !hasCourse) {
      throw new BadRequestException(
        '必须指定挂载维度：教材（textbookId/unitId）或课程（courseId/lessonId）',
      );
    }
    if (hasTextbook && hasCourse) {
      throw new BadRequestException(
        '教材维度与课程维度不能同时指定，请选择一种挂载方式',
      );
    }

    const valid: Array<{ sentence: string; translation: string; source?: BatchSentenceItem }> = [];
    const errors: BatchResultError[] = [];

    sentences.forEach((s: BatchSentenceItem, idx: number) => {
      if (!s.sentence || !s.sentence.trim()) {
        errors.push({ index: idx + 1, sentence: s.sentence, error: '英文句子不能为空' });
        return;
      }
      if (!s.translation || !s.translation.trim()) {
        errors.push({ index: idx + 1, sentence: s.sentence, error: '中文翻译不能为空' });
        return;
      }
      valid.push({ sentence: s.sentence.trim(), translation: s.translation.trim(), source: s });
    });

    if (valid.length === 0) {
      return { success: 0, failed: errors.length, errors };
    }

    const values = valid.map((item: { sentence: string; translation: string; source?: BatchSentenceItem }) => {
      const s = item.source as BatchSentenceItem;
      return {
        sentence: item.sentence,
        translation: item.translation,
        grammarComponents: (s.grammarComponents ?? []) as unknown as Record<string, unknown>[],
        wordParses: (s.wordParses ?? []) as unknown as Record<string, unknown>[],
        sentenceAnalysis: s.sentenceAnalysis,
        textbookId: s.courseId ? undefined : textbookId,
        unitId: s.courseId ? undefined : unitId,
        courseId: s.courseId ?? courseId,
        lessonId: s.lessonId ?? lessonId,
        puzzleOrder: s.puzzleOrder ?? 0,
        difficulty: s.difficulty ?? 1,
        tags: s.tags ?? [],
        sentenceType: s.sentenceType ?? 'simple',
      };
    });

    const inserted = await this.db
      .insert(sentencePuzzles)
      .values(values)
      .returning({ id: sentencePuzzles.id });

    this.logger.log(`批量创建句子 成功${inserted.length}条 失败${errors.length}条`);

    return {
      success: inserted.length,
      failed: errors.length,
      errors,
    };
  }

  async updateSentence(
    id: string,
    data: UpdateSentenceDto,
  ): Promise<AdminSentenceItem> {
    const patch: Partial<typeof sentencePuzzles.$inferInsert> = {};

    if (data.sentence !== undefined) patch.sentence = data.sentence;
    if (data.translation !== undefined) patch.translation = data.translation;
    if (data.wordParses !== undefined) {
      patch.wordParses = data.wordParses as unknown as Record<string, unknown>[];
    }
    if (data.sentenceAnalysis !== undefined)
      patch.sentenceAnalysis = data.sentenceAnalysis;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.textbookId !== undefined) patch.textbookId = data.textbookId;
    if (data.unitId !== undefined) patch.unitId = data.unitId;
    if (data.courseId !== undefined) patch.courseId = data.courseId;
    if (data.lessonId !== undefined) patch.lessonId = data.lessonId;
    if (data.puzzleOrder !== undefined) patch.puzzleOrder = data.puzzleOrder;
    if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
    if (data.tags !== undefined) patch.tags = data.tags;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(sentencePuzzles)
      .set(patch)
      .where(eq(sentencePuzzles.id, id))
      .returning({ id: sentencePuzzles.id });

    if (updated.length === 0) {
      throw new NotFoundException('句子不存在');
    }

    return this.getSentence(updated[0].id);
  }

  async deleteSentence(id: string): Promise<void> {
    const deleted = await this.db
      .delete(sentencePuzzles)
      .where(eq(sentencePuzzles.id, id))
      .returning({ id: sentencePuzzles.id });

    if (deleted.length === 0) {
      throw new NotFoundException('句子不存在');
    }
  }

  // ===== 内部方法 =====

  private buildWhereConditions(params: GetSentencesParams) {
    const conditions = [];

    if (params.textbookId) {
      conditions.push(eq(sentencePuzzles.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(sentencePuzzles.unitId, params.unitId));
    }
    if (params.courseId) {
      conditions.push(eq(sentencePuzzles.courseId, params.courseId));
    }
    if (params.lessonId) {
      conditions.push(eq(sentencePuzzles.lessonId, params.lessonId));
    }
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(sentencePuzzles.sentence, keyword),
          ilike(sentencePuzzles.translation, keyword),
        ),
      );
    }

    return conditions;
  }

  private toAdminSentenceItem(row: {
    id: string;
    sentence: string;
    translation: string;
    wordParses: unknown;
    sentenceAnalysis: string | null;
    imageUrl: string | null;
    textbookId: string | null;
    unitId: string | null;
    courseId: string | null;
    lessonId: string | null;
    textbookTitle: string | null;
    unitTitle: string | null;
    lessonTitle: string | null;
    puzzleOrder: number | null;
  }): AdminSentenceItem {
    return {
      id: row.id,
      sentence: row.sentence,
      translation: row.translation,
      wordParses: (row.wordParses as WordParse[]) ?? [],
      sentenceAnalysis: row.sentenceAnalysis ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      courseId: row.courseId ?? undefined,
      lessonId: row.lessonId ?? undefined,
      textbookTitle: row.textbookTitle ?? undefined,
      unitTitle: row.unitTitle ?? undefined,
      lessonTitle: row.lessonTitle ?? undefined,
      puzzleOrder: row.puzzleOrder ?? undefined,
    };
  }
}
