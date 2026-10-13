import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc } from 'drizzle-orm';
import { userSentenceFavorites, sentencePuzzles } from '@server/database/schema';
import type { SentencePuzzle, GrammarComponent, WordParse } from '@shared/api.interface';

@Injectable()
export class SentenceFavoritesService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getFavorites(userId: string): Promise<SentencePuzzle[]> {
    const rows = await this.db
      .select({
        id: sentencePuzzles.id,
        lessonId: sentencePuzzles.lessonId,
        courseId: sentencePuzzles.courseId,
        textbookId: sentencePuzzles.textbookId,
        unitId: sentencePuzzles.unitId,
        sentence: sentencePuzzles.sentence,
        translation: sentencePuzzles.translation,
        grammarComponents: sentencePuzzles.grammarComponents,
        difficulty: sentencePuzzles.difficulty,
        puzzleOrder: sentencePuzzles.puzzleOrder,
        illustrationUrl: sentencePuzzles.illustrationUrl,
        imageUrl: sentencePuzzles.imageUrl,
        sentenceType: sentencePuzzles.sentenceType,
        wordParses: sentencePuzzles.wordParses,
      })
      .from(userSentenceFavorites)
      .innerJoin(
        sentencePuzzles,
        eq(userSentenceFavorites.sentenceId, sentencePuzzles.id),
      )
      .where(eq(userSentenceFavorites.userProfile, userId))
      .orderBy(desc(userSentenceFavorites.createdAt));

    return rows.map((row): SentencePuzzle => ({
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      courseId: row.courseId ?? undefined,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      sentence: row.sentence,
      translation: row.translation,
      grammarComponents: (row.grammarComponents as GrammarComponent[]) ?? [],
      difficulty: row.difficulty ?? 1,
      puzzleOrder: row.puzzleOrder ?? 0,
      illustrationUrl: row.illustrationUrl ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      sentenceType: row.sentenceType ?? undefined,
      wordParses: (row.wordParses as WordParse[]) ?? undefined,
    }));
  }

  async addFavorite(userId: string, sentenceId: string): Promise<void> {
    const sentenceExists = await this.db
      .select({ id: sentencePuzzles.id })
      .from(sentencePuzzles)
      .where(eq(sentencePuzzles.id, sentenceId))
      .limit(1);
    if (sentenceExists.length === 0) {
      throw new NotFoundException('句子不存在');
    }

    await this.db
      .insert(userSentenceFavorites)
      .values({
        userProfile: userId,
        sentenceId,
      })
      .onConflictDoNothing();
  }

  async removeFavorite(userId: string, sentenceId: string): Promise<void> {
    await this.db
      .delete(userSentenceFavorites)
      .where(
        and(
          eq(userSentenceFavorites.userProfile, userId),
          eq(userSentenceFavorites.sentenceId, sentenceId),
        ),
      );
  }

  async checkFavorite(userId: string, sentenceId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: userSentenceFavorites.id })
      .from(userSentenceFavorites)
      .where(
        and(
          eq(userSentenceFavorites.userProfile, userId),
          eq(userSentenceFavorites.sentenceId, sentenceId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
