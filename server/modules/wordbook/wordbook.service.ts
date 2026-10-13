import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  eq, and, ilike, inArray, asc, desc, count, sql,
} from 'drizzle-orm';
import type {
  UserWordbook,
  UserWordbookItem,
  CreateWordbookDto,
  UpdateWordbookDto,
  AddWordbookItemDto,
  AddItemsFromTextbookDto,
  BatchImportResult,
  WordbookListResponse,
  WordbookItemListResponse,
  TextExtractResult,
  StudyRecordDto,
  StudySessionResult,
  WordbookSubject,
  WordbookContentType,
  WordbookSource,
  WordbookItemExtra,
} from '@shared/api.interface';
import {
  userWordbooks,
  userWordbookItems,
  wordItems,
  sentencePuzzles,
  dictationItems,
} from '@server/database/schema';

export interface ImportWordItem {
  word: string;
  phonetic?: string;
  meaning?: string;
  example?: string;
  partOfSpeech?: string;
}

export interface FileImportError {
  row: number;
  word: string;
  reason: string;
}

export interface FileImportResult {
  success: number;
  failed: number;
  errors: FileImportError[];
}

@Injectable()
export class WordbookService {
  private readonly logger = new Logger(WordbookService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdBy(userId: string): any {
    return sql`(${userWordbooks.createdBy}).user_id = ${userId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdByItem(userId: string): any {
    return sql`(${userWordbookItems.createdBy}).user_id = ${userId}`;
  }

  private toWordbook(row: typeof userWordbooks.$inferSelect): UserWordbook {
    return {
      id: row.id,
      name: row.name,
      subject: row.subject as WordbookSubject,
      contentType: row.contentType as WordbookContentType,
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      studiedCount: row.studiedCount,
      correctRate: Number(row.correctRate),
      lastStudyTime: row.lastStudyTime ? row.lastStudyTime.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toItem(row: typeof userWordbookItems.$inferSelect): UserWordbookItem {
    return {
      id: row.id,
      wordbookId: row.wordbookId,
      subject: row.subject as WordbookSubject,
      contentType: row.contentType as WordbookContentType,
      source: row.source as WordbookSource,
      sourceId: row.sourceId ?? undefined,
      sourceInfo: row.sourceInfo as { textbookName?: string; grade?: string; unit?: string; lesson?: string } | undefined,
      title: row.title ?? undefined,
      subtitle: row.subtitle ?? undefined,
      content: row.content,
      example: row.example ?? undefined,
      answer: row.answer ?? undefined,
      extra: row.extra as WordbookItemExtra | undefined,
      studyCount: row.studyCount,
      correctCount: row.correctCount,
      correctRate: Number(row.correctRate),
      lastStudyTime: row.lastStudyTime ? row.lastStudyTime.toISOString() : undefined,
      isStarred: row.isStarred,
      createdAt: row.createdAt.toISOString(),
    };
  }

  // ===== 词库管理 =====

  async getWordbooks(
    userId: string,
    subject?: WordbookSubject,
    contentType?: WordbookContentType,
    search?: string,
    page = 1,
    pageSize = 20,
  ): Promise<WordbookListResponse> {
    const conditions = [this.createdBy(userId)];
    if (subject) conditions.push(eq(userWordbooks.subject, subject));
    if (contentType) conditions.push(eq(userWordbooks.contentType, contentType));
    if (search) conditions.push(ilike(userWordbooks.name, `%${search}%`));

    const offset = (page - 1) * pageSize;
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(userWordbooks)
      .where(where);

    const rows = await this.db
      .select()
      .from(userWordbooks)
      .where(where)
      .orderBy(desc(userWordbooks.updatedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: rows.map((r) => this.toWordbook(r)),
      total: Number(total),
    };
  }

  async getWordbook(userId: string, id: string): Promise<UserWordbook> {
    const rows = await this.db
      .select()
      .from(userWordbooks)
      .where(and(this.createdBy(userId), eq(userWordbooks.id, id)))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('词库不存在');
    return this.toWordbook(rows[0]);
  }

  async createWordbook(
    userId: string,
    dto: CreateWordbookDto,
  ): Promise<UserWordbook> {
    const now = new Date();
    const rows = await this.db
      .insert(userWordbooks)
      .values({
        name: dto.name.trim(),
        subject: dto.subject,
        contentType: dto.contentType,
        description: dto.description,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    return this.toWordbook(rows[0]);
  }

  async updateWordbook(
    userId: string,
    id: string,
    dto: UpdateWordbookDto,
  ): Promise<UserWordbook> {
    const patch: Partial<typeof userWordbooks.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userWordbooks)
      .set(patch)
      .where(and(this.createdBy(userId), eq(userWordbooks.id, id)))
      .returning();
    if (rows.length === 0) throw new NotFoundException('词库不存在');
    return this.toWordbook(rows[0]);
  }

  async deleteWordbook(userId: string, id: string): Promise<void> {
    const rows = await this.db
      .delete(userWordbooks)
      .where(and(this.createdBy(userId), eq(userWordbooks.id, id)))
      .returning({ id: userWordbooks.id });
    if (rows.length === 0) throw new NotFoundException('词库不存在');
  }

  // ===== 内容管理 =====

  async getItems(
    userId: string,
    wordbookId: string,
    search?: string,
    isStarred?: boolean,
    source?: WordbookSource,
    page = 1,
    pageSize = 20,
  ): Promise<WordbookItemListResponse> {
    const conditions = [
      this.createdByItem(userId),
      eq(userWordbookItems.wordbookId, wordbookId),
    ];
    if (search) {
      conditions.push(sql`(
        ${userWordbookItems.content} ILIKE ${`%${search}%`} OR
        ${userWordbookItems.title} ILIKE ${`%${search}%`}
      )`);
    }
    if (isStarred !== undefined) {
      conditions.push(eq(userWordbookItems.isStarred, isStarred));
    }
    if (source) conditions.push(eq(userWordbookItems.source, source));

    const offset = (page - 1) * pageSize;
    const where = and(...conditions);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(userWordbookItems)
      .where(where);

    const rows = await this.db
      .select()
      .from(userWordbookItems)
      .where(where)
      .orderBy(desc(userWordbookItems.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: rows.map((r) => this.toItem(r)),
      total: Number(total),
    };
  }

  async addItem(
    userId: string,
    wordbookId: string,
    dto: AddWordbookItemDto,
  ): Promise<UserWordbookItem> {
    // 验证词库归属
    await this.getWordbook(userId, wordbookId);

    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(userWordbookItems)
        .values({
          wordbookId,
          subject: dto.subject,
          contentType: dto.contentType,
          source: dto.source ?? 'custom',
          sourceId: dto.sourceId,
          sourceInfo: dto.sourceInfo as Record<string, unknown> | undefined,
          title: dto.title,
          subtitle: dto.subtitle,
          content: dto.content.trim(),
          example: dto.example,
          answer: dto.answer,
          extra: dto.extra as Record<string, unknown> | undefined,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      await tx
        .update(userWordbooks)
        .set({
          itemCount: sql`${userWordbooks.itemCount} + 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userWordbooks.id, wordbookId));

      return inserted[0];
    });

    return this.toItem(result);
  }

  async addItemsBatch(
    userId: string,
    wordbookId: string,
    items: AddWordbookItemDto[],
  ): Promise<BatchImportResult> {
    await this.getWordbook(userId, wordbookId);

    // 已有内容去重
    const existing = await this.db
      .select({ content: userWordbookItems.content })
      .from(userWordbookItems)
      .where(eq(userWordbookItems.wordbookId, wordbookId));
    const existingSet = new Set(existing.map((e) => e.content));

    const toInsert: AddWordbookItemDto[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const content = item.content?.trim();
      if (!content) {
        errors.push('内容为空的条目已跳过');
        continue;
      }
      if (existingSet.has(content) || seen.has(content)) {
        errors.push(`重复内容已跳过: ${content.slice(0, 30)}`);
        continue;
      }
      seen.add(content);
      toInsert.push(item);
    }

    if (toInsert.length > 0) {
      const now = new Date();
      await this.db.transaction(async (tx) => {
        await tx.insert(userWordbookItems).values(
          toInsert.map((item) => ({
            wordbookId,
            subject: item.subject,
            contentType: item.contentType,
            source: item.source ?? 'custom',
            sourceId: item.sourceId,
            sourceInfo: item.sourceInfo as Record<string, unknown> | undefined,
            title: item.title,
            subtitle: item.subtitle,
            content: item.content.trim(),
            example: item.example,
            answer: item.answer,
            extra: item.extra as Record<string, unknown> | undefined,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
          })),
        );
        await tx
          .update(userWordbooks)
          .set({
            itemCount: sql`${userWordbooks.itemCount} + ${toInsert.length}`,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userWordbooks.id, wordbookId));
      });
    }

    return {
      success: toInsert.length,
      failed: items.length - toInsert.length,
      errors,
    };
  }

  // ===== 文件导入 =====

  async importFromFile(
    userId: string,
    wordbookId: string,
    items: ImportWordItem[],
  ): Promise<FileImportResult> {
    // 验证词库存在且属于该用户
    const wordbook = await this.getWordbook(userId, wordbookId);

    const errors: FileImportError[] = [];
    const validItems: { word: string; item: ImportWordItem }[] = [];
    const seenWords = new Set<string>();

    // 逐条校验
    for (let i = 0; i < items.length; i += 1) {
      const row = i + 1;
      const item = items[i];
      const word = item.word?.trim() ?? '';

      if (!word) {
        errors.push({ row, word, reason: '单词不能为空' });
        continue;
      }
      if (word.length > 200) {
        errors.push({ row, word, reason: `单词长度超过 200 字符（当前 ${word.length}）` });
        continue;
      }
      if (seenWords.has(word.toLowerCase())) {
        errors.push({ row, word, reason: '文件内重复单词' });
        continue;
      }
      seenWords.add(word.toLowerCase());
      validItems.push({ word, item });
    }

    if (validItems.length === 0) {
      return { success: 0, failed: errors.length, errors };
    }

    // 查询词库内已有单词去重（仅查 content 字段，contentType='word'）
    const existingRows = await this.db
      .select({ content: userWordbookItems.content })
      .from(userWordbookItems)
      .where(and(
        eq(userWordbookItems.wordbookId, wordbookId),
        eq(userWordbookItems.contentType, 'word'),
      ));
    const existingSet = new Set(
      existingRows.map((e: { content: string }) => e.content.toLowerCase()),
    );

    const toInsert: typeof userWordbookItems.$inferInsert[] = [];
    const now = new Date();

    for (const { word, item } of validItems) {
      if (existingSet.has(word.toLowerCase())) {
        errors.push({ row: 0, word, reason: '词库内已存在该单词' });
        continue;
      }
      const extra: Record<string, unknown> = {};
      if (item.phonetic) extra.phonetic = item.phonetic.trim();
      if (item.partOfSpeech) extra.partOfSpeech = item.partOfSpeech.trim();

      toInsert.push({
        wordbookId,
        subject: wordbook.subject,
        contentType: 'word',
        source: 'custom',
        title: word,
        subtitle: item.meaning?.trim() ?? undefined,
        content: word,
        example: item.example?.trim() ?? undefined,
        answer: item.meaning?.trim() ?? undefined,
        extra: Object.keys(extra).length > 0 ? extra : undefined,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    if (toInsert.length > 0) {
      await this.db.transaction(async (tx) => {
        await tx.insert(userWordbookItems).values(toInsert);
        await tx
          .update(userWordbooks)
          .set({
            itemCount: sql`${userWordbooks.itemCount} + ${toInsert.length}`,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userWordbooks.id, wordbookId));
      });
    }

    const failedCount = items.length - toInsert.length;
    return {
      success: toInsert.length,
      failed: failedCount,
      errors,
    };
  }

  async updateItem(
    userId: string,
    wordbookId: string,
    itemId: string,
    dto: Partial<AddWordbookItemDto> & { isStarred?: boolean },
  ): Promise<UserWordbookItem> {
    await this.getWordbook(userId, wordbookId);

    const patch: Partial<typeof userWordbookItems.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.subtitle !== undefined) patch.subtitle = dto.subtitle;
    if (dto.content !== undefined) patch.content = dto.content.trim();
    if (dto.example !== undefined) patch.example = dto.example;
    if (dto.answer !== undefined) patch.answer = dto.answer;
    if (dto.extra !== undefined) patch.extra = dto.extra as Record<string, unknown>;
    if (dto.isStarred !== undefined) patch.isStarred = dto.isStarred;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows = await this.db
      .update(userWordbookItems)
      .set(patch)
      .where(and(
        eq(userWordbookItems.id, itemId),
        eq(userWordbookItems.wordbookId, wordbookId),
      ))
      .returning();
    if (rows.length === 0) throw new NotFoundException('内容不存在');
    return this.toItem(rows[0]);
  }

  async deleteItem(
    userId: string,
    wordbookId: string,
    itemId: string,
  ): Promise<void> {
    await this.getWordbook(userId, wordbookId);

    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      const deleted = await tx
        .delete(userWordbookItems)
        .where(and(
          eq(userWordbookItems.id, itemId),
          eq(userWordbookItems.wordbookId, wordbookId),
        ))
        .returning({ id: userWordbookItems.id });
      if (deleted.length === 0) return null;

      await tx
        .update(userWordbooks)
        .set({
          itemCount: sql`${userWordbooks.itemCount} - 1`,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(eq(userWordbooks.id, wordbookId));
      return deleted[0];
    });

    if (!result) throw new NotFoundException('内容不存在');
  }

  async toggleStar(
    userId: string,
    wordbookId: string,
    itemId: string,
  ): Promise<{ isStarred: boolean }> {
    await this.getWordbook(userId, wordbookId);

    const rows = await this.db
      .update(userWordbookItems)
      .set({
        isStarred: sql`NOT ${userWordbookItems.isStarred}`,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(and(
        eq(userWordbookItems.id, itemId),
        eq(userWordbookItems.wordbookId, wordbookId),
      ))
      .returning({ isStarred: userWordbookItems.isStarred });
    if (rows.length === 0) throw new NotFoundException('内容不存在');
    return { isStarred: rows[0].isStarred };
  }

  // ===== 从教材加入词库 =====

  async addFromSource(
    userId: string,
    wordbookId: string,
    dto: AddItemsFromTextbookDto,
  ): Promise<BatchImportResult> {
    const wb = await this.getWordbook(userId, wordbookId);

    let sourceItems: AddWordbookItemDto[] = [];

    if (dto.sourceType === 'word') {
      const rows = await this.db
        .select()
        .from(wordItems)
        .where(inArray(wordItems.id, dto.sourceIds));
      sourceItems = rows.map((row) => ({
        subject: 'english',
        contentType: 'word',
        source: 'textbook',
        sourceId: row.id,
        sourceInfo: dto.sourceInfo,
        content: row.word,
        title: row.word,
        subtitle: row.meaning,
        example: row.exampleSentence,
        answer: row.meaning,
        extra: {
          phonetic: row.phonetic ?? undefined,
          translation: row.exampleTranslation ?? undefined,
        } satisfies WordbookItemExtra,
      }));
    } else if (dto.sourceType === 'sentence') {
      const rows = await this.db
        .select()
        .from(sentencePuzzles)
        .where(inArray(sentencePuzzles.id, dto.sourceIds));
      sourceItems = rows.map((row) => ({
        subject: 'english',
        contentType: 'sentence',
        source: 'textbook',
        sourceId: row.id,
        sourceInfo: dto.sourceInfo,
        content: row.sentence,
        title: row.sentence.slice(0, 50),
        answer: row.translation,
        extra: {
          translation: row.translation,
        } satisfies WordbookItemExtra,
      }));
    } else if (dto.sourceType === 'dictation') {
      const rows = await this.db
        .select()
        .from(dictationItems)
        .where(inArray(dictationItems.id, dto.sourceIds));
      sourceItems = rows.map((row) => ({
        subject: 'english',
        contentType: 'sentence',
        source: 'textbook',
        sourceId: row.id,
        sourceInfo: dto.sourceInfo,
        content: row.sentence,
        title: row.sentence.slice(0, 50),
        answer: row.translation,
        extra: {
          translation: row.translation,
          grammar: row.hint ?? undefined,
        } satisfies WordbookItemExtra,
      }));
    } else {
      throw new BadRequestException(`不支持的 sourceType: ${dto.sourceType}`);
    }

    if (sourceItems.length === 0) {
      return { success: 0, failed: dto.sourceIds.length, errors: ['未找到对应数据源'] };
    }

    // 按词库 contentType 校正
    if (wb.contentType === 'sentence' && dto.sourceType === 'word') {
      // 词库是句子类型但导入的是单词，调整 contentType
      sourceItems = sourceItems.map((item) => ({ ...item, contentType: 'word' as const }));
    }

    return this.addItemsBatch(userId, wordbookId, sourceItems);
  }

  // ===== 文本提取 =====

  extractText(
    text: string,
    subject: WordbookSubject,
    contentType: WordbookContentType,
  ): TextExtractResult {
    const items: AddWordbookItemDto[] = [];

    if (subject === 'english' && contentType === 'word') {
      const raw = text
        .split(/[\n,;、\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && /^[a-zA-Z'-]+$/.test(s));
      const seen = new Set<string>();
      for (const word of raw) {
        const lower = word.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          items.push({
            subject: 'english',
            contentType: 'word',
            content: lower,
            title: lower,
          });
        }
      }
    } else if (subject === 'english' && contentType === 'sentence') {
      const raw = text
        .split(/[.!?。！？\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 10);
      const seen = new Set<string>();
      for (const sentence of raw) {
        const key = sentence.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            subject: 'english',
            contentType: 'sentence',
            content: sentence,
            title: sentence.slice(0, 50),
          });
        }
      }
    } else {
      // 其他类型按换行切分
      const raw = text
        .split(/[\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const seen = new Set<string>();
      for (const line of raw) {
        if (!seen.has(line)) {
          seen.add(line);
          items.push({
            subject,
            contentType,
            content: line,
            title: line.slice(0, 50),
          });
        }
      }
    }

    return { items, count: items.length };
  }

  // ===== 学习记录 =====

  async getStudyItems(
    userId: string,
    wordbookId: string,
    limit: number,
    _mode?: string,
    order: 'sequential' | 'random' | 'wrong-first' = 'sequential',
  ): Promise<UserWordbookItem[]> {
    await this.getWordbook(userId, wordbookId);

    const where = and(
      this.createdByItem(userId),
      eq(userWordbookItems.wordbookId, wordbookId),
    );

    let rows: typeof userWordbookItems.$inferSelect[];

    if (order === 'random') {
      rows = await this.db
        .select()
        .from(userWordbookItems)
        .where(where)
        .orderBy(sql`RANDOM()`)
        .limit(limit);
    } else if (order === 'wrong-first') {
      rows = await this.db
        .select()
        .from(userWordbookItems)
        .where(where)
        .orderBy(
          asc(userWordbookItems.correctRate),
          desc(userWordbookItems.studyCount),
        )
        .limit(limit);
    } else {
      rows = await this.db
        .select()
        .from(userWordbookItems)
        .where(where)
        .orderBy(asc(userWordbookItems.createdAt))
        .limit(limit);
    }

    return rows.map((r) => this.toItem(r));
  }

  async submitStudyRecord(
    userId: string,
    dto: StudyRecordDto,
  ): Promise<void> {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      // 更新 item
      const itemRows = await tx
        .update(userWordbookItems)
        .set({
          studyCount: sql`${userWordbookItems.studyCount} + 1`,
          correctCount: sql`${userWordbookItems.correctCount} + ${dto.correct ? 1 : 0}`,
          correctRate: sql`
            (${userWordbookItems.correctCount} + ${dto.correct ? 1 : 0})::numeric
            / (${userWordbookItems.studyCount} + 1) * 100
          `,
          lastStudyTime: now,
          updatedAt: now,
          updatedBy: userId,
        })
        .where(and(
          this.createdByItem(userId),
          eq(userWordbookItems.id, dto.itemId),
        ))
        .returning({
          wordbookId: userWordbookItems.wordbookId,
          prevStudyCount: userWordbookItems.studyCount,
        });

      if (itemRows.length === 0) {
        throw new NotFoundException('学习条目不存在');
      }

      const { wordbookId, prevStudyCount } = itemRows[0];
      const isFirstStudy = prevStudyCount === 0;

      // 更新 wordbook
      if (isFirstStudy) {
        await tx
          .update(userWordbooks)
          .set({
            studiedCount: sql`${userWordbooks.studiedCount} + 1`,
            lastStudyTime: now,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userWordbooks.id, wordbookId));
      } else {
        await tx
          .update(userWordbooks)
          .set({
            lastStudyTime: now,
            updatedAt: now,
            updatedBy: userId,
          })
          .where(eq(userWordbooks.id, wordbookId));
      }

      // 重新计算 wordbook 整体正确率
      const stats = await tx
        .select({
          totalStudy: sql<number>`SUM(${userWordbookItems.studyCount})`,
          totalCorrect: sql<number>`SUM(${userWordbookItems.correctCount})`,
        })
        .from(userWordbookItems)
        .where(eq(userWordbookItems.wordbookId, wordbookId));

      const totalStudy = Number(stats[0]?.totalStudy ?? 0);
      const totalCorrect = Number(stats[0]?.totalCorrect ?? 0);
      const avgRate = totalStudy > 0 ? (totalCorrect / totalStudy) * 100 : 0;

      await tx
        .update(userWordbooks)
        .set({ correctRate: String(avgRate) })
        .where(eq(userWordbooks.id, wordbookId));
    });
  }

  async completeStudySession(
    userId: string,
    wordbookId: string,
    body: {
      total: number;
      correct: number;
      wrong: number;
      accuracy: number;
      durationSeconds: number;
    },
  ): Promise<StudySessionResult> {
    await this.getWordbook(userId, wordbookId);

    const now = new Date();
    await this.db
      .update(userWordbooks)
      .set({
        lastStudyTime: now,
        updatedAt: now,
        updatedBy: userId,
      })
      .where(eq(userWordbooks.id, wordbookId));

    return {
      total: body.total,
      correct: body.correct,
      wrong: body.wrong,
      accuracy: body.accuracy,
      durationSeconds: body.durationSeconds,
    };
  }

  // ===== 概览统计 =====

  async getOverviewStats(userId: string): Promise<{
    totalWordbooks: number;
    totalItems: number;
    totalStudyCount: number;
    avgCorrectRate: number;
  }> {
    const wbResult = await this.db
      .select({ count: count() })
      .from(userWordbooks)
      .where(this.createdBy(userId));

    const itemResult = await this.db.execute<{
      total_items: string;
      total_study: string;
      avg_rate: string;
    }>(sql`
      SELECT
        COUNT(*)::bigint AS total_items,
        COALESCE(SUM(i.study_count), 0)::bigint AS total_study,
        COALESCE(AVG(i.correct_rate::numeric), 0)::numeric AS avg_rate
      FROM ${userWordbookItems} i
      JOIN ${userWordbooks} w ON w.id = i.wordbook_id
      WHERE (w._created_by).user_id = ${userId}
    `);

    return {
      totalWordbooks: Number(wbResult[0]?.count ?? 0),
      totalItems: Number(itemResult[0]?.total_items ?? 0),
      totalStudyCount: Number(itemResult[0]?.total_study ?? 0),
      avgCorrectRate: Number(itemResult[0]?.avg_rate ?? 0),
    };
  }
}
