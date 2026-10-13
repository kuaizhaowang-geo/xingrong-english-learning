import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type {
  WrongWordItem,
  WrongSentenceItem,
  MasterStatus,
} from '@shared/api.interface';
import {
  userWordRecords,
  userSentenceRecords,
  wordItems,
  sentencePuzzles,
} from '@server/database/schema';

@Injectable()
export class WrongBookService {
  private readonly logger = new Logger(WrongBookService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ===== 单词错题本 =====

  async getWrongWords(
    userId: string,
    status: MasterStatus,
  ): Promise<WrongWordItem[]> {
    if (!status || (status !== 'mastered' && status !== 'unfamiliar')) {
      throw new BadRequestException('status 必须为 mastered 或 unfamiliar');
    }

    const rows = await this.db
      .select()
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.masterStatus, status),
        ),
      )
      .orderBy(desc(userWordRecords.updatedAt));

    if (rows.length === 0) {
      return [];
    }

    const wordIds: string[] = rows.map((row) => row.wordId);
    const wordRows = await this.db
      .select()
      .from(wordItems)
      .where(
        sql`${wordItems.id} = ANY(ARRAY[${sql.join(
          wordIds.map((id: string) => sql`${id}`),
          sql`, `,
        )}]::uuid[])`,
      );

    const wordMap = new Map<string, { word: string; phonetic?: string; meaning: string }>();
    for (const wr of wordRows) {
      wordMap.set(wr.id, {
        word: wr.word,
        phonetic: wr.phonetic ?? undefined,
        meaning: wr.meaning,
      });
    }

    const items: WrongWordItem[] = rows.map((row) => ({
      id: row.id,
      wordId: row.wordId,
      masterStatus: (row.masterStatus ?? 'unmarked') as MasterStatus,
      familiarity: row.familiarity ?? 0,
      lastReviewedAt: row.lastReviewedAt
        ? row.lastReviewedAt.toISOString()
        : undefined,
      word: wordMap.get(row.wordId),
    }));

    return items;
  }

  async updateWordStatus(
    userId: string,
    wordId: string,
    status: MasterStatus,
  ): Promise<WrongWordItem> {
    if (!status || !['mastered', 'unfamiliar', 'unmarked'].includes(status)) {
      throw new BadRequestException('status 必须为 mastered、unfamiliar 或 unmarked');
    }

    // Check if record exists
    const existing = await this.db
      .select()
      .from(userWordRecords)
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.wordId, wordId),
        ),
      )
      .limit(1);

    let row: typeof userWordRecords.$inferSelect;

    if (existing.length > 0) {
      const updated = await this.db
        .update(userWordRecords)
        .set({ masterStatus: status })
        .where(eq(userWordRecords.id, existing[0].id))
        .returning();
      row = updated[0];
    } else {
      // Create new record first, then update status
      const inserted = await this.db
        .insert(userWordRecords)
        .values({
          userProfile: userId,
          wordId: wordId,
          familiarity: 0,
          reviewCount: 0,
          correctCount: 0,
          ebbinghausLevel: 0,
          status: 'marked',
          masterStatus: status,
        })
        .returning();
      row = inserted[0];
    }

    // Fetch word info
    const wordRow = await this.db
      .select({ word: wordItems.word, phonetic: wordItems.phonetic, meaning: wordItems.meaning })
      .from(wordItems)
      .where(eq(wordItems.id, row.wordId))
      .limit(1);

    return {
      id: row.id,
      wordId: row.wordId,
      masterStatus: (row.masterStatus ?? 'unmarked') as MasterStatus,
      familiarity: row.familiarity ?? 0,
      lastReviewedAt: row.lastReviewedAt
        ? row.lastReviewedAt.toISOString()
        : undefined,
      word: wordRow[0]
        ? {
            word: wordRow[0].word,
            phonetic: wordRow[0].phonetic ?? undefined,
            meaning: wordRow[0].meaning,
          }
        : undefined,
    };
  }

  async batchDeleteWords(
    userId: string,
    wordIds: string[],
  ): Promise<void> {
    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      throw new BadRequestException('wordIds 不能为空数组');
    }

    // Soft delete: reset master_status to 'unmarked'
    await this.db
      .update(userWordRecords)
      .set({ masterStatus: 'unmarked' })
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          inArray(userWordRecords.wordId, wordIds),
        ),
      );
  }

  async clearWordsByStatus(
    userId: string,
    status: MasterStatus,
  ): Promise<void> {
    if (!status || (status !== 'mastered' && status !== 'unfamiliar')) {
      throw new BadRequestException('status 必须为 mastered 或 unfamiliar');
    }

    await this.db
      .update(userWordRecords)
      .set({ masterStatus: 'unmarked' })
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.masterStatus, status),
        ),
      );
  }

  // ===== 句子错题本 =====

  async getWrongSentences(
    userId: string,
    status: MasterStatus,
  ): Promise<WrongSentenceItem[]> {
    if (!status || (status !== 'mastered' && status !== 'unfamiliar')) {
      throw new BadRequestException('status 必须为 mastered 或 unfamiliar');
    }

    const rows = await this.db
      .select()
      .from(userSentenceRecords)
      .where(
        and(
          eq(userSentenceRecords.userProfile, userId),
          eq(userSentenceRecords.masterStatus, status),
        ),
      )
      .orderBy(desc(userSentenceRecords.updatedAt));

    if (rows.length === 0) {
      return [];
    }

    const puzzleIds: string[] = rows.map((row) => row.puzzleId);
    const puzzleRows = await this.db
      .select()
      .from(sentencePuzzles)
      .where(
        sql`${sentencePuzzles.id} = ANY(ARRAY[${sql.join(
          puzzleIds.map((id: string) => sql`${id}`),
          sql`, `,
        )}]::uuid[])`,
      );

    const puzzleMap = new Map<string, { sentence: string; translation: string }>();
    for (const pr of puzzleRows) {
      puzzleMap.set(pr.id, {
        sentence: pr.sentence,
        translation: pr.translation,
      });
    }

    const items: WrongSentenceItem[] = rows.map((row) => ({
      id: row.id,
      puzzleId: row.puzzleId,
      masterStatus: (row.masterStatus ?? 'unmarked') as MasterStatus,
      isCorrect: row.isCorrect ?? false,
      attempts: row.attempts ?? 0,
      sentence: puzzleMap.get(row.puzzleId),
    }));

    return items;
  }

  async updateSentenceStatus(
    userId: string,
    puzzleId: string,
    status: MasterStatus,
  ): Promise<WrongSentenceItem> {
    if (!status || !['mastered', 'unfamiliar', 'unmarked'].includes(status)) {
      throw new BadRequestException('status 必须为 mastered、unfamiliar 或 unmarked');
    }

    // Check if record exists
    const existing = await this.db
      .select()
      .from(userSentenceRecords)
      .where(
        and(
          eq(userSentenceRecords.userProfile, userId),
          eq(userSentenceRecords.puzzleId, puzzleId),
        ),
      )
      .limit(1);

    let row: typeof userSentenceRecords.$inferSelect;

    if (existing.length > 0) {
      const updated = await this.db
        .update(userSentenceRecords)
        .set({ masterStatus: status })
        .where(eq(userSentenceRecords.id, existing[0].id))
        .returning();
      row = updated[0];
    } else {
      // Create new record first, then update status
      const inserted = await this.db
        .insert(userSentenceRecords)
        .values({
          userProfile: userId,
          puzzleId: puzzleId,
          isCorrect: false,
          attempts: 0,
          masterStatus: status,
        })
        .returning();
      row = inserted[0];
    }

    // Fetch sentence info
    const puzzleRow = await this.db
      .select({ sentence: sentencePuzzles.sentence, translation: sentencePuzzles.translation })
      .from(sentencePuzzles)
      .where(eq(sentencePuzzles.id, row.puzzleId))
      .limit(1);

    return {
      id: row.id,
      puzzleId: row.puzzleId,
      masterStatus: (row.masterStatus ?? 'unmarked') as MasterStatus,
      isCorrect: row.isCorrect ?? false,
      attempts: row.attempts ?? 0,
      sentence: puzzleRow[0]
        ? {
            sentence: puzzleRow[0].sentence,
            translation: puzzleRow[0].translation,
          }
        : undefined,
    };
  }

  async batchDeleteSentences(
    userId: string,
    puzzleIds: string[],
  ): Promise<void> {
    if (!puzzleIds || !Array.isArray(puzzleIds) || puzzleIds.length === 0) {
      throw new BadRequestException('puzzleIds 不能为空数组');
    }

    await this.db
      .update(userSentenceRecords)
      .set({ masterStatus: 'unmarked' })
      .where(
        and(
          eq(userSentenceRecords.userProfile, userId),
          inArray(userSentenceRecords.puzzleId, puzzleIds),
        ),
      );
  }

  async clearSentencesByStatus(
    userId: string,
    status: MasterStatus,
  ): Promise<void> {
    if (!status || (status !== 'mastered' && status !== 'unfamiliar')) {
      throw new BadRequestException('status 必须为 mastered 或 unfamiliar');
    }

    await this.db
      .update(userSentenceRecords)
      .set({ masterStatus: 'unmarked' })
      .where(
        and(
          eq(userSentenceRecords.userProfile, userId),
          eq(userSentenceRecords.masterStatus, status),
        ),
      );
  }
}
