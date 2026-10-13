import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type {
  SentencePuzzle,
  DictationItem,
  SubmitSentenceResultDto,
  SubmitDictationResultDto,
  SubmitFeedbackDto,
  UpdateSentenceMasteryDto,
  PagedResponse,
  WordParse,
} from '@shared/api.interface';
import {
  sentencePuzzles,
  dictationItems,
  userSentenceRecords,
  userDictationRecords,
  sentenceFeedback,
  preschoolSentences,
  preschoolWords,
  preschoolLetters,
  preschoolPhonics,
} from '@server/database/schema';

interface SentenceRecordWithPuzzle {
  id: string;
  puzzleId: string;
  isCorrect: boolean;
  attempts: number;
  timeSpentSeconds: number;
  courseId?: string | null;
  lessonId?: string | null;
  createdAt: string;
  puzzle?: SentencePuzzle | null;
}

interface DictationRecordWithItem {
  id: string;
  dictationId: string;
  userAnswer?: string | null;
  isCorrect: boolean;
  attempts: number;
  courseId?: string | null;
  lessonId?: string | null;
  createdAt: string;
  dictation?: DictationItem | null;
}

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ===== Sentence Puzzles =====

  async getSentences(
    courseId?: string,
    lessonId?: string,
    textbookId?: string,
    unitId?: string,
    limit?: number,
    preschoolCategory?: string,
    preschoolModule?: string,
  ): Promise<SentencePuzzle[]> {
    if (preschoolModule === 'words' && preschoolCategory) {
      return this.getPreschoolWordsAsPuzzles(preschoolCategory, limit);
    }
    if (preschoolModule === 'sentences' && preschoolCategory) {
      return this.getPreschoolSentencesAsPuzzles(preschoolCategory, limit);
    }
    if (preschoolModule === 'sentences') {
      return this.getPreschoolSentencesAsPuzzles(undefined, limit);
    }
    if (preschoolModule === 'alphabet') {
      return this.getPreschoolLettersAsPuzzles(limit);
    }
    if (preschoolModule === 'phonics') {
      return this.getPreschoolPhonicsAsPuzzles(preschoolCategory, limit);
    }
    const conditions = [];
    if (courseId) conditions.push(eq(sentencePuzzles.courseId, courseId));
    if (lessonId) conditions.push(eq(sentencePuzzles.lessonId, lessonId));
    if (textbookId) conditions.push(eq(sentencePuzzles.textbookId, textbookId));
    if (unitId) conditions.push(eq(sentencePuzzles.unitId, unitId));

    const baseQuery =
      conditions.length > 0
        ? this.db
            .select()
            .from(sentencePuzzles)
            .where(and(...conditions))
            .orderBy(sentencePuzzles.puzzleOrder)
        : this.db
            .select()
            .from(sentencePuzzles)
            .orderBy(sentencePuzzles.puzzleOrder);

    const query = limit && limit > 0 ? baseQuery.limit(limit) : baseQuery;

    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      sentence: row.sentence,
      translation: row.translation,
      grammarComponents: row.grammarComponents as SentencePuzzle['grammarComponents'],
      difficulty: row.difficulty,
      puzzleOrder: row.puzzleOrder,
      illustrationUrl: row.illustrationUrl ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      sentenceType: row.sentenceType ?? undefined,
      wordParses: (row.wordParses as WordParse[]) ?? [],
    }));
  }

  private async getPreschoolSentencesAsPuzzles(
    category?: string,
    limit?: number,
  ): Promise<SentencePuzzle[]> {
    const base = this.db
      .select()
      .from(preschoolSentences)
      .where(category ? eq(preschoolSentences.category, category) : undefined)
      .orderBy(preschoolSentences.sortOrder);
    const rows = await (limit && limit > 0 ? base.limit(limit) : base);
    return rows.map((row, idx: number) => ({
      id: `pre_s_${row.id}`,
      lessonId: `ps_${row.category}`,
      courseId: 'preschool',
      textbookId: undefined,
      unitId: undefined,
      sentence: row.sentence,
      translation: row.translation,
      grammarComponents: [],
      difficulty: 1,
      puzzleOrder: row.sortOrder ?? idx + 1,
      illustrationUrl: undefined,
      imageUrl: undefined,
      sentenceType: 'simple',
      wordParses: [],
    }));
  }

  private async getPreschoolWordsAsPuzzles(
    category: string,
    limit?: number,
  ): Promise<SentencePuzzle[]> {
    const base = this.db
      .select()
      .from(preschoolWords)
      .where(eq(preschoolWords.category, category))
      .orderBy(preschoolWords.sortOrder);
    const rows = await (limit && limit > 0 ? base.limit(limit) : base);
    return rows.map((row, idx: number) => ({
      id: `pre_w_${row.id}`,
      lessonId: `pw_${row.category}`,
      courseId: 'preschool',
      textbookId: undefined,
      unitId: undefined,
      sentence: row.word,
      translation: row.meaning,
      grammarComponents: [],
      difficulty: 1,
      puzzleOrder: row.sortOrder ?? idx + 1,
      illustrationUrl: undefined,
      imageUrl: undefined,
      sentenceType: 'word',
      wordParses: [],
    }));
  }

  private async getPreschoolLettersAsPuzzles(
    limit?: number,
  ): Promise<SentencePuzzle[]> {
    const base = this.db
      .select()
      .from(preschoolLetters)
      .orderBy(preschoolLetters.sortOrder);
    const rows = await (limit && limit > 0 ? base.limit(limit) : base);
    return rows.map((row, idx: number) => ({
      id: `pre_l_${row.id}`,
      lessonId: 'pl_all',
      courseId: 'preschool',
      textbookId: undefined,
      unitId: undefined,
      sentence: row.uppercase,
      translation: row.phonetic || `字母 ${row.letter}`,
      grammarComponents: [],
      difficulty: 1,
      puzzleOrder: row.sortOrder ?? idx + 1,
      illustrationUrl: undefined,
      imageUrl: undefined,
      sentenceType: 'letter',
      wordParses: [],
    }));
  }

  private async getPreschoolPhonicsAsPuzzles(
    lessonNo?: string,
    limit?: number,
  ): Promise<SentencePuzzle[]> {
    const base = this.db
      .select()
      .from(preschoolPhonics)
      .orderBy(preschoolPhonics.sortOrder);
    let rows = await base;
    const puzzles: SentencePuzzle[] = [];
    let order = 1;
    for (const row of rows) {
      const words = (row.words as Array<{ word: string; meaning: string; emoji: string }>) || [];
      for (const w of words) {
        puzzles.push({
          id: `pre_p_${row.lessonNo}_${w.word}`,
          lessonId: `pp_${row.lessonNo}`,
          courseId: 'preschool',
          textbookId: undefined,
          unitId: undefined,
          sentence: w.word,
          translation: w.meaning,
          grammarComponents: [],
          difficulty: 1,
          puzzleOrder: order,
          illustrationUrl: undefined,
          imageUrl: undefined,
          sentenceType: 'phonics',
          wordParses: [],
        });
        order += 1;
      }
    }
    if (limit && limit > 0 && puzzles.length > limit) {
      return puzzles.slice(0, limit);
    }
    return puzzles;
  }

  async getSentenceById(id: string): Promise<SentencePuzzle> {
    const rows = await this.db
      .select()
      .from(sentencePuzzles)
      .where(eq(sentencePuzzles.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('句子题不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      sentence: row.sentence,
      translation: row.translation,
      grammarComponents: row.grammarComponents as SentencePuzzle['grammarComponents'],
      difficulty: row.difficulty,
      puzzleOrder: row.puzzleOrder,
      illustrationUrl: row.illustrationUrl ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      sentenceType: row.sentenceType ?? undefined,
      wordParses: (row.wordParses as WordParse[]) ?? [],
    };
  }

  async submitSentenceResult(
    userId: string,
    dto: SubmitSentenceResultDto,
  ): Promise<{
    id: string;
    puzzleId: string;
    isCorrect: boolean;
    attempts: number;
    timeSpentSeconds: number;
    courseId?: string;
    lessonId?: string;
    createdAt: string;
  }> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const VIRTUAL_PREFIXES = [
      'pre_s_', 'pre_w_', 'pre_l_', 'pre_p_',
      'word_', 'typing_sentence_',
      'chinese_char_', 'math_topic_',
    ];
    const isVirtualPuzzle = VIRTUAL_PREFIXES.some(
      (prefix: string) => dto.puzzleId?.startsWith(prefix),
    );
    if (!dto.puzzleId || (!UUID_REGEX.test(dto.puzzleId) && !isVirtualPuzzle)) {
      throw new BadRequestException('puzzleId 格式无效');
    }

    if (!isVirtualPuzzle) {
      const puzzleExists = await this.db
        .select({ id: sentencePuzzles.id })
        .from(sentencePuzzles)
        .where(eq(sentencePuzzles.id, dto.puzzleId))
        .limit(1);

      if (puzzleExists.length === 0) {
        throw new NotFoundException('句子题不存在');
      }
    }

    if (isVirtualPuzzle) {
      return {
        id: dto.puzzleId,
        puzzleId: dto.puzzleId,
        isCorrect: dto.isCorrect,
        attempts: 1,
        timeSpentSeconds: dto.timeSpentSeconds,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        createdAt: new Date().toISOString(),
      };
    }

    const inserted = await this.db
      .insert(userSentenceRecords)
      .values({
        userProfile: userId,
        puzzleId: dto.puzzleId,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        textbookId: dto.textbookId,
        unitId: dto.unitId,
        isCorrect: dto.isCorrect,
        timeSpentSeconds: dto.timeSpentSeconds,
        practiceMode: dto.practiceMode,
        accuracyScore: dto.accuracyScore ?? 0,
        fluencyScore: dto.fluencyScore ?? 0,
        attempts: 1,
      })
      .returning({
        id: userSentenceRecords.id,
        puzzleId: userSentenceRecords.puzzleId,
        courseId: userSentenceRecords.courseId,
        lessonId: userSentenceRecords.lessonId,
        isCorrect: userSentenceRecords.isCorrect,
        attempts: userSentenceRecords.attempts,
        timeSpentSeconds: userSentenceRecords.timeSpentSeconds,
        createdAt: userSentenceRecords.createdAt,
      });

    const record = inserted[0];
    return {
      id: record.id,
      puzzleId: record.puzzleId,
      isCorrect: record.isCorrect,
      attempts: record.attempts,
      timeSpentSeconds: record.timeSpentSeconds,
      courseId: record.courseId ?? undefined,
      lessonId: record.lessonId ?? undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }

  // ===== Dictation Items =====

  async getDictations(
    courseId?: string,
    lessonId?: string,
    textbookId?: string,
    unitId?: string,
  ): Promise<DictationItem[]> {
    const conditions = [];
    if (courseId) conditions.push(eq(dictationItems.courseId, courseId));
    if (lessonId) conditions.push(eq(dictationItems.lessonId, lessonId));
    if (textbookId) conditions.push(eq(dictationItems.textbookId, textbookId));
    if (unitId) conditions.push(eq(dictationItems.unitId, unitId));

    const query =
      conditions.length > 0
        ? this.db
            .select()
            .from(dictationItems)
            .where(and(...conditions))
            .orderBy(dictationItems.itemOrder)
        : this.db
            .select()
            .from(dictationItems)
            .orderBy(dictationItems.itemOrder);

    const rows = await query;
    return rows.map((row) => ({
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      sentence: row.sentence,
      translation: row.translation,
      hint: row.hint ?? undefined,
      difficulty: row.difficulty,
      itemOrder: row.itemOrder,
    }));
  }

  async getDictationById(id: string): Promise<DictationItem> {
    const rows = await this.db
      .select()
      .from(dictationItems)
      .where(eq(dictationItems.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('听写题不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      sentence: row.sentence,
      translation: row.translation,
      hint: row.hint ?? undefined,
      difficulty: row.difficulty,
      itemOrder: row.itemOrder,
    };
  }

  async submitDictationResult(
    userId: string,
    dto: SubmitDictationResultDto,
  ): Promise<{
    id: string;
    dictationId: string;
    userAnswer?: string;
    isCorrect: boolean;
    attempts: number;
    courseId?: string;
    lessonId?: string;
    createdAt: string;
  }> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!dto.dictationId || !UUID_REGEX.test(dto.dictationId)) {
      throw new BadRequestException('dictationId 格式无效');
    }

    const dictationExists = await this.db
      .select({ id: dictationItems.id })
      .from(dictationItems)
      .where(eq(dictationItems.id, dto.dictationId))
      .limit(1);

    if (dictationExists.length === 0) {
      throw new NotFoundException('听写题不存在');
    }

    const inserted = await this.db
      .insert(userDictationRecords)
      .values({
        userProfile: userId,
        dictationId: dto.dictationId,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        userAnswer: dto.userAnswer,
        isCorrect: dto.isCorrect,
        attempts: 1,
      })
      .returning({
        id: userDictationRecords.id,
        dictationId: userDictationRecords.dictationId,
        courseId: userDictationRecords.courseId,
        lessonId: userDictationRecords.lessonId,
        userAnswer: userDictationRecords.userAnswer,
        isCorrect: userDictationRecords.isCorrect,
        attempts: userDictationRecords.attempts,
        createdAt: userDictationRecords.createdAt,
      });

    const record = inserted[0];
    return {
      id: record.id,
      dictationId: record.dictationId,
      userAnswer: record.userAnswer ?? undefined,
      isCorrect: record.isCorrect,
      attempts: record.attempts,
      courseId: record.courseId ?? undefined,
      lessonId: record.lessonId ?? undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }

  // ===== History =====

  async getSentenceHistory(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PagedResponse<SentenceRecordWithPuzzle>> {
    const offset = (page - 1) * pageSize;

    const countResult = await this.db
      .select({ count: count() })
      .from(userSentenceRecords)
      .where(eq(userSentenceRecords.userProfile, userId));

    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select()
      .from(userSentenceRecords)
      .where(eq(userSentenceRecords.userProfile, userId))
      .orderBy(desc(userSentenceRecords.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items: SentenceRecordWithPuzzle[] = rows.map((row) => ({
      id: row.id,
      puzzleId: row.puzzleId,
      isCorrect: row.isCorrect,
      attempts: row.attempts,
      timeSpentSeconds: row.timeSpentSeconds,
      courseId: row.courseId,
      lessonId: row.lessonId,
      createdAt: row.createdAt.toISOString(),
    }));

    // Fetch puzzle details for each record
    const puzzleIds: string[] = items
      .map((item: SentenceRecordWithPuzzle) => item.puzzleId)
      .filter((id: string) => Boolean(id));
    if (puzzleIds.length > 0) {
      const puzzleRows = await this.db
        .select()
        .from(sentencePuzzles)
        .where(inArray(sentencePuzzles.id, puzzleIds));

      const puzzleMap = new Map<string, SentencePuzzle>();
      for (const pr of puzzleRows) {
        puzzleMap.set(pr.id, {
          id: pr.id,
          lessonId: pr.lessonId ?? undefined,
          courseId: pr.courseId ?? undefined,
          sentence: pr.sentence,
          translation: pr.translation,
          grammarComponents:
            pr.grammarComponents as SentencePuzzle['grammarComponents'],
          difficulty: pr.difficulty,
          puzzleOrder: pr.puzzleOrder,
        });
      }
      for (const item of items) {
        item.puzzle = puzzleMap.get(item.puzzleId) ?? null;
      }
    }

    return { items, total, page, pageSize };
  }

  async getDictationHistory(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PagedResponse<DictationRecordWithItem>> {
    const offset = (page - 1) * pageSize;

    const countResult = await this.db
      .select({ count: count() })
      .from(userDictationRecords)
      .where(eq(userDictationRecords.userProfile, userId));

    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select()
      .from(userDictationRecords)
      .where(eq(userDictationRecords.userProfile, userId))
      .orderBy(desc(userDictationRecords.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items: DictationRecordWithItem[] = rows.map((row) => ({
      id: row.id,
      dictationId: row.dictationId,
      userAnswer: row.userAnswer,
      isCorrect: row.isCorrect,
      attempts: row.attempts,
      courseId: row.courseId,
      lessonId: row.lessonId,
      createdAt: row.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  // ===== Feedback =====

  async submitFeedback(
    userId: string,
    dto: SubmitFeedbackDto,
  ): Promise<{ id: string; puzzleId: string; errorType: string; status: string }> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!dto.puzzleId || !UUID_REGEX.test(dto.puzzleId)) {
      throw new BadRequestException('puzzleId 格式无效');
    }

    const puzzleExists = await this.db
      .select({ id: sentencePuzzles.id })
      .from(sentencePuzzles)
      .where(eq(sentencePuzzles.id, dto.puzzleId))
      .limit(1);

    if (puzzleExists.length === 0) {
      throw new NotFoundException('句子题不存在');
    }

    const inserted = await this.db
      .insert(sentenceFeedback)
      .values({
        userProfile: userId,
        puzzleId: dto.puzzleId,
        sentenceText: dto.sentenceText,
        translationText: dto.translationText,
        errorType: dto.errorType,
        description: dto.description,
        screenshotUrl: dto.screenshotUrl,
      })
      .returning({
        id: sentenceFeedback.id,
        puzzleId: sentenceFeedback.puzzleId,
        errorType: sentenceFeedback.errorType,
        status: sentenceFeedback.status,
      });

    const record = inserted[0];
    return {
      id: record.id,
      puzzleId: record.puzzleId,
      errorType: record.errorType,
      status: record.status ?? 'pending',
    };
  }

  // ===== Mastery Status =====

  async updateMastery(
    userId: string,
    dto: UpdateSentenceMasteryDto,
  ): Promise<{ puzzleId: string; status: string }> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!dto.puzzleId || !UUID_REGEX.test(dto.puzzleId)) {
      throw new BadRequestException('puzzleId 格式无效');
    }

    const existing = await this.db
      .select({ id: userSentenceRecords.id })
      .from(userSentenceRecords)
      .where(and(
        eq(userSentenceRecords.puzzleId, dto.puzzleId),
        sql`((${userSentenceRecords.userProfile}).user_id) = ${userId}`,
      ))
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(userSentenceRecords).values({
        userProfile: userId,
        puzzleId: dto.puzzleId,
        isCorrect: false,
        timeSpentSeconds: 0,
        masteryStatus: dto.status,
      });
      return { puzzleId: dto.puzzleId, status: dto.status };
    }

    await this.db
      .update(userSentenceRecords)
      .set({ masteryStatus: dto.status })
      .where(eq(userSentenceRecords.id, existing[0].id));

    return { puzzleId: dto.puzzleId, status: dto.status };
  }
}
