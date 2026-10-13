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
import { eq, and, asc, desc, count, ilike, or, sql, lte, inArray, type SQL } from 'drizzle-orm';
import type {
   WordItem,
   UserWordRecord,
   PagedResponse,
   WordAffix,
   WordAffixDetail,
   WordNote,
   WordRelatedGroup,
   WordLearningStats,
   ReviewMode,
   WordStatsRange,
 } from '@shared/api.interface';
import {
  wordItems,
  userWordRecords,
  wordAffixes,
  userWordFavorites,
  userWordSettings,
  userWordNotes,
} from '@server/database/schema';
import type { UpdateWordRecordDto } from './words.dto';

// 艾宾浩斯间隔（毫秒）
const EBBINGHAUS_INTERVALS_MS: Record<number, number> = {
  0: 10 * 60 * 1000, // 10分钟
  1: 60 * 60 * 1000, // 1小时
  2: 24 * 60 * 60 * 1000, // 1天
  3: 2 * 24 * 60 * 60 * 1000, // 2天
  4: 4 * 24 * 60 * 60 * 1000, // 4天
  5: 7 * 24 * 60 * 60 * 1000, // 7天
};

const MAX_EBBINGHAUS_LEVEL = 5;

interface WordStats {
  totalWords: number;
  mastered: number;
  learning: number;
  new_: number;
  todayReview: number;
  streakDays: number;
  todayLearned: number;
}

export type WordViewMode = 'all' | 'favorites' | 'wrong' | 'mastered';

@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ===== Word List & Detail =====

  async getWords(
    page: number,
    pageSize: number,
    level?: string,
    tags?: string,
    search?: string,
    textbookId?: string,
    unitId?: string,
    sort?: string,
    userId?: string,
  ): Promise<PagedResponse<WordItem>> {
    const offset = (page - 1) * pageSize;
    const sortMode = sort || 'order';

    // 有 unitId 或 textbookId 时走 word_items 直查
    if (unitId || textbookId) {
      const whereParts = [];
      if (unitId) {
        whereParts.push(sql`w.unit_id = ${unitId}`);
      }
      if (textbookId) {
        whereParts.push(sql`w.textbook_id = ${textbookId}`);
      }
      if (level) {
        whereParts.push(sql`w.level = ${level}`);
      }
      if (search) {
        const escaped = search.replace(/([%_\\])/g, '\\$1');
        const pattern = `%${escaped}%`;
        whereParts.push(sql`(w.word ILIKE ${pattern} OR w.meaning ILIKE ${pattern})`);
      }
      if (tags) {
        const tagList: string[] = tags.split(',').map((t: string) => t.trim());
        for (const tag of tagList) {
          whereParts.push(sql`w.tags @> ARRAY[${tag}]::text[]`);
        }
      }

      const whereSql = whereParts.length > 0
        ? sql`WHERE ${sql.join(whereParts, sql` AND `)}`
        : sql``;

      let orderSql = sql`ORDER BY w.word_order ASC, w.word ASC`;
      if (sortMode === 'alpha_asc') {
        orderSql = sql`ORDER BY w.word ASC`;
      } else if (sortMode === 'alpha_desc') {
        orderSql = sql`ORDER BY w.word DESC`;
      } else if (sortMode === 'created') {
        orderSql = sql`ORDER BY w._created_at DESC`;
      } else if (sortMode === 'familiarity' && userId) {
        orderSql = sql`ORDER BY COALESCE(ur.familiarity, 0) DESC, w.word ASC`;
      }

      const countResult = await this.db.execute<{ cnt: string }>(sql`
        SELECT count(*) as cnt
        FROM word_items w
        ${whereSql}
      `);
      const total = Number(countResult[0]?.cnt ?? 0);

      const joinForFamiliarity = sortMode === 'familiarity' && userId
        ? sql`LEFT JOIN user_word_records ur ON ur.word_id = w.id AND (ur.user_profile).user_id = ${userId}`
        : sql``;

      const rows = await this.db.execute<any>(sql`
        SELECT w.id, w.word, w.phonetic, w.meaning, w.part_of_speech,
               w.example_sentence, w.example_translation, w.root_affix,
               w.memory_tip, w.level, w.tags,
               w.textbook_id, w.unit_id, w.word_order, w.image_url
        FROM word_items w
        ${joinForFamiliarity}
        ${whereSql}
        ${orderSql}
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      const items: WordItem[] = rows.map((row: any) => ({
        id: row.id,
        word: row.word,
        phonetic: row.phonetic ?? undefined,
        meaning: row.meaning,
        partOfSpeech: row.part_of_speech ?? undefined,
        exampleSentence: row.example_sentence ?? undefined,
        exampleTranslation: row.example_translation ?? undefined,
        rootAffix: row.root_affix ?? undefined,
        memoryTip: row.memory_tip ?? undefined,
        level: row.level,
        tags: row.tags ?? [],
        textbookId: row.textbook_id ?? undefined,
        unitId: row.unit_id ?? undefined,
        wordOrder: row.word_order ?? undefined,
        imageUrl: row.image_url ?? undefined,
      }));

      return { items, total, page, pageSize };
    }

    const conditions = [];

    if (level) conditions.push(eq(wordItems.level, level));
    if (search) {
      const escaped = search.replace(/([%_\\])/g, '\\$1');
      conditions.push(
        or(
          ilike(wordItems.word, `%${escaped}%`),
          ilike(wordItems.meaning, `%${escaped}%`),
        ),
      );
    }
    if (tags) {
      const tagList: string[] = tags.split(',').map((t: string) => t.trim());
      for (const tag of tagList) {
        conditions.push(sql`${wordItems.tags} @> ARRAY[${tag}]::text[]`);
      }
    }

    let orderCol: SQL = asc(wordItems.wordOrder);
    if (sortMode === 'alpha_asc') {
      orderCol = asc(wordItems.word);
    } else if (sortMode === 'alpha_desc') {
      orderCol = desc(wordItems.word);
    } else if (sortMode === 'created') {
      orderCol = desc(wordItems.createdAt);
    }
    // order 默认按 word_order 升序；familiarity 需 join，走下方 raw SQL 分支

    if (sortMode === 'familiarity' && userId) {
      // 熟练度排序需要 left join user_word_records
      const whereSql = conditions.length > 0
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const countResult = await this.db.execute<{ cnt: string }>(sql`
        SELECT count(*) as cnt
        FROM word_items w
        ${whereSql}
      `);
      const total = Number(countResult[0]?.cnt ?? 0);

      const rows = await this.db.execute<any>(sql`
        SELECT w.id, w.word, w.phonetic, w.meaning, w.part_of_speech,
               w.example_sentence, w.example_translation, w.root_affix,
               w.memory_tip, w.level, w.tags,
               w.textbook_id, w.unit_id, w.word_order, w.image_url
        FROM word_items w
        LEFT JOIN user_word_records ur ON ur.word_id = w.id AND (ur.user_profile).user_id = ${userId}
        ${whereSql}
        ORDER BY COALESCE(ur.familiarity, 0) DESC, w.word ASC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      const items: WordItem[] = rows.map((row: any) => ({
        id: row.id,
        word: row.word,
        phonetic: row.phonetic ?? undefined,
        meaning: row.meaning,
        partOfSpeech: row.part_of_speech ?? undefined,
        exampleSentence: row.example_sentence ?? undefined,
        exampleTranslation: row.example_translation ?? undefined,
        rootAffix: row.root_affix ?? undefined,
        memoryTip: row.memory_tip ?? undefined,
        level: row.level,
        tags: row.tags ?? [],
        textbookId: row.textbook_id ?? undefined,
        unitId: row.unit_id ?? undefined,
        wordOrder: row.word_order ?? undefined,
        imageUrl: row.image_url ?? undefined,
      }));

      return { items, total, page, pageSize };
    }

    // Drizzle ORM path
    const countQuery = conditions.length > 0
        ? this.db
            .select({ count: count() })
            .from(wordItems)
            .where(and(...conditions))
        : this.db.select({ count: count() }).from(wordItems);

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    const listQuery =
      conditions.length > 0
        ? this.db
            .select()
            .from(wordItems)
            .where(and(...conditions))
            .orderBy(orderCol)
            .limit(pageSize)
            .offset(offset)
        : this.db
            .select()
            .from(wordItems)
            .orderBy(orderCol)
            .limit(pageSize)
            .offset(offset);

    const rows = await listQuery;

    const items: WordItem[] = rows.map((row) => ({
      id: row.id,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      meaning: row.meaning,
      partOfSpeech: row.partOfSpeech ?? undefined,
      exampleSentence: row.exampleSentence ?? undefined,
      exampleTranslation: row.exampleTranslation ?? undefined,
      rootAffix: row.rootAffix ?? undefined,
      memoryTip: row.memoryTip ?? undefined,
      level: row.level,
      tags: row.tags ?? [],
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      wordOrder: row.wordOrder ?? undefined,
    }));

    return { items, total, page, pageSize };
  }

  async getWordById(id: string): Promise<WordItem> {
    const rows = await this.db
      .select()
      .from(wordItems)
      .where(eq(wordItems.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    const row = rows[0];
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
       level: row.level,
       tags: row.tags ?? [],
       textbookId: row.textbookId ?? undefined,
       unitId: row.unitId ?? undefined,
        wordOrder: row.wordOrder ?? undefined,
      };
    }

  async getAffixes(type?: string, search?: string): Promise<WordAffix[]> {
     const conditions = [];
     if (type && type !== 'all') {
       conditions.push(eq(wordAffixes.affixType, type));
     }
     if (search) {
       const pattern = `%${search}%`;
       conditions.push(
         or(
           ilike(wordAffixes.affix, pattern),
           ilike(wordAffixes.meaning, pattern),
         ),
       );
     }
     const query = conditions.length > 0
       ? this.db.select().from(wordAffixes).where(and(...conditions)).orderBy(asc(wordAffixes.difficultyLevel))
       : this.db.select().from(wordAffixes).orderBy(asc(wordAffixes.difficultyLevel));
     const rows = await query;
     return rows.map((row) => ({
       id: row.id,
       affix: row.affix,
       affixType: row.affixType,
       meaning: row.meaning,
       exampleWords: row.exampleWords ?? [],
       exampleWordsCount: (row.exampleWords ?? []).length,
       description: row.description,
       difficultyLevel: row.difficultyLevel ?? 1,
     }));
   }

  async getWordsByList(wordList: string[]): Promise<WordItem[]> {
    // 去重并过滤空字符串
    const uniqueWords: string[] = [...new Set(
      wordList.map((w: string) => w.trim()).filter((w: string) => w.length > 0),
    )];

    if (uniqueWords.length === 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(wordItems)
      .where(inArray(wordItems.word, uniqueWords));

     const items: WordItem[] = rows.map((row) => ({
       id: row.id,
       word: row.word,
       phonetic: row.phonetic ?? undefined,
       meaning: row.meaning,
       partOfSpeech: row.partOfSpeech ?? undefined,
       exampleSentence: row.exampleSentence ?? undefined,
       exampleTranslation: row.exampleTranslation ?? undefined,
       rootAffix: row.rootAffix ?? undefined,
       memoryTip: row.memoryTip ?? undefined,
       level: row.level,
       tags: row.tags ?? [],
       textbookId: row.textbookId ?? undefined,
       unitId: row.unitId ?? undefined,
       wordOrder: row.wordOrder ?? undefined,
     }));

     return items;
  }

  async getAffixDetail(id: string): Promise<WordAffixDetail> {
    const affixRows = await this.db
      .select()
      .from(wordAffixes)
      .where(eq(wordAffixes.id, id))
      .limit(1);

    if (affixRows.length === 0) {
      throw new NotFoundException('词根词缀不存在');
    }

    const row = affixRows[0];
    const affix: WordAffix = {
      id: row.id,
      affix: row.affix,
      affixType: row.affixType,
      meaning: row.meaning,
      exampleWords: row.exampleWords ?? [],
      exampleWordsCount: (row.exampleWords ?? []).length,
      description: row.description,
      difficultyLevel: row.difficultyLevel ?? 1,
    };

    // 两个渠道合并去重：
    // 1. word_items.root_affix 匹配 affix.affix
    // 2. example_words 数组里的单词名反查 word_items.word
    const wordsFromRootAffix = await this.db
      .select()
      .from(wordItems)
      .where(eq(wordItems.rootAffix, affix.affix));

    const exampleWordList: string[] = row.exampleWords ?? [];
    let wordsFromExamples: typeof wordItems.$inferSelect[] = [];
    if (exampleWordList.length > 0) {
      wordsFromExamples = await this.db
        .select()
        .from(wordItems)
        .where(inArray(wordItems.word, exampleWordList));
    }

    const wordMap = new Map<string, WordItem>();
    const allRows = [...wordsFromRootAffix, ...wordsFromExamples];
    for (const wr of allRows) {
      if (wordMap.has(wr.id)) continue;
      wordMap.set(wr.id, {
        id: wr.id,
        word: wr.word,
        phonetic: wr.phonetic ?? undefined,
        meaning: wr.meaning,
        partOfSpeech: wr.partOfSpeech ?? undefined,
        exampleSentence: wr.exampleSentence ?? undefined,
        exampleTranslation: wr.exampleTranslation ?? undefined,
        rootAffix: wr.rootAffix ?? undefined,
        memoryTip: wr.memoryTip ?? undefined,
        level: wr.level,
        tags: wr.tags ?? [],
        textbookId: wr.textbookId ?? undefined,
        unitId: wr.unitId ?? undefined,
        wordOrder: wr.wordOrder ?? undefined,
        imageUrl: wr.imageUrl ?? undefined,
      });
    }

    return { affix, words: Array.from(wordMap.values()) };
  }

  // ===== Word Notes (单词笔记) =====

  async getNotes(userId: string, wordId: string): Promise<WordNote[]> {
    const rows = await this.db
      .select({
        id: userWordNotes.id,
        wordId: userWordNotes.wordId,
        content: userWordNotes.content,
        createdAt: userWordNotes.createdAt,
        updatedAt: userWordNotes.updatedAt,
      })
      .from(userWordNotes)
      .where(
        and(
          eq(userWordNotes.userProfile, userId),
          eq(userWordNotes.wordId, wordId),
        ),
      )
      .orderBy(desc(userWordNotes.createdAt));

    return rows.map((row) => ({
      id: row.id,
      wordId: row.wordId,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async createNote(userId: string, wordId: string, content: string): Promise<WordNote> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('笔记内容不能为空');
    }

    const wordExists = await this.db
      .select({ id: wordItems.id })
      .from(wordItems)
      .where(eq(wordItems.id, wordId))
      .limit(1);
    if (wordExists.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    const inserted = await this.db
      .insert(userWordNotes)
      .values({
        userProfile: userId,
        wordId,
        content: content.trim(),
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      wordId: row.wordId,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateNote(userId: string, noteId: string, content: string): Promise<WordNote> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('笔记内容不能为空');
    }

    const existing = await this.db
      .select()
      .from(userWordNotes)
      .where(eq(userWordNotes.id, noteId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('笔记不存在');
    }

    const note = existing[0];
    if (note.userProfile !== userId) {
      throw new ForbiddenException('无权限修改他人笔记');
    }

    const updated = await this.db
      .update(userWordNotes)
      .set({ content: content.trim() })
      .where(eq(userWordNotes.id, noteId))
      .returning();

    const row = updated[0];
    return {
      id: row.id,
      wordId: row.wordId,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(userWordNotes)
      .where(eq(userWordNotes.id, noteId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('笔记不存在');
    }

    if (existing[0].userProfile !== userId) {
      throw new ForbiddenException('无权限删除他人笔记');
    }

    const deleted = await this.db
      .delete(userWordNotes)
      .where(eq(userWordNotes.id, noteId))
      .returning({ id: userWordNotes.id });

    if (deleted.length === 0) {
      throw new NotFoundException('笔记不存在');
    }
  }

  // ===== Today Review =====

  async getTodayReview(
    userId: string,
    limit: number,
    mode: ReviewMode = 'full',
  ): Promise<UserWordRecord[]> {
    const now = new Date();
    const nowIso = now.toISOString();

    // 优先级排序：
    // 1: next_review_at < now（过期）
    // 2: wrong_count > 0 且 familiarity <= 20（错词本+低熟练）
    // 3: ebbinghaus_level <= 2（熟练度低）
    // 4: review_count <= 2（新词）
    // 同优先级按 next_review_at ASC
    const prioritySql = sql`
      CASE
        WHEN ur.next_review_at < ${nowIso}::timestamptz THEN 1
        WHEN (ur.wrong_count > 0 AND ur.familiarity <= 20) THEN 2
        WHEN ur.ebbinghaus_level <= 2 THEN 3
        WHEN ur.review_count <= 2 THEN 4
        ELSE 5
      END AS priority
    `;

    // mode 过滤条件
    // fast: 只返回过期未复习 + 错词本
    // full: 返回所有今日待复习（next_review_at <= 今天结束 或 new）
    // wrong: 只返回错词本中的单词（wrong_count > 0）
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndIso = todayEnd.toISOString();

    let modeFilter: SQL;
    if (mode === 'fast') {
      modeFilter = sql`(
        ur.next_review_at < ${nowIso}::timestamptz
        OR ur.wrong_count > 0
      )`;
    } else if (mode === 'wrong') {
      modeFilter = sql`ur.wrong_count > 0`;
    } else {
      modeFilter = sql`(
        (ur.next_review_at IS NOT NULL AND ur.next_review_at <= ${todayEndIso}::timestamptz)
        OR ur.status = 'new'
      )`;
    }

    const effectiveLimit = Math.min(limit, 50);

    const rows = await this.db.execute<any>(sql`
      SELECT ur.*, ${prioritySql}
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ${modeFilter}
      ORDER BY priority ASC,
        COALESCE(ur.next_review_at, '-infinity'::timestamptz) ASC
      LIMIT ${effectiveLimit}
    `);

    // Collect word ids
    const wordIds: string[] = rows
      .map((row) => row.word_id)
      .filter((id: string) => id);

    // Fetch word details
    const wordMap = new Map<string, WordItem>();
    if (wordIds.length > 0) {
      const wordRows = await this.db
        .select()
        .from(wordItems)
        .where(sql`${wordItems.id} = ANY(ARRAY[${sql.join(
          wordIds.map((id: string) => sql`${id}`),
          sql`, `,
        )}]::uuid[])`);

      for (const wr of wordRows) {
         wordMap.set(wr.id, {
           id: wr.id,
           word: wr.word,
           phonetic: wr.phonetic ?? undefined,
           meaning: wr.meaning,
           partOfSpeech: wr.partOfSpeech ?? undefined,
           exampleSentence: wr.exampleSentence ?? undefined,
           exampleTranslation: wr.exampleTranslation ?? undefined,
           rootAffix: wr.rootAffix ?? undefined,
           memoryTip: wr.memoryTip ?? undefined,
           level: wr.level,
           tags: wr.tags ?? [],
           textbookId: wr.textbookId ?? undefined,
           unitId: wr.unitId ?? undefined,
           wordOrder: wr.wordOrder ?? undefined,
         });
      }
    }

    const items: UserWordRecord[] = rows.map((row) => {
      const lastReviewed = row.last_reviewed_at
        ? new Date(row.last_reviewed_at).toISOString()
        : undefined;
      const nextReview = row.next_review_at
        ? new Date(row.next_review_at).toISOString()
        : undefined;
      return {
        id: row.id,
        wordId: row.word_id,
        familiarity: row.familiarity,
        reviewCount: row.review_count,
        correctCount: row.correct_count,
        wrongCount: row.wrong_count ?? 0,
        lastReviewedAt: lastReviewed,
        nextReviewAt: nextReview,
        ebbinghausLevel: row.ebbinghaus_level,
        status: row.status,
        word: wordMap.get(row.word_id),
      };
    });

    return items;
  }

  // ===== Word Record Upsert =====

  /**
   * 计算艾宾浩斯复习间隔
   * 基于等级、连续正确/错误数、练习类型、是否使用提示动态调整
   */
  private calculateNextReviewInterval(
    level: number,
    isCorrect: boolean,
    previousCorrectCount: number,
    previousWrongCount: number,
    practiceType?: string,
    usedHint?: boolean,
  ): number {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const baseInterval: number = EBBINGHAUS_INTERVALS_MS[level]
      ?? EBBINGHAUS_INTERVALS_MS[MAX_EBBINGHAUS_LEVEL];
    let interval: number = baseInterval;

    if (isCorrect) {
      // 连续答对 3 次以上：间隔 × 1.5
      if (previousCorrectCount >= 2) {
        interval *= 1.5;
      }
      // 使用了提示：间隔 × 0.8
      if (usedHint) {
        interval *= 0.8;
      }
      // 最长不超过 30 天
      interval = Math.min(interval, THIRTY_DAYS_MS);
    } else {
      // 答错
      if (practiceType === 'spelling') {
        // 拼写错误：重置为 10 分钟
        interval = TEN_MINUTES_MS;
      } else if (practiceType === 'choice') {
        // 选择错误：重置为 1 小时
        interval = ONE_HOUR_MS;
      } else {
        // 连续答错 2 次：间隔 × 0.5
        if (previousWrongCount >= 1) {
          interval *= 0.5;
        }
        // 最短不低于 10 分钟
        interval = Math.max(interval, TEN_MINUTES_MS);
      }
    }

    return Math.round(interval);
  }

  async updateWordRecord(
    userId: string,
    dto: UpdateWordRecordDto,
  ): Promise<UserWordRecord> {
    if (!dto.wordId) {
      throw new BadRequestException('wordId 不能为空');
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(dto.wordId)) {
      throw new BadRequestException('wordId 格式无效');
    }

    const wordExists = await this.db
      .select({ id: wordItems.id })
      .from(wordItems)
      .where(eq(wordItems.id, dto.wordId))
      .limit(1);

    if (wordExists.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    // 查找现有记录
    const existing = await this.db
      .select()
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.wordId, dto.wordId),
        ),
      )
      .limit(1);

    const now = new Date();

    if (existing.length === 0) {
      // 创建新记录
      const newLevel: number = dto.isCorrect ? 1 : 0;
      const correctCount: number = dto.isCorrect ? 1 : 0;
      const wrongCount: number = dto.isCorrect ? 0 : 1;
      const intervalMs: number = this.calculateNextReviewInterval(
        newLevel,
        dto.isCorrect,
        0,
        0,
        dto.practiceType,
        dto.usedHint,
      );
      const nextReviewAt = new Date(now.getTime() + intervalMs);

      const inserted = await this.db
        .insert(userWordRecords)
        .values({
          userProfile: userId,
          wordId: dto.wordId,
          reviewCount: 1,
          correctCount,
          wrongCount,
          familiarity: dto.isCorrect ? 100 : 0,
          lastReviewedAt: now,
          nextReviewAt,
          ebbinghausLevel: newLevel,
          status: 'learning',
        })
        .returning();

      const record = inserted[0];
      return {
        id: record.id,
        wordId: record.wordId,
        familiarity: record.familiarity,
        reviewCount: record.reviewCount,
        correctCount: record.correctCount,
        wrongCount: record.wrongCount ?? 0,
        lastReviewedAt: record.lastReviewedAt
          ? record.lastReviewedAt.toISOString()
          : undefined,
        nextReviewAt: record.nextReviewAt
          ? record.nextReviewAt.toISOString()
          : undefined,
        ebbinghausLevel: record.ebbinghausLevel,
        status: record.status,
      };
    }

    // 更新现有记录
    const record = existing[0];
    const prevCorrectCount: number = record.correctCount ?? 0;
    const prevWrongCount: number = record.wrongCount ?? 0;
    const newReviewCount = record.reviewCount + 1;
    const newCorrectCount = dto.isCorrect
      ? prevCorrectCount + 1
      : prevCorrectCount;
    const newWrongCount = dto.isCorrect
      ? prevWrongCount
      : prevWrongCount + 1;
    const newFamiliarity = Math.round(
      (newCorrectCount / Math.max(newReviewCount, 1)) * 100,
    );

    // 艾宾浩斯等级调整
    let newLevel: number;
    if (dto.isCorrect) {
      newLevel = Math.min(record.ebbinghausLevel + 1, MAX_EBBINGHAUS_LEVEL);
    } else {
      newLevel = Math.max(record.ebbinghausLevel - 1, 0);
    }

    const intervalMs: number = this.calculateNextReviewInterval(
      newLevel,
      dto.isCorrect,
      prevCorrectCount,
      prevWrongCount,
      dto.practiceType,
      dto.usedHint,
    );
    const nextReviewAt = new Date(now.getTime() + intervalMs);

    // 状态判断：
    // review_count > 0 → 'learning'
    // ebbinghaus_level >= 5 且 正确率 > 80% → 'mastered'
    const accuracy = newCorrectCount / Math.max(newReviewCount, 1);
    let newStatus = record.status;
    if (newLevel >= MAX_EBBINGHAUS_LEVEL && accuracy > 0.8) {
      newStatus = 'mastered';
    } else if (record.status === 'new' || record.status === 'mastered') {
      newStatus = 'learning';
    }

    const updated = await this.db
      .update(userWordRecords)
      .set({
        reviewCount: newReviewCount,
        correctCount: newCorrectCount,
        wrongCount: newWrongCount,
        familiarity: newFamiliarity,
        lastReviewedAt: now,
        nextReviewAt,
        ebbinghausLevel: newLevel,
        status: newStatus,
      })
      .where(eq(userWordRecords.id, record.id))
      .returning();

    const result = updated[0];

    // 获取单词详情
    let word: WordItem | undefined;
    const wordRows = await this.db
      .select()
      .from(wordItems)
      .where(eq(wordItems.id, result.wordId))
      .limit(1);
    if (wordRows.length > 0) {
      const wr = wordRows[0];
      word = {
        id: wr.id,
        word: wr.word,
        phonetic: wr.phonetic ?? undefined,
        meaning: wr.meaning,
        partOfSpeech: wr.partOfSpeech ?? undefined,
        exampleSentence: wr.exampleSentence ?? undefined,
        exampleTranslation: wr.exampleTranslation ?? undefined,
        rootAffix: wr.rootAffix ?? undefined,
        memoryTip: wr.memoryTip ?? undefined,
        level: wr.level,
        tags: wr.tags ?? [],
      };
    }

    return {
      id: result.id,
      wordId: result.wordId,
      familiarity: result.familiarity,
      reviewCount: result.reviewCount,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount ?? 0,
      lastReviewedAt: result.lastReviewedAt
        ? result.lastReviewedAt.toISOString()
        : undefined,
      nextReviewAt: result.nextReviewAt
        ? result.nextReviewAt.toISOString()
        : undefined,
      ebbinghausLevel: result.ebbinghausLevel,
      status: result.status,
      word,
    };
  }

  // ===== Word Stats =====

  async getWordStats(userId: string): Promise<WordStats> {
    // 总单词数（单词库总数）
    const totalResult = await this.db
      .select({ count: count() })
      .from(wordItems);
    const totalWords = Number(totalResult[0]?.count ?? 0);

    // 已掌握
    const masteredResult = await this.db
      .select({ count: count() })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.status, 'mastered'),
        ),
      );
    const mastered = Number(masteredResult[0]?.count ?? 0);

    // 学习中
    const learningResult = await this.db
      .select({ count: count() })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.status, 'learning'),
        ),
      );
    const learning = Number(learningResult[0]?.count ?? 0);

    // 新单词（status = 'new'）
    const newResult = await this.db
      .select({ count: count() })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.status, 'new'),
        ),
      );
    const new_ = Number(newResult[0]?.count ?? 0);

    // 今日需复习
    const now = new Date();
    const todayReviewResult = await this.db
      .select({ count: count() })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          or(
            lte(userWordRecords.nextReviewAt, now),
            eq(userWordRecords.status, 'new'),
          ),
        ),
      );
    const todayReview = Number(todayReviewResult[0]?.count ?? 0);

    // 今日学习（今天有学习记录的单词数）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLearnedResult = await this.db
      .select({ count: count() })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          sql`${userWordRecords.lastReviewedAt} >= ${todayStart.toISOString()}::timestamptz`,
        ),
      );
    const todayLearned = Number(todayLearnedResult[0]?.count ?? 0);

    return { totalWords, mastered, learning, new_, todayReview, streakDays: 0, todayLearned };
  }

  // ===== Favorites =====

  async getFavorites(userId: string): Promise<WordItem[]> {
    const rows = await this.db
      .select({
        id: wordItems.id,
        word: wordItems.word,
        phonetic: wordItems.phonetic,
        meaning: wordItems.meaning,
        partOfSpeech: wordItems.partOfSpeech,
        exampleSentence: wordItems.exampleSentence,
        exampleTranslation: wordItems.exampleTranslation,
        rootAffix: wordItems.rootAffix,
        memoryTip: wordItems.memoryTip,
        level: wordItems.level,
        tags: wordItems.tags,
        textbookId: wordItems.textbookId,
        unitId: wordItems.unitId,
        wordOrder: wordItems.wordOrder,
        imageUrl: wordItems.imageUrl,
        audioUrl: wordItems.audioUrl,
      })
      .from(userWordFavorites)
      .innerJoin(
        wordItems,
        eq(userWordFavorites.wordId, wordItems.id),
      )
      .where(eq(userWordFavorites.userProfile, userId))
      .orderBy(desc(userWordFavorites.createdAt));

    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      meaning: row.meaning,
      partOfSpeech: row.partOfSpeech ?? undefined,
      exampleSentence: row.exampleSentence ?? undefined,
      exampleTranslation: row.exampleTranslation ?? undefined,
      rootAffix: row.rootAffix ?? undefined,
      memoryTip: row.memoryTip ?? undefined,
      level: row.level,
      tags: row.tags ?? [],
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      wordOrder: row.wordOrder ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
    }));
  }

  async addFavorite(userId: string, wordId: string): Promise<void> {
    const wordExists = await this.db
      .select({ id: wordItems.id })
      .from(wordItems)
      .where(eq(wordItems.id, wordId))
      .limit(1);
    if (wordExists.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    await this.db
      .insert(userWordFavorites)
      .values({
        userProfile: userId,
        wordId,
      })
      .onConflictDoNothing();
  }

  async removeFavorite(userId: string, wordId: string): Promise<void> {
    await this.db
      .delete(userWordFavorites)
      .where(
        and(
          eq(userWordFavorites.userProfile, userId),
          eq(userWordFavorites.wordId, wordId),
        ),
      );
  }

  async checkFavorite(userId: string, wordId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: userWordFavorites.id })
      .from(userWordFavorites)
      .where(
        and(
          eq(userWordFavorites.userProfile, userId),
          eq(userWordFavorites.wordId, wordId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  // ===== Wrong words (错词本) =====

  async getWrongWords(
    userId: string,
    limit: number,
  ): Promise<WordItem[]> {
    const recordRows = await this.db
      .select({ wordId: userWordRecords.wordId })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          sql`(user_word_records.wrong_count > 0 OR user_word_records.ebbinghaus_level = 0)`,
        ),
      )
      .orderBy(desc(userWordRecords.lastReviewedAt))
      .limit(limit);

    const wordIds: string[] = recordRows
      .map((r) => r.wordId)
      .filter((id: string) => id);

    if (wordIds.length === 0) return [];

    const wordRows = await this.db
      .select()
      .from(wordItems)
      .where(inArray(wordItems.id, wordIds));

    const wordMap = new Map<string, WordItem>();
    for (const wr of wordRows) {
      wordMap.set(wr.id, {
        id: wr.id,
        word: wr.word,
        phonetic: wr.phonetic ?? undefined,
        meaning: wr.meaning,
        partOfSpeech: wr.partOfSpeech ?? undefined,
        exampleSentence: wr.exampleSentence ?? undefined,
        exampleTranslation: wr.exampleTranslation ?? undefined,
        rootAffix: wr.rootAffix ?? undefined,
        memoryTip: wr.memoryTip ?? undefined,
        level: wr.level,
        tags: wr.tags ?? [],
        textbookId: wr.textbookId ?? undefined,
        unitId: wr.unitId ?? undefined,
        wordOrder: wr.wordOrder ?? undefined,
        imageUrl: wr.imageUrl ?? undefined,
      });
    }

    return wordIds
      .map((id: string) => wordMap.get(id))
      .filter((w): w is WordItem => !!w);
  }

  // ===== Mastered words (已掌握) =====

  async getMasteredWords(
    userId: string,
    limit: number,
  ): Promise<WordItem[]> {
    const recordRows = await this.db
      .select({ wordId: userWordRecords.wordId })
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.status, 'mastered'),
        ),
      )
      .orderBy(desc(userWordRecords.lastReviewedAt))
      .limit(limit);

    const wordIds: string[] = recordRows
      .map((r) => r.wordId)
      .filter((id: string) => id);

    if (wordIds.length === 0) return [];

    const wordRows = await this.db
      .select()
      .from(wordItems)
      .where(inArray(wordItems.id, wordIds));

    const wordMap = new Map<string, WordItem>();
    for (const wr of wordRows) {
      wordMap.set(wr.id, {
        id: wr.id,
        word: wr.word,
        phonetic: wr.phonetic ?? undefined,
        meaning: wr.meaning,
        partOfSpeech: wr.partOfSpeech ?? undefined,
        exampleSentence: wr.exampleSentence ?? undefined,
        exampleTranslation: wr.exampleTranslation ?? undefined,
        rootAffix: wr.rootAffix ?? undefined,
        memoryTip: wr.memoryTip ?? undefined,
        level: wr.level,
        tags: wr.tags ?? [],
        textbookId: wr.textbookId ?? undefined,
        unitId: wr.unitId ?? undefined,
        wordOrder: wr.wordOrder ?? undefined,
        imageUrl: wr.imageUrl ?? undefined,
      });
    }

    return wordIds
      .map((id: string) => wordMap.get(id))
      .filter((w): w is WordItem => !!w);
  }

  // ===== All user records (for client-side filtering) =====

  async getAllUserWordRecords(
    userId: string,
  ): Promise<{ wordId: string; ebbinghausLevel: number; status: string; familiarity: number; wrongCount: number }[]> {
    const rows = await this.db
      .select({
        wordId: userWordRecords.wordId,
        ebbinghausLevel: userWordRecords.ebbinghausLevel,
        status: userWordRecords.status,
        familiarity: userWordRecords.familiarity,
        wrongCount: userWordRecords.wrongCount,
      })
      .from(userWordRecords)
      .where(eq(userWordRecords.userProfile, userId));

    return rows.map((row) => ({
      wordId: row.wordId,
      ebbinghausLevel: row.ebbinghausLevel ?? 0,
      status: row.status ?? 'new',
      familiarity: row.familiarity ?? 0,
      wrongCount: row.wrongCount ?? 0,
    }));
  }

  // ===== Word Settings (学习计划) =====

  async getSettings(userId: string): Promise<{
    dailyGoal: number;
    preferredModes: string[];
    reminderEnabled: boolean;
    reminderTime: string;
  }> {
    const rows = await this.db
      .select()
      .from(userWordSettings)
      .where(eq(userWordSettings.userProfile, userId))
      .limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      return {
        dailyGoal: row.dailyGoal,
        preferredModes: (row.preferredModes as string[]) ?? ['recite', 'spelling', 'choice'],
        reminderEnabled: row.reminderEnabled,
        reminderTime: row.reminderTime,
      };
    }

    const inserted = await this.db
      .insert(userWordSettings)
      .values({ userProfile: userId })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) {
      return {
        dailyGoal: inserted[0].dailyGoal,
        preferredModes: (inserted[0].preferredModes as string[]) ?? ['recite', 'spelling', 'choice'],
        reminderEnabled: inserted[0].reminderEnabled,
        reminderTime: inserted[0].reminderTime,
      };
    }

    const fallback = await this.db
      .select()
      .from(userWordSettings)
      .where(eq(userWordSettings.userProfile, userId))
      .limit(1);

    if (fallback.length > 0) {
      return {
        dailyGoal: fallback[0].dailyGoal,
        preferredModes: (fallback[0].preferredModes as string[]) ?? ['recite', 'spelling', 'choice'],
        reminderEnabled: fallback[0].reminderEnabled,
        reminderTime: fallback[0].reminderTime,
      };
    }

    return {
      dailyGoal: 20,
      preferredModes: ['recite', 'spelling', 'choice'],
      reminderEnabled: false,
      reminderTime: '20:00',
    };
  }

  async updateSettings(
    userId: string,
    dto: {
      dailyGoal?: number;
      preferredModes?: string[];
      reminderEnabled?: boolean;
      reminderTime?: string;
    },
  ): Promise<{
    dailyGoal: number;
    preferredModes: string[];
    reminderEnabled: boolean;
    reminderTime: string;
  }> {
    const patch: Partial<typeof userWordSettings.$inferInsert> = {};
    if (dto.dailyGoal !== undefined) patch.dailyGoal = dto.dailyGoal;
    if (dto.preferredModes !== undefined) patch.preferredModes = dto.preferredModes as any;
    if (dto.reminderEnabled !== undefined) patch.reminderEnabled = dto.reminderEnabled;
    if (dto.reminderTime !== undefined) patch.reminderTime = dto.reminderTime;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const existing = await this.db
      .select({ id: userWordSettings.id })
      .from(userWordSettings)
      .where(eq(userWordSettings.userProfile, userId))
      .limit(1);

    if (existing.length === 0) {
      await this.db
        .insert(userWordSettings)
        .values({ userProfile: userId, ...patch })
        .onConflictDoNothing();
    } else {
      await this.db
        .update(userWordSettings)
        .set(patch)
        .where(eq(userWordSettings.id, existing[0].id));
    }

    return this.getSettings(userId);
  }

  // ===== Choice distractors (选择题干扰项) =====

  async getChoiceDistractors(
    wordId: string,
    count: number,
  ): Promise<WordItem[]> {
    const wordRows = await this.db
      .select()
      .from(wordItems)
      .where(eq(wordItems.id, wordId))
      .limit(1);

    if (wordRows.length === 0) {
      throw new NotFoundException('单词不存在');
    }

    const target = wordRows[0];
    const pos = target.partOfSpeech;
    const level = target.level;

    const conditions1 = [sql`${wordItems.id} != ${wordId}`];
    if (pos) conditions1.push(eq(wordItems.partOfSpeech, pos));
    if (level) conditions1.push(eq(wordItems.level, level));

    const distractorRows = await this.db
      .select()
      .from(wordItems)
      .where(and(...conditions1))
      .orderBy(sql`random()`)
      .limit(count);

    if (distractorRows.length < count) {
      const extraRows = await this.db
        .select()
        .from(wordItems)
        .where(
          and(
            sql`${wordItems.id} != ${wordId}`,
            sql`${wordItems.id} NOT IN (${sql.join(
              distractorRows.map((r: typeof wordItems.$inferSelect) => sql`${r.id}`),
              sql`, `,
            )})`,
          ),
        )
        .orderBy(sql`random()`)
        .limit(count - distractorRows.length);
      distractorRows.push(...extraRows);
    }

    return distractorRows.map((row) => ({
      id: row.id,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      meaning: row.meaning,
      partOfSpeech: row.partOfSpeech ?? undefined,
      exampleSentence: row.exampleSentence ?? undefined,
      exampleTranslation: row.exampleTranslation ?? undefined,
      rootAffix: row.rootAffix ?? undefined,
      memoryTip: row.memoryTip ?? undefined,
      level: row.level,
      tags: row.tags ?? [],
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      wordOrder: row.wordOrder ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
    }));
  }

  // ===== Learning Stats (学习报告统计) =====

  async getLearningStats(
    userId: string,
    range: WordStatsRange = 'week',
  ): Promise<WordLearningStats> {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 计算范围起始时间
    let rangeStart: Date;
    if (range === 'today') {
      rangeStart = todayStart;
    } else if (range === 'week') {
      rangeStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      rangeStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else {
      // all: 从很早开始
      rangeStart = new Date(0);
    }

    const rangeStartIso = rangeStart.toISOString();
    const todayStartIso = todayStart.toISOString();
    const todayEndIso = todayEnd.toISOString();

    // ===== overview =====
    // 范围内首次学习的单词数（review_count 从 0 变 1+，即 createdAt 在范围内且 review_count >= 1）
    // 简化：用 _created_at 在范围内且 review_count > 0 的记录数作为近似
    const learnedResult = await this.db.execute<{ cnt: string }>(sql`
      SELECT count(*) as cnt
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur._created_at >= ${rangeStartIso}::timestamptz
        AND ur.review_count > 0
    `);
    const wordsLearned = Number(learnedResult[0]?.cnt ?? 0);

    // 范围内复习过的单词数（last_reviewed_at 在范围内）
    const reviewedResult = await this.db.execute<{ cnt: string }>(sql`
      SELECT count(*) as cnt
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur.last_reviewed_at >= ${rangeStartIso}::timestamptz
        AND ur.review_count > 1
    `);
    const wordsReviewed = Number(reviewedResult[0]?.cnt ?? 0);

    // 当前待复习单词数（next_review_at <= 今天结束）
    const pendingResult = await this.db.execute<{ cnt: string }>(sql`
      SELECT count(*) as cnt
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur.next_review_at <= ${todayEndIso}::timestamptz
    `);
    const pendingReview = Number(pendingResult[0]?.cnt ?? 0);

    // 范围内正确率（correct_count 增量 / review_count 增量）
    // 近似：用当前总 correct / total review 做参考，更精确需要历史记录
    // 这里用当前用户所有记录的累计正确率作为近似
    const accuracyResult = await this.db.execute<{
      total_review: string;
      total_correct: string;
    }>(sql`
      SELECT
        COALESCE(SUM(ur.review_count), 0) as total_review,
        COALESCE(SUM(ur.correct_count), 0) as total_correct
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
    `);
    const totalReview = Number(accuracyResult[0]?.total_review ?? 0);
    const totalCorrect = Number(accuracyResult[0]?.total_correct ?? 0);
    const accuracy = totalReview > 0
      ? Math.round((totalCorrect / totalReview) * 100)
      : 0;

    // 连续学习天数（从打卡表取）
    let streakDays = 0;
    const checkInResult = await this.db.execute<{ cnt: string; max_streak: string }>(sql`
      SELECT
        count(*) as cnt,
        0 as max_streak
      FROM check_in_records c
      WHERE (c.user_profile).user_id = ${userId}
    `);
    // 如果打卡表没有数据，尝试从 word 记录推断
    const checkInCount = Number(checkInResult[0]?.cnt ?? 0);
      if (checkInCount > 0) {
        const streakResult = await this.db.execute<{ streak: string }>(sql`
          WITH RECURSIVE consecutive_days AS (
            SELECT (
              SELECT c.check_in_date
              FROM check_in_records c
              WHERE (c.user_profile).user_id = ${userId}
                AND c.check_in_date <= CURRENT_DATE
              ORDER BY c.check_in_date DESC
              LIMIT 1
            )::date as d, 1 as streak
            UNION ALL
            SELECT c.check_in_date::date, cd.streak + 1
            FROM check_in_records c
            JOIN consecutive_days cd ON c.check_in_date::date = cd.d - INTERVAL '1 day'
            WHERE (c.user_profile).user_id = ${userId}
          )
          SELECT COALESCE(MAX(streak), 0) as streak
          FROM consecutive_days
        `);
        streakDays = Number(streakResult[0]?.streak ?? 0);
      }

    // ===== masteryDistribution =====
    const masteryResult = await this.db.execute<{ level: string; cnt: string }>(sql`
      SELECT
        CASE
          WHEN ur.familiarity = 0 THEN 'unfamiliar'
          WHEN ur.familiarity BETWEEN 1 AND 40 THEN 'learning'
          WHEN ur.familiarity BETWEEN 41 AND 80 THEN 'familiar'
          WHEN ur.familiarity BETWEEN 81 AND 100 THEN 'mastered'
          ELSE 'unfamiliar'
        END as level,
        count(*) as cnt
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
      GROUP BY level
    `);

    const totalUserWords = masteryResult.reduce(
      (sum: number, row: { level: string; cnt: string }) => sum + Number(row.cnt),
      0,
    );

    const levelLabels: Record<string, string> = {
      unfamiliar: '陌生',
      learning: '熟悉中',
      familiar: '熟悉',
      mastered: '掌握',
    };
    const levelOrder = ['unfamiliar', 'learning', 'familiar', 'mastered'];

    const masteryDistribution = levelOrder.map((lvl: string) => {
      const found = masteryResult.find((r: { level: string; cnt: string }) => r.level === lvl);
      const cnt = found ? Number(found.cnt) : 0;
      return {
        level: levelLabels[lvl] || lvl,
        count: cnt,
        percentage: totalUserWords > 0
          ? Math.round((cnt / totalUserWords) * 100)
          : 0,
      };
    });

    // ===== weeklyTrend: 最近 7 天 =====
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    const weeklyResult = await this.db.execute<{
      date_str: string;
      learned: string;
    }>(sql`
      SELECT
        DATE(ur._created_at)::text as date_str,
        count(*) FILTER (WHERE ur.review_count > 0) as learned
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur._created_at >= ${sevenDaysAgoIso}::timestamptz
      GROUP BY DATE(ur._created_at)
    `);

    // 复习记录（last_reviewed_at 在范围内，但非首次学习的）
    const weeklyReviewedResult = await this.db.execute<{
      date_str: string;
      reviewed: string;
    }>(sql`
      SELECT
        DATE(ur.last_reviewed_at)::text as date_str,
        count(*) FILTER (WHERE ur.review_count > 1) as reviewed
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur.last_reviewed_at >= ${sevenDaysAgoIso}::timestamptz
      GROUP BY DATE(ur.last_reviewed_at)
    `);

    const reviewedByDate = new Map<string, number>();
    for (const r of weeklyReviewedResult) {
      reviewedByDate.set(r.date_str, Number(r.reviewed));
    }

    const learnedByDate = new Map<string, number>();
    for (const r of weeklyResult) {
      learnedByDate.set(r.date_str, Number(r.learned));
    }

    const weeklyTrend: { date: string; learned: number; reviewed: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      weeklyTrend.push({
        date: dateStr,
        learned: learnedByDate.get(dateStr) ?? 0,
        reviewed: reviewedByDate.get(dateStr) ?? 0,
      });
    }

    // ===== textbookMastery =====
    const textbookResult = await this.db.execute<{
      textbook_id: string;
      textbook_name: string;
      total_words: string;
      mastered_words: string;
    }>(sql`
      SELECT
        t.id as textbook_id,
        t.title as textbook_name,
        COUNT(DISTINCT w.id) as total_words,
        COUNT(DISTINCT CASE WHEN ur.familiarity >= 80 THEN w.id END) as mastered_words
      FROM textbooks t
      JOIN word_items w ON w.textbook_id = t.id
      LEFT JOIN user_word_records ur
        ON ur.word_id = w.id
        AND (ur.user_profile).user_id = ${userId}
      WHERE t.subject = 'english' OR t.subject IS NULL
      GROUP BY t.id, t.title
      ORDER BY t.sort_order ASC, t.title ASC
    `);

    const textbookMastery = textbookResult
      .filter((row: { total_words: string }) => Number(row.total_words) > 0)
      .map((row: {
        textbook_id: string;
        textbook_name: string;
        total_words: string;
        mastered_words: string;
      }) => {
        const total = Number(row.total_words);
        const mastered = Number(row.mastered_words);
        return {
          textbookId: row.textbook_id,
          textbookName: row.textbook_name,
          totalWords: total,
          masteredWords: mastered,
          masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
        };
      });

    // ===== wrongWordsStats =====
    const wrongTotalResult = await this.db.execute<{ cnt: string }>(sql`
      SELECT count(*) as cnt
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur.wrong_count > 0
    `);
    const wrongTotal = Number(wrongTotalResult[0]?.cnt ?? 0);

    // 今日新增错词（今天有学习记录且 wrong_count > 0）
    // 近似：last_reviewed_at 在今日且 wrong_count > 0 且 review_count = 1 时首次出错
    const wrongTodayResult = await this.db.execute<{ cnt: string }>(sql`
      SELECT count(*) as cnt
      FROM user_word_records ur
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur.wrong_count > 0
        AND ur.last_reviewed_at >= ${todayStartIso}::timestamptz
        AND ur.last_reviewed_at <= ${todayEndIso}::timestamptz
    `);
    const todayNew = Number(wrongTodayResult[0]?.cnt ?? 0);

    // 错词最多的前 5 个单词
    const topWrongResult = await this.db.execute<any>(sql`
      SELECT ur.*, w.word, w.meaning, w.phonetic, w.part_of_speech,
             w.example_sentence, w.example_translation, w.root_affix,
             w.memory_tip, w.level, w.tags, w.textbook_id, w.unit_id, w.word_order
      FROM user_word_records ur
      JOIN word_items w ON w.id = ur.word_id
      WHERE (ur.user_profile).user_id = ${userId}
        AND ur.wrong_count > 0
      ORDER BY ur.wrong_count DESC, ur.last_reviewed_at DESC
      LIMIT 5
    `);

    const topWords: WordItem[] = topWrongResult.map((row: any) => ({
      id: row.word_id,
      word: row.word,
      phonetic: row.phonetic ?? undefined,
      meaning: row.meaning,
      partOfSpeech: row.part_of_speech ?? undefined,
      exampleSentence: row.example_sentence ?? undefined,
      exampleTranslation: row.example_translation ?? undefined,
      rootAffix: row.root_affix ?? undefined,
      memoryTip: row.memory_tip ?? undefined,
      level: row.level,
      tags: row.tags ?? [],
      textbookId: row.textbook_id ?? undefined,
      unitId: row.unit_id ?? undefined,
      wordOrder: row.word_order ?? undefined,
    }));

    // ===== practiceModeStats =====
    // 简化实现：返回默认模式占位数据
    const practiceModeStats = [
      { mode: 'recite', label: '闪卡背诵', count: 0, accuracy: 0 },
      { mode: 'spelling', label: '拼写练习', count: 0, accuracy: 0 },
      { mode: 'choice', label: '选择题', count: 0, accuracy: 0 },
      { mode: 'fill', label: '填空练习', count: 0, accuracy: 0 },
    ];

    return {
      overview: {
        wordsLearned,
        wordsReviewed,
        pendingReview,
        accuracy,
        streakDays,
      },
      masteryDistribution,
      weeklyTrend,
      textbookMastery,
      wrongWordsStats: {
        total: wrongTotal,
        todayNew,
        topWords,
      },
      practiceModeStats,
    };
  }

  // ===== Word Relations (关联词查询) =====

  async getWordRelations(wordId: string): Promise<WordRelatedGroup[]> {
    // 验证单词存在
    const wordRows = await this.db
      .select()
      .from(wordItems)
      .where(eq(wordItems.id, wordId))
      .limit(1);
    if (wordRows.length === 0) {
      throw new NotFoundException('单词不存在');
    }
    const sourceWord = wordRows[0];

    // 类型映射
    const typeLabels: Record<string, string> = {
      synonym: '同义词',
      antonym: '反义词',
      derivative: '派生词',
      similar_form: '形近词',
      root_word: '同根词',
    };

    // 查询 word_relations 表，关联 word_items 取详情
    const relationRows = await this.db.execute<any>(sql`
      SELECT
        wr.relation_type,
        w.id, w.word, w.phonetic, w.meaning, w.part_of_speech,
        w.example_sentence, w.example_translation, w.root_affix,
        w.memory_tip, w.level, w.tags, w.textbook_id, w.unit_id, w.word_order
      FROM word_relations wr
      JOIN word_items w ON w.id = wr.related_word_id
      WHERE wr.word_id = ${wordId}::uuid
      ORDER BY wr.relation_type, w.word
    `);

    // 按类型分组
    const groupsMap = new Map<string, WordItem[]>();
    for (const row of relationRows) {
      const type: string = row.relation_type;
      if (!groupsMap.has(type)) {
        groupsMap.set(type, []);
      }
      const list = groupsMap.get(type)!;
      if (list.length < 10) {
        list.push({
          id: row.id,
          word: row.word,
          phonetic: row.phonetic ?? undefined,
          meaning: row.meaning,
          partOfSpeech: row.part_of_speech ?? undefined,
          exampleSentence: row.example_sentence ?? undefined,
          exampleTranslation: row.example_translation ?? undefined,
          rootAffix: row.root_affix ?? undefined,
          memoryTip: row.memory_tip ?? undefined,
          level: row.level,
          tags: row.tags ?? [],
          textbookId: row.textbook_id ?? undefined,
          unitId: row.unit_id ?? undefined,
          wordOrder: row.word_order ?? undefined,
        });
      }
    }

    // 同根词补充：从词根词缀关联推断
    if (sourceWord.rootAffix) {
      const affixRows = await this.db
        .select()
        .from(wordAffixes)
        .where(eq(wordAffixes.affix, sourceWord.rootAffix))
        .limit(5);

      const rootWords: WordItem[] = [];
      const seenIds = new Set<string>();

      for (const affix of affixRows) {
        const exampleWordList: string[] = affix.exampleWords ?? [];
        if (exampleWordList.length === 0) continue;

        // 从 word_items 中查这些 example_words 的详情
        const wordListRows = await this.db
          .select()
          .from(wordItems)
          .where(
            and(
              inArray(wordItems.word, exampleWordList),
              sql`${wordItems.id} != ${wordId}`,
            ),
          )
          .limit(10);

        for (const wr of wordListRows) {
          if (seenIds.has(wr.id)) continue;
          seenIds.add(wr.id);
          if (rootWords.length >= 10) break;
          rootWords.push({
            id: wr.id,
            word: wr.word,
            phonetic: wr.phonetic ?? undefined,
            meaning: wr.meaning,
            partOfSpeech: wr.partOfSpeech ?? undefined,
            exampleSentence: wr.exampleSentence ?? undefined,
            exampleTranslation: wr.exampleTranslation ?? undefined,
            rootAffix: wr.rootAffix ?? undefined,
            memoryTip: wr.memoryTip ?? undefined,
            level: wr.level,
            tags: wr.tags ?? [],
            textbookId: wr.textbookId ?? undefined,
            unitId: wr.unitId ?? undefined,
            wordOrder: wr.wordOrder ?? undefined,
          });
        }

        if (rootWords.length >= 10) break;
      }

      // 如果通过 example_words 没找到或数量不够，补充通过 root_affix 字段直接匹配的
      // 过滤掉 "简单词" 等无实际词根意义的标签
      if (rootWords.length < 10 && sourceWord.rootAffix && sourceWord.rootAffix !== '简单词') {
        const rootAffixRows = await this.db
          .select()
          .from(wordItems)
          .where(
            and(
              eq(wordItems.rootAffix, sourceWord.rootAffix),
              sql`${wordItems.id} != ${wordId}`,
              sql`${wordItems.rootAffix} != '简单词'`,
            ),
          )
          .limit(10);

        for (const wr of rootAffixRows) {
          if (seenIds.has(wr.id)) continue;
          seenIds.add(wr.id);
          if (rootWords.length >= 10) break;
          rootWords.push({
            id: wr.id,
            word: wr.word,
            phonetic: wr.phonetic ?? undefined,
            meaning: wr.meaning,
            partOfSpeech: wr.partOfSpeech ?? undefined,
            exampleSentence: wr.exampleSentence ?? undefined,
            exampleTranslation: wr.exampleTranslation ?? undefined,
            rootAffix: wr.rootAffix ?? undefined,
            memoryTip: wr.memoryTip ?? undefined,
            level: wr.level,
            tags: wr.tags ?? [],
            textbookId: wr.textbookId ?? undefined,
            unitId: wr.unitId ?? undefined,
            wordOrder: wr.wordOrder ?? undefined,
          });
        }
      }

      if (rootWords.length > 0) {
        groupsMap.set('root_word', rootWords.slice(0, 10));
      }
    }

    // 构建返回数组，只返回有关联词的类型
    const result: WordRelatedGroup[] = [];
    const typeOrder = ['synonym', 'antonym', 'derivative', 'similar_form', 'root_word'];
    for (const type of typeOrder) {
      const items = groupsMap.get(type);
      if (items && items.length > 0) {
        result.push({
          type,
          label: typeLabels[type] || type,
          items,
        });
      }
    }

    return result;
  }
}
