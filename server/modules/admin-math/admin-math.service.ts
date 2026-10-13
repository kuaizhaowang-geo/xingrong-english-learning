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
  mathTopics,
  mathPracticeItems,
  textbooks,
  textbookUnits,
} from '@server/database/schema';
import type {
  AdminMathTopicItem,
  AdminMathPracticeItem,
  PagedResponse,
} from '@shared/api.interface';

// ===== 知识点 =====

interface GetMathTopicsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
  domain?: string;
}

interface CreateMathTopicDto {
  title: string;
  textbookId: string;
  unitId: string;
  topicOrder?: number;
  domain?: string;
  description: string;
  keyPoints: string;
  examples?: Array<{ question: string; solution: string; answer: string }>;
}

interface UpdateMathTopicDto extends Partial<CreateMathTopicDto> {}

interface BatchMathTopicItem {
  title: string;
  topicOrder?: number;
  domain?: string;
  description: string;
  keyPoints: string;
  examples?: Array<{ question: string; solution: string; answer: string }>;
}

// ===== 习题 =====

interface GetMathPracticeItemsParams {
  page?: number;
  pageSize?: number;
  topicId?: string;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
  difficulty?: string;
  itemType?: string;
}

interface CreateMathPracticeItemDto {
  question: string;
  options?: Array<{ label: string; text: string }>;
  correctAnswer: string;
  solution?: string;
  difficulty?: number;
  itemOrder?: number;
  itemType?: string;
  grade?: string;
  semester?: string;
  knowledgePoint?: string;
  topicId: string;
  textbookId: string;
  unitId: string;
}

interface UpdateMathPracticeItemDto extends Partial<CreateMathPracticeItemDto> {}

interface BatchMathPracticeItem {
  question: string;
  options?: Array<{ label: string; text: string }>;
  correctAnswer: string;
  solution?: string;
  difficulty?: number;
  itemOrder?: number;
  itemType?: string;
  grade?: string;
  semester?: string;
  knowledgePoint?: string;
}

@Injectable()
export class AdminMathService {
  private readonly logger = new Logger(AdminMathService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ==================== 知识点 ====================

  async getMathTopics(
    params: GetMathTopicsParams,
  ): Promise<PagedResponse<AdminMathTopicItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildTopicWhereConditions(params);

    const selectFields = {
      id: mathTopics.id,
      title: mathTopics.title,
      textbookId: mathTopics.textbookId,
      unitId: mathTopics.unitId,
      topicOrder: mathTopics.topicOrder,
      domain: mathTopics.domain,
      description: mathTopics.description,
      keyPoints: mathTopics.keyPoints,
      examples: mathTopics.examples,
      practiceCount: mathTopics.practiceCount,
      textbookTitle: textbooks.title,
      unitTitle: textbookUnits.title,
    };

    const baseQuery = this.db
      .select(selectFields)
      .from(mathTopics)
      .leftJoin(textbooks, eq(mathTopics.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(mathTopics.unitId, textbookUnits.id))
      .orderBy(asc(mathTopics.topicOrder), desc(mathTopics.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ count: count() })
      .from(mathTopics);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery,
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const items: AdminMathTopicItem[] = itemsResult.map(
      (row) => this.toAdminMathTopicItem(row),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async getMathTopic(id: string): Promise<AdminMathTopicItem> {
    const rows = await this.db
      .select({
        id: mathTopics.id,
        title: mathTopics.title,
        textbookId: mathTopics.textbookId,
        unitId: mathTopics.unitId,
        topicOrder: mathTopics.topicOrder,
        domain: mathTopics.domain,
        description: mathTopics.description,
        keyPoints: mathTopics.keyPoints,
        examples: mathTopics.examples,
        practiceCount: mathTopics.practiceCount,
        textbookTitle: textbooks.title,
        unitTitle: textbookUnits.title,
      })
      .from(mathTopics)
      .leftJoin(textbooks, eq(mathTopics.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(mathTopics.unitId, textbookUnits.id))
      .where(eq(mathTopics.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('知识点不存在');
    }

    return this.toAdminMathTopicItem(rows[0]);
  }

  async createMathTopic(
    data: CreateMathTopicDto,
  ): Promise<AdminMathTopicItem> {
    const inserted = await this.db
      .insert(mathTopics)
      .values({
        title: data.title,
        textbookId: data.textbookId,
        unitId: data.unitId,
        topicOrder: data.topicOrder ?? 0,
        domain: data.domain ?? 'numbers',
        description: data.description,
        keyPoints: data.keyPoints,
        examples: data.examples ?? [],
      })
      .returning({ id: mathTopics.id });

    return this.getMathTopic(inserted[0].id);
  }

  async updateMathTopic(
    id: string,
    data: UpdateMathTopicDto,
  ): Promise<AdminMathTopicItem> {
    const patch: Partial<typeof mathTopics.$inferInsert> = {};

    if (data.title !== undefined) patch.title = data.title;
    if (data.textbookId !== undefined) patch.textbookId = data.textbookId;
    if (data.unitId !== undefined) patch.unitId = data.unitId;
    if (data.topicOrder !== undefined) patch.topicOrder = data.topicOrder;
    if (data.domain !== undefined) patch.domain = data.domain;
    if (data.description !== undefined) patch.description = data.description;
    if (data.keyPoints !== undefined) patch.keyPoints = data.keyPoints;
    if (data.examples !== undefined) patch.examples = data.examples;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(mathTopics)
      .set(patch)
      .where(eq(mathTopics.id, id))
      .returning({ id: mathTopics.id });

    if (updated.length === 0) {
      throw new NotFoundException('知识点不存在');
    }

    return this.getMathTopic(updated[0].id);
  }

  async deleteMathTopic(id: string): Promise<void> {
    const deleted = await this.db
      .delete(mathTopics)
      .where(eq(mathTopics.id, id))
      .returning({ id: mathTopics.id });

    if (deleted.length === 0) {
      throw new NotFoundException('知识点不存在');
    }
  }

  async batchCreateMathTopics(
    textbookId: string | undefined,
    unitId: string | undefined,
    topics: BatchMathTopicItem[],
  ): Promise<{ count: number }> {
    if (!topics || topics.length === 0) {
      throw new BadRequestException('知识点列表不能为空');
    }

    const values = topics.map((t: BatchMathTopicItem) => ({
      title: t.title,
      textbookId,
      unitId,
      topicOrder: t.topicOrder ?? 0,
      domain: t.domain ?? 'numbers',
      description: t.description,
      keyPoints: t.keyPoints,
      examples: t.examples ?? [],
    }));

    const inserted = await this.db
      .insert(mathTopics)
      .values(values)
      .onConflictDoNothing({
        target: [mathTopics.title, mathTopics.textbookId, mathTopics.unitId],
      })
      .returning({ id: mathTopics.id });

    this.logger.log(`批量创建数学知识点 ${inserted.length} 条`);

    return { count: inserted.length };
  }

  // ==================== 习题 ====================

  async getMathPracticeItems(
    params: GetMathPracticeItemsParams,
  ): Promise<PagedResponse<AdminMathPracticeItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildPracticeItemWhereConditions(params);

    const selectFields = {
      id: mathPracticeItems.id,
      topicId: mathPracticeItems.topicId,
      textbookId: mathPracticeItems.textbookId,
      unitId: mathPracticeItems.unitId,
      question: mathPracticeItems.question,
      options: mathPracticeItems.options,
      correctAnswer: mathPracticeItems.correctAnswer,
      solution: mathPracticeItems.solution,
      difficulty: mathPracticeItems.difficulty,
      itemOrder: mathPracticeItems.itemOrder,
      itemType: mathPracticeItems.itemType,
      grade: mathPracticeItems.grade,
      semester: mathPracticeItems.semester,
      knowledgePoint: mathPracticeItems.knowledgePoint,
      topicTitle: mathTopics.title,
      textbookTitle: textbooks.title,
      unitTitle: textbookUnits.title,
    };

    const baseQuery = this.db
      .select(selectFields)
      .from(mathPracticeItems)
      .leftJoin(mathTopics, eq(mathPracticeItems.topicId, mathTopics.id))
      .leftJoin(textbooks, eq(mathPracticeItems.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(mathPracticeItems.unitId, textbookUnits.id))
      .orderBy(asc(mathPracticeItems.itemOrder), desc(mathPracticeItems.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ count: count() })
      .from(mathPracticeItems);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery,
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const items: AdminMathPracticeItem[] = itemsResult.map(
      (row) => this.toAdminMathPracticeItem(row),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async getMathPracticeItem(id: string): Promise<AdminMathPracticeItem> {
    const rows = await this.db
      .select({
        id: mathPracticeItems.id,
        topicId: mathPracticeItems.topicId,
        textbookId: mathPracticeItems.textbookId,
        unitId: mathPracticeItems.unitId,
        question: mathPracticeItems.question,
        options: mathPracticeItems.options,
        correctAnswer: mathPracticeItems.correctAnswer,
        solution: mathPracticeItems.solution,
        difficulty: mathPracticeItems.difficulty,
        itemOrder: mathPracticeItems.itemOrder,
        itemType: mathPracticeItems.itemType,
        grade: mathPracticeItems.grade,
        semester: mathPracticeItems.semester,
        knowledgePoint: mathPracticeItems.knowledgePoint,
        topicTitle: mathTopics.title,
        textbookTitle: textbooks.title,
        unitTitle: textbookUnits.title,
      })
      .from(mathPracticeItems)
      .leftJoin(mathTopics, eq(mathPracticeItems.topicId, mathTopics.id))
      .leftJoin(textbooks, eq(mathPracticeItems.textbookId, textbooks.id))
      .leftJoin(textbookUnits, eq(mathPracticeItems.unitId, textbookUnits.id))
      .where(eq(mathPracticeItems.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('数学习题不存在');
    }

    return this.toAdminMathPracticeItem(rows[0]);
  }

  async createMathPracticeItem(
    data: CreateMathPracticeItemDto,
  ): Promise<AdminMathPracticeItem> {
    const inserted = await this.db
      .insert(mathPracticeItems)
      .values({
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        solution: data.solution,
        difficulty: data.difficulty ?? 1,
        itemOrder: data.itemOrder ?? 0,
        itemType: data.itemType ?? 'choice',
        grade: data.grade,
        semester: data.semester,
        knowledgePoint: data.knowledgePoint,
        topicId: data.topicId,
        textbookId: data.textbookId,
        unitId: data.unitId,
      })
      .returning({ id: mathPracticeItems.id });

    return this.getMathPracticeItem(inserted[0].id);
  }

  async updateMathPracticeItem(
    id: string,
    data: UpdateMathPracticeItemDto,
  ): Promise<AdminMathPracticeItem> {
    const patch: Partial<typeof mathPracticeItems.$inferInsert> = {};

    if (data.question !== undefined) patch.question = data.question;
    if (data.options !== undefined) patch.options = data.options;
    if (data.correctAnswer !== undefined) patch.correctAnswer = data.correctAnswer;
    if (data.solution !== undefined) patch.solution = data.solution;
    if (data.difficulty !== undefined) patch.difficulty = data.difficulty;
    if (data.itemOrder !== undefined) patch.itemOrder = data.itemOrder;
    if (data.itemType !== undefined) patch.itemType = data.itemType;
    if (data.grade !== undefined) patch.grade = data.grade;
    if (data.semester !== undefined) patch.semester = data.semester;
    if (data.knowledgePoint !== undefined) patch.knowledgePoint = data.knowledgePoint;
    if (data.topicId !== undefined) patch.topicId = data.topicId;
    if (data.textbookId !== undefined) patch.textbookId = data.textbookId;
    if (data.unitId !== undefined) patch.unitId = data.unitId;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(mathPracticeItems)
      .set(patch)
      .where(eq(mathPracticeItems.id, id))
      .returning({ id: mathPracticeItems.id });

    if (updated.length === 0) {
      throw new NotFoundException('数学习题不存在');
    }

    return this.getMathPracticeItem(updated[0].id);
  }

  async deleteMathPracticeItem(id: string): Promise<void> {
    const deleted = await this.db
      .delete(mathPracticeItems)
      .where(eq(mathPracticeItems.id, id))
      .returning({ id: mathPracticeItems.id });

    if (deleted.length === 0) {
      throw new NotFoundException('数学习题不存在');
    }
  }

  async batchCreateMathPracticeItems(
    textbookId: string | undefined,
    unitId: string | undefined,
    topicId: string | undefined,
    items: BatchMathPracticeItem[],
  ): Promise<{ count: number }> {
    if (!items || items.length === 0) {
      throw new BadRequestException('习题列表不能为空');
    }

    const values = items.map((item: BatchMathPracticeItem) => ({
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
      solution: item.solution,
      difficulty: item.difficulty ?? 1,
      itemOrder: item.itemOrder ?? 0,
      itemType: item.itemType ?? 'choice',
      grade: item.grade,
      semester: item.semester,
      knowledgePoint: item.knowledgePoint,
      topicId,
      textbookId,
      unitId,
    }));

    const inserted = await this.db
      .insert(mathPracticeItems)
      .values(values)
      .onConflictDoNothing()
      .returning({ id: mathPracticeItems.id });

    this.logger.log(`批量创建数学习题 ${inserted.length} 条`);

    return { count: inserted.length };
  }

  // ===== 内部方法 =====

  private buildTopicWhereConditions(params: GetMathTopicsParams) {
    const conditions = [];

    if (params.textbookId) {
      conditions.push(eq(mathTopics.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(mathTopics.unitId, params.unitId));
    }
    if (params.domain) {
      conditions.push(eq(mathTopics.domain, params.domain));
    }
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(mathTopics.title, keyword),
          ilike(mathTopics.description, keyword),
          ilike(mathTopics.keyPoints, keyword),
        ),
      );
    }

    return conditions;
  }

  private buildPracticeItemWhereConditions(params: GetMathPracticeItemsParams) {
    const conditions = [];

    if (params.topicId) {
      conditions.push(eq(mathPracticeItems.topicId, params.topicId));
    }
    if (params.textbookId) {
      conditions.push(eq(mathPracticeItems.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(mathPracticeItems.unitId, params.unitId));
    }
    if (params.difficulty) {
      conditions.push(eq(mathPracticeItems.difficulty, Number(params.difficulty)));
    }
    if (params.itemType) {
      conditions.push(eq(mathPracticeItems.itemType, params.itemType));
    }
    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(mathPracticeItems.question, keyword),
          ilike(mathPracticeItems.correctAnswer, keyword),
          ilike(mathPracticeItems.solution, keyword),
        ),
      );
    }

    return conditions;
  }

  private toAdminMathTopicItem(row: {
    id: string;
    title: string;
    textbookId: string;
    unitId: string;
    topicOrder: number | null;
    domain: string | null;
    description: string;
    keyPoints: string;
    examples: unknown;
    practiceCount: number | null;
    textbookTitle: string | null;
    unitTitle: string | null;
  }): AdminMathTopicItem {
    return {
      id: row.id,
      title: row.title,
      textbookId: row.textbookId,
      unitId: row.unitId,
      topicOrder: row.topicOrder ?? 0,
      domain: row.domain ?? 'numbers',
      description: row.description,
      keyPoints: row.keyPoints,
      examples: (row.examples as Array<{ question: string; solution: string; answer: string }> | null) ?? [],
      practiceCount: row.practiceCount ?? 0,
      textbookTitle: row.textbookTitle ?? undefined,
      unitTitle: row.unitTitle ?? undefined,
    };
  }

  private toAdminMathPracticeItem(row: {
    id: string;
    topicId: string;
    textbookId: string;
    unitId: string;
    question: string;
    options: unknown;
    correctAnswer: string;
    solution: string | null;
    difficulty: number | null;
    itemOrder: number | null;
    itemType: string | null;
    grade: string | null;
    semester: string | null;
    knowledgePoint: string | null;
    topicTitle: string | null;
    textbookTitle: string | null;
    unitTitle: string | null;
  }): AdminMathPracticeItem {
    return {
      id: row.id,
      topicId: row.topicId,
      textbookId: row.textbookId,
      unitId: row.unitId,
      question: row.question,
      options: (row.options as Array<{ label: string; text: string }> | null) ?? [],
      correctAnswer: row.correctAnswer,
      solution: row.solution ?? undefined,
      difficulty: row.difficulty ?? 1,
      itemOrder: row.itemOrder ?? 0,
      itemType: row.itemType ?? 'choice',
      grade: row.grade ?? undefined,
      semester: row.semester ?? undefined,
      knowledgePoint: row.knowledgePoint ?? undefined,
      topicTitle: row.topicTitle ?? undefined,
      textbookTitle: row.textbookTitle ?? undefined,
      unitTitle: row.unitTitle ?? undefined,
    };
  }
}
