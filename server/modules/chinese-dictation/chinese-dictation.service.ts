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
import {
  eq,
  and,
  desc,
  count,
  sql,
  type SQL,
} from 'drizzle-orm';
import type {
  ChineseCharacter,
  ChineseDictationSession,
  ChineseWrongCharacter,
  ChineseDictationStats,
  PagedResponse,
  SubmitDictationAnswerDto,
  SubmitDictationAnswerResponse,
} from '@shared/api.interface';
import {
  chineseCharacters,
  chineseDictationSessions,
  chineseDictationRecords,
  chineseWrongCharacters,
} from '@server/database/schema';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v',
  Ā: 'a', Á: 'a', Ǎ: 'a', À: 'a',
  Ō: 'o', Ó: 'o', Ǒ: 'o', Ò: 'o',
  Ē: 'e', É: 'e', Ě: 'e', È: 'e',
  Ī: 'i', Í: 'i', Ǐ: 'i', Ì: 'i',
  Ū: 'u', Ú: 'u', Ǔ: 'u', Ù: 'u',
};

function stripTones(pinyin: string): string {
  return pinyin
    .split('')
    .map((ch: string) => TONE_MAP[ch] ?? ch)
    .join('')
    .toLowerCase();
}

function toChineseCharacter(row: typeof chineseCharacters.$inferSelect): ChineseCharacter {
  return {
    id: row.id,
    hanzi: row.character,
    pinyin: row.pinyin ?? '',
    strokes: row.strokes ?? 0,
    radical: row.radical ?? undefined,
    structure: row.structure ?? undefined,
    words: row.words ?? [],
    meaning: row.meaning ?? undefined,
    examples: row.examples ?? undefined,
    difficulty: row.difficulty ?? 'easy',
    grade: row.grade ?? undefined,
    unitId: row.unitId ?? undefined,
  };
}

function toDictationSession(
  row: typeof chineseDictationSessions.$inferSelect,
): ChineseDictationSession {
  return {
    id: row.id,
    grade: row.grade ?? undefined,
    semester: row.semester ?? undefined,
    unitId: row.unitId ?? undefined,
    count: row.count,
    difficulty: row.difficulty ?? undefined,
    mode: row.mode as ChineseDictationSession['mode'],
    score: row.score,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    duration: row.duration,
    status: row.status as ChineseDictationSession['status'],
    createdAt: row.createdAt.toISOString(),
  } as unknown as ChineseDictationSession;
}

function toWrongCharacter(
  row: typeof chineseWrongCharacters.$inferSelect,
): ChineseWrongCharacter {
  return {
    id: row.id,
    characterId: row.characterId,
    hanzi: row.hanzi,
    pinyin: row.pinyin ?? undefined,
    wrongCount: row.wrongCount ?? 1,
    masterStatus: row.masterStatus ?? 'not_mastered',
    lastWrongAt: row.lastWrongAt.toISOString(),
  };
}

interface GetCharactersParams {
  grade?: string;
  semester?: string;
  unitId?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
}

interface GetRandomParams {
  count: number;
  grade?: string;
  semester?: string;
  unitId?: string;
  difficulty?: string;
}

interface CreateSessionParams {
  grade?: string;
  semester?: string;
  unitId?: string;
  count: number;
  difficulty?: string;
  mode: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface WrongCharactersParams extends PaginationParams {
  status?: string;
}

@Injectable()
export class ChineseDictationService {
  private readonly logger = new Logger(ChineseDictationService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ===== 生字列表 =====

  async getCharacters(
    params: GetCharactersParams,
  ): Promise<PagedResponse<ChineseCharacter>> {
    const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Math.min(params.pageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const conditions = this.buildCharacterConditions(params);

    const offset = (page - 1) * pageSize;

    const baseQuery =
      conditions.length > 0
        ? this.db
            .select()
            .from(chineseCharacters)
            .where(and(...conditions))
        : this.db.select().from(chineseCharacters);

    const [itemsResult, totalResult] = await Promise.all([
      baseQuery
        .orderBy(chineseCharacters.grade, chineseCharacters.unitId, chineseCharacters.charOrder)
        .limit(pageSize)
        .offset(offset),
      conditions.length > 0
        ? this.db
            .select({ count: count() })
            .from(chineseCharacters)
            .where(and(...conditions))
        : this.db.select({ count: count() }).from(chineseCharacters),
    ]);

    const items: ChineseCharacter[] = itemsResult.map(toChineseCharacter);
    const total = parseInt(String(totalResult[0]?.count ?? '0'), 10);

    return { items, total, page, pageSize };
  }

  async getRandomCharacters(
    params: GetRandomParams,
  ): Promise<ChineseCharacter[]> {
    const conditions = this.buildCharacterConditions(params);
    const limit = Math.min(params.count, 100);

    // Use raw SQL for ORDER BY random() which Drizzle doesn't have a helper for
    const query =
      conditions.length > 0
        ? this.db
            .select()
            .from(chineseCharacters)
            .where(and(...conditions))
            .orderBy(sql`random()`)
            .limit(limit)
        : this.db
            .select()
            .from(chineseCharacters)
            .orderBy(sql`random()`)
            .limit(limit);

    const rows = await query;
    return rows.map(toChineseCharacter);
  }

  async getCharacterById(id: string): Promise<ChineseCharacter | null> {
    const rows = await this.db
      .select()
      .from(chineseCharacters)
      .where(eq(chineseCharacters.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return toChineseCharacter(rows[0]);
  }

  // ===== 听写会话 =====

  async createSession(
    userId: string,
    params: CreateSessionParams,
  ): Promise<{ session: ChineseDictationSession; characters: ChineseCharacter[] }> {
    const characters: ChineseCharacter[] = await this.getRandomCharacters({
      count: params.count,
      grade: params.grade,
      semester: params.semester,
      unitId: params.unitId,
      difficulty: params.difficulty,
    });

    const actualCount = characters.length;

    const inserted = await this.db
      .insert(chineseDictationSessions)
      .values({
        userId,
        grade: params.grade ?? null,
        semester: params.semester ?? null,
        unitId: params.unitId ?? null,
        count: actualCount,
        difficulty: params.difficulty ?? null,
        mode: params.mode,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        duration: 0,
        status: 'in_progress',
      })
      .returning();

    const session: ChineseDictationSession = toDictationSession(inserted[0]);
    return { session, characters };
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitDictationAnswerDto,
  ): Promise<SubmitDictationAnswerResponse> {
    // 1. Verify session exists and belongs to user
    const sessionRows = await this.db
      .select()
      .from(chineseDictationSessions)
      .where(eq(chineseDictationSessions.id, sessionId))
      .limit(1);

    if (sessionRows.length === 0) {
      throw new NotFoundException('听写会话不存在');
    }

    const session = sessionRows[0];
    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此会话');
    }
    if (session.status === 'completed') {
      throw new BadRequestException('会话已结束，无法继续答题');
    }

    // 2. Get character info
    const charRows = await this.db
      .select()
      .from(chineseCharacters)
      .where(eq(chineseCharacters.id, dto.characterId))
      .limit(1);

    if (charRows.length === 0) {
      throw new NotFoundException('生字不存在');
    }

    const character = toChineseCharacter(charRows[0]);
    const mode = session.mode;

    // 3. Determine correct answer and compare
    let isCorrect = false;
    let correctAnswer = '';

    if (mode === 'hanzi-to-pinyin') {
      // Compare pinyin, ignoring tone differences
      correctAnswer = character.pinyin;
      const userNormalized = stripTones(dto.userAnswer);
      const correctNormalized = stripTones(character.pinyin);
      isCorrect = userNormalized === correctNormalized;
    } else {
      // pinyin-to-hanzi / listen-write: compare Chinese character strictly
      correctAnswer = character.hanzi;
      isCorrect = dto.userAnswer.trim() === character.hanzi;
    }

    // 4. Insert record
    await this.db.insert(chineseDictationRecords).values({
      sessionId,
      userId,
      characterId: dto.characterId,
      hanzi: character.hanzi,
      pinyin: character.pinyin,
      userAnswer: dto.userAnswer,
      isCorrect,
      mode,
    });

    // 5. Update session counters
    if (isCorrect) {
      await this.db
        .update(chineseDictationSessions)
        .set({
          correctCount: session.correctCount + 1,
          score: session.score + 10,
        })
        .where(eq(chineseDictationSessions.id, sessionId));
    } else {
      await this.db
        .update(chineseDictationSessions)
        .set({
          wrongCount: session.wrongCount + 1,
        })
        .where(eq(chineseDictationSessions.id, sessionId));

      // 6. Write to wrong character book (upsert)
      await this.upsertWrongCharacter(userId, character);
    }

    return {
      isCorrect,
      correctAnswer,
      character,
    };
  }

  async finishSession(
    userId: string,
    sessionId: string,
    duration: number,
  ): Promise<ChineseDictationSession> {
    const sessionRows = await this.db
      .select()
      .from(chineseDictationSessions)
      .where(eq(chineseDictationSessions.id, sessionId))
      .limit(1);

    if (sessionRows.length === 0) {
      throw new NotFoundException('听写会话不存在');
    }

    const session = sessionRows[0];
    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此会话');
    }

    if (session.status === 'completed') {
      return toDictationSession(session);
    }

    const totalAnswered = session.correctCount + session.wrongCount;
    const score = totalAnswered > 0
      ? Math.round((session.correctCount / totalAnswered) * 100)
      : 0;

    const updated = await this.db
      .update(chineseDictationSessions)
      .set({
        status: 'completed',
        duration,
        score,
      })
      .where(eq(chineseDictationSessions.id, sessionId))
      .returning();

    return toDictationSession(updated[0]);
  }

  async getMySessions(
    userId: string,
    params: PaginationParams,
  ): Promise<PagedResponse<ChineseDictationSession>> {
    const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Math.min(params.pageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [itemsResult, totalResult] = await Promise.all([
      this.db
        .select()
        .from(chineseDictationSessions)
        .where(eq(chineseDictationSessions.userId, userId))
        .orderBy(desc(chineseDictationSessions.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(chineseDictationSessions)
        .where(eq(chineseDictationSessions.userId, userId)),
    ]);

    const items: ChineseDictationSession[] = itemsResult.map(toDictationSession);
    const total = parseInt(String(totalResult[0]?.count ?? '0'), 10);

    return { items, total, page, pageSize };
  }

  // ===== 错字本 =====

  async getWrongCharacters(
    userId: string,
    params: WrongCharactersParams,
  ): Promise<PagedResponse<ChineseWrongCharacter>> {
    const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Math.min(params.pageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const conditions = [eq(chineseWrongCharacters.userId, userId)];

    if (params.status) {
      conditions.push(eq(chineseWrongCharacters.masterStatus, params.status));
    }

    const [itemsResult, totalResult] = await Promise.all([
      this.db
        .select()
        .from(chineseWrongCharacters)
        .where(and(...conditions))
        .orderBy(desc(chineseWrongCharacters.lastWrongAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(chineseWrongCharacters)
        .where(and(...conditions)),
    ]);

    const items: ChineseWrongCharacter[] = itemsResult.map(toWrongCharacter);
    const total = parseInt(String(totalResult[0]?.count ?? '0'), 10);

    return { items, total, page, pageSize };
  }

  async markWrongCharacterMastered(
    userId: string,
    id: string,
  ): Promise<ChineseWrongCharacter> {
    const rows = await this.db
      .select()
      .from(chineseWrongCharacters)
      .where(eq(chineseWrongCharacters.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('错字记录不存在');
    }

    if (rows[0].userId !== userId) {
      throw new ForbiddenException('无权操作此记录');
    }

    const updated = await this.db
      .update(chineseWrongCharacters)
      .set({ masterStatus: 'mastered' })
      .where(eq(chineseWrongCharacters.id, id))
      .returning();

    return toWrongCharacter(updated[0]);
  }

  // ===== 学习统计 =====

  async getStats(userId: string): Promise<ChineseDictationStats> {
    const [sessionStats, wrongStats] = await Promise.all([
      this.db
        .select({
          totalSessions: count(),
        })
        .from(chineseDictationSessions)
        .where(eq(chineseDictationSessions.userId, userId)),
      this.db
        .select({
          masteredCount: sql<number>`count(*) filter (where ${chineseWrongCharacters.masterStatus} = 'mastered')`,
          wrongCount: sql<number>`count(*) filter (where ${chineseWrongCharacters.masterStatus} = 'not_mastered')`,
        })
        .from(chineseWrongCharacters)
        .where(eq(chineseWrongCharacters.userId, userId)),
    ]);

    // Calculate total correct/wrong from completed sessions
    const completedSessions = await this.db
      .select({
        correctCount: chineseDictationSessions.correctCount,
        wrongCount: chineseDictationSessions.wrongCount,
      })
      .from(chineseDictationSessions)
      .where(and(
        eq(chineseDictationSessions.userId, userId),
        eq(chineseDictationSessions.status, 'completed'),
      ));

    let totalCorrect = 0;
    let totalWrong = 0;
    for (const s of completedSessions) {
      totalCorrect += s.correctCount;
      totalWrong += s.wrongCount;
    }

    const totalAnswered = totalCorrect + totalWrong;
    const accuracy = totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 10000) / 100
      : 0;

    const totalSessions = parseInt(
      String(sessionStats[0]?.totalSessions ?? '0'),
      10,
    );
    const masteredCount = wrongStats[0]?.masteredCount ?? 0;
    const wrongCount = wrongStats[0]?.wrongCount ?? 0;

    return {
      totalSessions,
      totalCorrect,
      totalWrong,
      accuracy,
      masteredCount,
      wrongCount,
    };
  }

  // ===== 内部辅助方法 =====

  private buildCharacterConditions(
    params: Partial<GetCharactersParams & GetRandomParams>,
  ): SQL[] {
    const conditions: SQL[] = [];
    if (params.grade) {
      conditions.push(eq(chineseCharacters.grade, params.grade));
    }
    if (params.semester) {
      conditions.push(eq(chineseCharacters.semester, params.semester));
    }
    if (params.unitId) {
      conditions.push(eq(chineseCharacters.unitId, params.unitId));
    }
    if (params.difficulty) {
      conditions.push(eq(chineseCharacters.difficulty, params.difficulty));
    }
    return conditions;
  }

  private async upsertWrongCharacter(
    userId: string,
    character: ChineseCharacter,
  ): Promise<void> {
    // Check if already exists
    const existing = await this.db
      .select()
      .from(chineseWrongCharacters)
      .where(and(
        eq(chineseWrongCharacters.userId, userId),
        eq(chineseWrongCharacters.characterId, character.id),
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update wrong count and reset to not mastered
      await this.db
        .update(chineseWrongCharacters)
        .set({
          wrongCount: (existing[0].wrongCount ?? 0) + 1,
          masterStatus: 'not_mastered',
          lastWrongAt: new Date(),
        })
        .where(eq(chineseWrongCharacters.id, existing[0].id));
    } else {
      // Insert new wrong character
      await this.db.insert(chineseWrongCharacters).values({
        userId,
        characterId: character.id,
        hanzi: character.hanzi,
        pinyin: character.pinyin,
        wrongCount: 1,
        masterStatus: 'not_mastered',
        lastWrongAt: new Date(),
      });
    }
  }
}
