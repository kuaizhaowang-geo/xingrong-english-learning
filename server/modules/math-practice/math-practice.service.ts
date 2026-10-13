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
  inArray,
  type SQL,
} from 'drizzle-orm';
import type {
  MathPracticeItem,
  MathPracticeSession,
  MathWrongQuestion,
  MathKnowledgeMastery,
  MathPracticeStats,
  PagedResponse,
  SubmitMathAnswerDto,
  SubmitMathAnswerResponse,
} from '@shared/api.interface';
import {
  mathPracticeItems,
  mathPracticeSessions,
  mathPracticeRecords,
  mathWrongQuestions,
  mathKnowledgeMastery,
} from '@server/database/schema';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const DIFFICULTY_MAP: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function mapDifficulty(difficulty?: string): number | undefined {
  if (!difficulty) return undefined;
  return DIFFICULTY_MAP[difficulty.toLowerCase()];
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

function normalizeJudgeAnswer(answer: string): string {
  const normalized = answer.trim().toLowerCase();
  const trueValues = ['对', '正确', '是', 'true', 't', '√', '✓', 'yes', 'y', '1'];
  const falseValues = ['错', '错误', '否', 'false', 'f', '×', 'x', 'no', 'n', '0'];
  if (trueValues.includes(normalized)) return 'true';
  if (falseValues.includes(normalized)) return 'false';
  return normalized;
}

function toMathPracticeItem(
  row: typeof mathPracticeItems.$inferSelect,
): MathPracticeItem {
  return {
    id: row.id,
    topicId: row.topicId,
    textbookId: row.textbookId,
    unitId: row.unitId,
    question: row.question,
    options: (row.options as MathPracticeItem['options']) ?? undefined,
    correctAnswer: row.correctAnswer,
    solution: row.solution ?? undefined,
    difficulty: row.difficulty ?? 1,
    itemOrder: row.itemOrder ?? 0,
    itemType: row.itemType ?? 'choice',
    knowledgePoint: row.knowledgePoint ?? undefined,
  };
}

function toMathPracticeSession(
  row: typeof mathPracticeSessions.$inferSelect,
): MathPracticeSession {
  return {
    id: row.id,
    grade: row.grade ?? undefined,
    semester: row.semester ?? undefined,
    unitId: row.unitId ?? undefined,
    topicId: row.topicId ?? undefined,
    count: row.count,
    itemTypes: row.itemTypes ?? [],
    difficulty: row.difficulty ?? undefined,
    mode: row.mode,
    score: row.score,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    duration: row.duration,
    status: row.status as MathPracticeSession['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

function toMathWrongQuestion(
  row: typeof mathWrongQuestions.$inferSelect,
): MathWrongQuestion {
  return {
    id: row.id,
    itemId: row.itemId,
    questionText: row.questionText ?? '',
    correctAnswer: row.correctAnswer ?? '',
    lastWrongAnswer: row.lastWrongAnswer ?? '',
    wrongCount: row.wrongCount ?? 1,
    masterStatus: row.masterStatus ?? 'not_mastered',
    itemType: row.itemType ?? '',
    lastWrongAt: row.lastWrongAt.toISOString(),
  };
}

function toMathKnowledgeMastery(
  row: typeof mathKnowledgeMastery.$inferSelect,
): MathKnowledgeMastery {
  return {
    id: row.id,
    topicId: row.topicId,
    topicTitle: row.topicTitle ?? undefined,
    practiceCount: row.practiceCount ?? 0,
    correctCount: row.correctCount ?? 0,
    accuracy: Number(row.accuracy ?? 0),
    lastPracticeTime: row.lastPracticeTime
      ? row.lastPracticeTime.toISOString()
      : undefined,
    masteryLevel: row.masteryLevel ?? 'not_started',
  };
}

function getMasteryLevel(accuracy: number): string {
  if (accuracy >= 90) return 'proficient';
  if (accuracy >= 70) return 'basic_mastery';
  if (accuracy > 0) return 'learning';
  return 'not_started';
}

interface GetItemsParams {
  topicId?: string;
  itemType?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
}

interface GetRandomItemsParams {
  count: number;
  topicId?: string;
  itemTypes?: string[];
  difficulty?: string;
}

interface CreateSessionParams {
  grade?: string;
  semester?: string;
  unitId?: string;
  topicId?: string;
  count: number;
  itemTypes?: string[];
  difficulty?: string;
  mode: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface WrongQuestionsParams extends PaginationParams {
  status?: string;
  itemType?: string;
}

@Injectable()
export class MathPracticeService {
  private readonly logger = new Logger(MathPracticeService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ===== 题目列表 =====

  async getItems(
    params: GetItemsParams,
  ): Promise<PagedResponse<MathPracticeItem>> {
    const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Math.min(params.pageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const conditions = this.buildItemConditions(params);
    const offset = (page - 1) * pageSize;

    const baseQuery =
      conditions.length > 0
        ? this.db
            .select()
            .from(mathPracticeItems)
            .where(and(...conditions))
        : this.db.select().from(mathPracticeItems);

    const [itemsResult, totalResult] = await Promise.all([
      baseQuery
        .orderBy(mathPracticeItems.itemOrder)
        .limit(pageSize)
        .offset(offset),
      conditions.length > 0
        ? this.db
            .select({ count: count() })
            .from(mathPracticeItems)
            .where(and(...conditions))
        : this.db.select({ count: count() }).from(mathPracticeItems),
    ]);

    const items: MathPracticeItem[] = itemsResult.map(toMathPracticeItem);
    const total = parseInt(String(totalResult[0]?.count ?? '0'), 10);

    return { items, total, page, pageSize };
  }

  // ===== 随机抽题 =====

  async getRandomItems(
    params: GetRandomItemsParams,
  ): Promise<MathPracticeItem[]> {
    const conditions = this.buildItemConditions({
      topicId: params.topicId,
      difficulty: params.difficulty,
    });

    if (params.itemTypes && params.itemTypes.length > 0) {
      conditions.push(inArray(mathPracticeItems.itemType, params.itemTypes));
    }

    const limit = Math.min(params.count, 100);

    const query =
      conditions.length > 0
        ? this.db
            .select()
            .from(mathPracticeItems)
            .where(and(...conditions))
            .orderBy(sql`random()`)
            .limit(limit)
        : this.db
            .select()
            .from(mathPracticeItems)
            .orderBy(sql`random()`)
            .limit(limit);

    const rows = await query;
    return rows.map(toMathPracticeItem);
  }

  // ===== 练习会话 =====

  async createSession(
    userId: string,
    params: CreateSessionParams,
  ): Promise<{ session: MathPracticeSession; items: MathPracticeItem[] }> {
    const items: MathPracticeItem[] = await this.getRandomItems({
      count: params.count,
      topicId: params.topicId,
      itemTypes: params.itemTypes,
      difficulty: params.difficulty,
    });

    const actualCount = items.length;

    const inserted = await this.db
      .insert(mathPracticeSessions)
      .values({
        userId,
        grade: params.grade ?? null,
        semester: params.semester ?? null,
        unitId: params.unitId ?? null,
        topicId: params.topicId ?? null,
        count: actualCount,
        itemTypes: params.itemTypes ?? [],
        difficulty: params.difficulty ?? null,
        mode: params.mode,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        duration: 0,
        status: 'in_progress',
      })
      .returning();

    const session: MathPracticeSession = toMathPracticeSession(inserted[0]);
    return { session, items };
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitMathAnswerDto,
  ): Promise<SubmitMathAnswerResponse> {
    // 1. 验证会话
    const sessionRows = await this.db
      .select()
      .from(mathPracticeSessions)
      .where(eq(mathPracticeSessions.id, sessionId))
      .limit(1);

    if (sessionRows.length === 0) {
      throw new NotFoundException('练习会话不存在');
    }

    const session = sessionRows[0];
    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此会话');
    }
    if (session.status === 'completed') {
      throw new BadRequestException('会话已结束，无法继续答题');
    }

    // 2. 获取题目信息
    const itemRows = await this.db
      .select()
      .from(mathPracticeItems)
      .where(eq(mathPracticeItems.id, dto.itemId))
      .limit(1);

    if (itemRows.length === 0) {
      throw new NotFoundException('题目不存在');
    }

    const item = itemRows[0];
    const correctAnswer = item.correctAnswer;

    // 3. 判题
    const isCorrect = this.checkAnswer(
      dto.userAnswer,
      correctAnswer,
      item.itemType ?? '',
    );

    // 4. 写入答题记录
    await this.db.insert(mathPracticeRecords).values({
      sessionId,
      userId,
      itemId: dto.itemId,
      questionText: item.question,
      userAnswer: dto.userAnswer,
      correctAnswer,
      isCorrect,
      itemType: item.itemType,
      timeSpent: dto.timeSpent ?? 0,
    });

    // 5. 更新会话计数
    let updatedSessionRow: typeof mathPracticeSessions.$inferSelect;
    if (isCorrect) {
      const updated = await this.db
        .update(mathPracticeSessions)
        .set({
          correctCount: session.correctCount + 1,
          score: session.score + 10,
        })
        .where(eq(mathPracticeSessions.id, sessionId))
        .returning();
      updatedSessionRow = updated[0];
    } else {
      const updated = await this.db
        .update(mathPracticeSessions)
        .set({
          wrongCount: session.wrongCount + 1,
        })
        .where(eq(mathPracticeSessions.id, sessionId))
        .returning();
      updatedSessionRow = updated[0];

      // 6. 错题则加入错题本（upsert）
      await this.upsertWrongQuestion(userId, item, dto.userAnswer);
    }

    // 7. 更新知识点掌握度
    await this.updateKnowledgeMastery(userId, item.topicId, isCorrect);

    return {
      isCorrect,
      correctAnswer,
      solution: item.solution ?? undefined,
      session: toMathPracticeSession(updatedSessionRow),
    };
  }

  async finishSession(
    userId: string,
    sessionId: string,
    duration: number,
  ): Promise<MathPracticeSession> {
    const sessionRows = await this.db
      .select()
      .from(mathPracticeSessions)
      .where(eq(mathPracticeSessions.id, sessionId))
      .limit(1);

    if (sessionRows.length === 0) {
      throw new NotFoundException('练习会话不存在');
    }

    const session = sessionRows[0];
    if (session.userId !== userId) {
      throw new ForbiddenException('无权操作此会话');
    }

    if (session.status === 'completed') {
      return toMathPracticeSession(session);
    }

    const totalAnswered = session.correctCount + session.wrongCount;
    const score =
      totalAnswered > 0
        ? Math.round((session.correctCount / totalAnswered) * 100)
        : 0;

    const updated = await this.db
      .update(mathPracticeSessions)
      .set({
        status: 'completed',
        duration,
        score,
      })
      .where(eq(mathPracticeSessions.id, sessionId))
      .returning();

    return toMathPracticeSession(updated[0]);
  }

  async getMySessions(
    userId: string,
    params: PaginationParams,
  ): Promise<PagedResponse<MathPracticeSession>> {
    const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Math.min(params.pageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [itemsResult, totalResult] = await Promise.all([
      this.db
        .select()
        .from(mathPracticeSessions)
        .where(eq(mathPracticeSessions.userId, userId))
        .orderBy(desc(mathPracticeSessions.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(mathPracticeSessions)
        .where(eq(mathPracticeSessions.userId, userId)),
    ]);

    const items: MathPracticeSession[] = itemsResult.map(toMathPracticeSession);
    const total = parseInt(String(totalResult[0]?.count ?? '0'), 10);

    return { items, total, page, pageSize };
  }

  // ===== 错题本 =====

  async getWrongQuestions(
    userId: string,
    params: WrongQuestionsParams,
  ): Promise<PagedResponse<MathWrongQuestion>> {
    const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Math.min(params.pageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [eq(mathWrongQuestions.userId, userId)];

    if (params.status) {
      conditions.push(eq(mathWrongQuestions.masterStatus, params.status));
    }
    if (params.itemType) {
      conditions.push(eq(mathWrongQuestions.itemType, params.itemType));
    }

    const [itemsResult, totalResult] = await Promise.all([
      this.db
        .select()
        .from(mathWrongQuestions)
        .where(and(...conditions))
        .orderBy(desc(mathWrongQuestions.lastWrongAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(mathWrongQuestions)
        .where(and(...conditions)),
    ]);

    const items: MathWrongQuestion[] = itemsResult.map(toMathWrongQuestion);
    const total = parseInt(String(totalResult[0]?.count ?? '0'), 10);

    return { items, total, page, pageSize };
  }

  async markWrongQuestionMastered(
    userId: string,
    id: string,
  ): Promise<MathWrongQuestion> {
    const rows = await this.db
      .select()
      .from(mathWrongQuestions)
      .where(eq(mathWrongQuestions.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('错题记录不存在');
    }

    if (rows[0].userId !== userId) {
      throw new ForbiddenException('无权操作此记录');
    }

    const updated = await this.db
      .update(mathWrongQuestions)
      .set({ masterStatus: 'mastered' })
      .where(eq(mathWrongQuestions.id, id))
      .returning();

    return toMathWrongQuestion(updated[0]);
  }

  // ===== 学习统计 =====

  async getStats(userId: string): Promise<MathPracticeStats> {
    const [sessionStats, masteryStats, wrongStats] = await Promise.all([
      this.db
        .select({
          totalSessions: count(),
        })
        .from(mathPracticeSessions)
        .where(eq(mathPracticeSessions.userId, userId)),
      this.db
        .select({
          masteredCount: sql<number>`count(*) filter (where ${mathKnowledgeMastery.masteryLevel} = 'proficient')`,
          learningCount: sql<number>`count(*) filter (where ${mathKnowledgeMastery.masteryLevel} = 'learning' or ${mathKnowledgeMastery.masteryLevel} = 'basic_mastery')`,
        })
        .from(mathKnowledgeMastery)
        .where(eq(mathKnowledgeMastery.userId, userId)),
      this.db
        .select({
          wrongCount: sql<number>`count(*) filter (where ${mathWrongQuestions.masterStatus} = 'not_mastered')`,
        })
        .from(mathWrongQuestions)
        .where(eq(mathWrongQuestions.userId, userId)),
    ]);

    const completedSessions = await this.db
      .select({
        correctCount: mathPracticeSessions.correctCount,
        wrongCount: mathPracticeSessions.wrongCount,
      })
      .from(mathPracticeSessions)
      .where(
        and(
          eq(mathPracticeSessions.userId, userId),
          eq(mathPracticeSessions.status, 'completed'),
        ),
      );

    let totalCorrect = 0;
    let totalWrong = 0;
    for (const s of completedSessions) {
      totalCorrect += s.correctCount;
      totalWrong += s.wrongCount;
    }

    const totalPracticeCount = totalCorrect + totalWrong;
    const overallAccuracy =
      totalPracticeCount > 0
        ? Math.round((totalCorrect / totalPracticeCount) * 10000) / 100
        : 0;

    const masteredTopics = Number(masteryStats[0]?.masteredCount ?? 0);
    const learningTopics = Number(masteryStats[0]?.learningCount ?? 0);
    const wrongQuestionCount = Number(wrongStats[0]?.wrongCount ?? 0);

    return {
      totalPracticeCount,
      totalCorrectCount: totalCorrect,
      totalWrongCount: totalWrong,
      overallAccuracy,
      masteredTopics,
      learningTopics,
      wrongQuestionCount,
    };
  }

  // ===== 知识点掌握度 =====

  async getKnowledgeMastery(
    userId: string,
  ): Promise<MathKnowledgeMastery[]> {
    const rows = await this.db
      .select()
      .from(mathKnowledgeMastery)
      .where(eq(mathKnowledgeMastery.userId, userId))
      .orderBy(desc(mathKnowledgeMastery.lastPracticeTime));

    return rows.map(toMathKnowledgeMastery);
  }

  // ===== 内部辅助方法 =====

  private buildItemConditions(
    params: Partial<GetItemsParams & GetRandomItemsParams>,
  ): SQL[] {
    const conditions: SQL[] = [];
    if (params.topicId) {
      conditions.push(eq(mathPracticeItems.topicId, params.topicId));
    }
    if (params.itemType) {
      conditions.push(eq(mathPracticeItems.itemType, params.itemType));
    }
    if (params.difficulty) {
      const diffNum = mapDifficulty(params.difficulty);
      if (diffNum !== undefined) {
        conditions.push(eq(mathPracticeItems.difficulty, diffNum));
      }
    }
    return conditions;
  }

  private checkAnswer(
    userAnswer: string,
    correctAnswer: string,
    itemType: string,
  ): boolean {
    if (itemType === 'judge') {
      const userNormalized = normalizeJudgeAnswer(userAnswer);
      const correctNormalized = normalizeJudgeAnswer(correctAnswer);
      return userNormalized === correctNormalized;
    }
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
  }

  private async upsertWrongQuestion(
    userId: string,
    item: typeof mathPracticeItems.$inferSelect,
    userAnswer: string,
  ): Promise<void> {
    const existing = await this.db
      .select()
      .from(mathWrongQuestions)
      .where(
        and(
          eq(mathWrongQuestions.userId, userId),
          eq(mathWrongQuestions.itemId, item.id),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(mathWrongQuestions)
        .set({
          wrongCount: (existing[0].wrongCount ?? 0) + 1,
          masterStatus: 'not_mastered',
          lastWrongAt: new Date(),
          lastWrongAnswer: userAnswer,
        })
        .where(eq(mathWrongQuestions.id, existing[0].id));
    } else {
      await this.db.insert(mathWrongQuestions).values({
        userId,
        itemId: item.id,
        questionText: item.question,
        correctAnswer: item.correctAnswer,
        lastWrongAnswer: userAnswer,
        wrongCount: 1,
        masterStatus: 'not_mastered',
        itemType: item.itemType,
        lastWrongAt: new Date(),
      });
    }
  }

  private async updateKnowledgeMastery(
    userId: string,
    topicId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const existing = await this.db
      .select()
      .from(mathKnowledgeMastery)
      .where(
        and(
          eq(mathKnowledgeMastery.userId, userId),
          eq(mathKnowledgeMastery.topicId, topicId),
        ),
      )
      .limit(1);

    const now = new Date();

    if (existing.length > 0) {
      const record = existing[0];
      const newPracticeCount = (record.practiceCount ?? 0) + 1;
      const newCorrectCount =
        (record.correctCount ?? 0) + (isCorrect ? 1 : 0);
      const newAccuracy =
        newPracticeCount > 0
          ? (newCorrectCount / newPracticeCount) * 100
          : 0;
      const newMasteryLevel = getMasteryLevel(newAccuracy);

      await this.db
        .update(mathKnowledgeMastery)
        .set({
          practiceCount: newPracticeCount,
          correctCount: newCorrectCount,
          accuracy: String(newAccuracy),
          lastPracticeTime: now,
          masteryLevel: newMasteryLevel,
        })
        .where(eq(mathKnowledgeMastery.id, record.id));
    } else {
      const newAccuracy = isCorrect ? 100 : 0;
      const newMasteryLevel = getMasteryLevel(newAccuracy);

      await this.db.insert(mathKnowledgeMastery).values({
        userId,
        topicId,
        practiceCount: 1,
        correctCount: isCorrect ? 1 : 0,
        accuracy: String(newAccuracy),
        lastPracticeTime: now,
        masteryLevel: newMasteryLevel,
      });
    }
  }
}
