import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  textbooks,
  textbookUnits,
  chineseLessons,
  chinesePoems,
  mathTopics,
  mathPracticeItems,
  shapePuzzleItems,
  chineseCharacters,
  dictationSessions,
  dictationSessionWords,
  dictationWrongWords,
} from '@server/database/schema';
import { eq, and, asc, desc, inArray, sql, count } from 'drizzle-orm';
import type {
  Textbook,
  TextbookUnit,
  ChineseLesson,
  ChineseNewWord,
  ChineseWordItem,
  ChineseLessonAnalysisPoint,
  MathTopic,
  MathExample,
  MathPracticeItem,
  MathPracticeOption,
  ShapePuzzleItem,
  ShapePuzzlePiece,
  TextbookTreeItem,
  MentalArithmeticItem,
  MathShapeListResponse,
  ShapeInfo,
  MathPuzzleListItem,
  MathWordProblemItem,
  ChineseDictationItem,
  ChinesePoetry,
  ChinesePracticeRecord,
  ChineseDictationSession,
  ChineseDictationSessionWord,
  ChineseDictationWrongWord,
  ChineseDictationResult,
  PagedResponse,
} from '@shared/api.interface';

type TextbookSelect = typeof textbooks.$inferSelect;
type TextbookUnitSelect = typeof textbookUnits.$inferSelect;
type ChineseLessonSelect = typeof chineseLessons.$inferSelect;
type MathTopicSelect = typeof mathTopics.$inferSelect;
type MathPracticeItemSelect = typeof mathPracticeItems.$inferSelect;
type ShapePuzzleItemSelect = typeof shapePuzzleItems.$inferSelect;
type ChinesePoetrySelect = typeof chinesePoems.$inferSelect;
type DictationSessionSelect = typeof dictationSessions.$inferSelect;
type DictationSessionWordSelect = typeof dictationSessionWords.$inferSelect;
type DictationWrongWordSelect = typeof dictationWrongWords.$inferSelect;
type ChineseCharacterSelect = typeof chineseCharacters.$inferSelect;

@Injectable()
export class TextbooksService {
  private readonly logger = new Logger(TextbooksService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private mapTextbook(row: TextbookSelect): Textbook {
    return {
      id: row.id,
      title: row.title,
      publisher: row.publisher,
      grade: row.grade,
      semester: row.semester,
      coverImage: row.coverImage ?? undefined,
      description: row.description ?? undefined,
      totalUnits: row.totalUnits,
      sortOrder: row.sortOrder,
      isPublished: row.isPublished,
    };
  }

  private mapUnit(row: TextbookUnitSelect): TextbookUnit {
    return {
      id: row.id,
      textbookId: row.textbookId,
      title: row.title,
      topic: row.topic ?? undefined,
      unitOrder: row.unitOrder,
      keySentences: row.keySentences ?? [],
      keyWords: row.keyWords ?? [],
    };
  }

  private mapChineseLesson(row: ChineseLessonSelect): ChineseLesson {
    return {
      id: row.id,
      textbookId: row.textbookId,
      unitId: row.unitId,
      title: row.title,
      lessonOrder: row.lessonOrder,
      lessonType: row.lessonType,
      content: row.content,
      author: row.author ?? undefined,
      source: row.source ?? undefined,
      newWords: (row.newWords as ChineseNewWord[]) ?? [],
      wordList: (row.wordList as ChineseWordItem[]) ?? [],
      analysis: (row.analysis as ChineseLessonAnalysisPoint[]) ?? [],
    };
  }

  private mapChinesePoem(row: ChinesePoetrySelect): ChinesePoetry {
    const lines = row.content
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    return {
      id: row.id,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      title: row.title,
      author: row.author ?? undefined,
      dynasty: row.dynasty ?? undefined,
      content: lines.length > 0 ? lines : [row.content],
      translation: row.translation ?? undefined,
      annotation: row.annotation ?? undefined,
      appreciation: row.appreciation ?? undefined,
      poemOrder: row.poemOrder ?? 0,
      grade: row.grade ?? undefined,
    };
  }

  private mapMathTopic(row: MathTopicSelect): MathTopic {
    return {
      id: row.id,
      textbookId: row.textbookId,
      unitId: row.unitId,
      title: row.title,
      topicOrder: row.topicOrder,
      domain: row.domain,
      description: row.description,
      keyPoints: row.keyPoints,
      examples: (row.examples as MathExample[]) ?? [],
      practiceCount: row.practiceCount,
    };
  }

  private mapMathPracticeItem(row: MathPracticeItemSelect): MathPracticeItem {
    return {
      id: row.id,
      topicId: row.topicId,
      textbookId: row.textbookId,
      unitId: row.unitId,
      question: row.question,
      options: (row.options as MathPracticeOption[]) ?? undefined,
      correctAnswer: row.correctAnswer,
      solution: row.solution ?? undefined,
      difficulty: row.difficulty,
      itemOrder: row.itemOrder,
      itemType: row.itemType,
    };
  }

  private mapShapePuzzleItem(row: ShapePuzzleItemSelect): ShapePuzzleItem {
    return {
      id: row.id,
      topicId: row.topicId,
      textbookId: row.textbookId,
      unitId: row.unitId,
      title: row.title,
      puzzleOrder: row.puzzleOrder,
      puzzleType: row.puzzleType,
      targetShape: row.targetShape ?? undefined,
      pieces: (row.pieces as ShapePuzzlePiece[]) ?? [],
      description: row.description ?? undefined,
      difficulty: row.difficulty,
    };
  }

  async getList(params?: {
    grade?: string;
    subject?: string;
    semester?: string;
    publisher?: string;
  }): Promise<Textbook[]> {
    const cacheKey: string = `textbooks:list:${JSON.stringify(params ?? {})}`;
    const cached: Textbook[] | undefined = await this.cache.get<Textbook[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const conditions = [];
    conditions.push(eq(textbooks.isPublished, true));
    if (params?.grade) {
      conditions.push(eq(textbooks.grade, params.grade));
    }
    if (params?.subject) {
      conditions.push(eq(textbooks.subject, params.subject));
    }
    if (params?.semester) {
      conditions.push(eq(textbooks.semester, params.semester));
    }
    if (params?.publisher) {
      conditions.push(eq(textbooks.publisher, params.publisher));
    }

    const rows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(and(...conditions))
      .orderBy(asc(textbooks.sortOrder), asc(textbooks.grade));

    const result: Textbook[] = rows.map((row: TextbookSelect) => this.mapTextbook(row));
    await this.cache.set(cacheKey, result, 10 * 60 * 1000);
    return result;
  }

  async getDetail(id: string): Promise<{ textbook: Textbook; units: TextbookUnit[] }> {
    const textbookRows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(eq(textbooks.id, id));

    if (textbookRows.length === 0) {
      throw new NotFoundException('教材不存在');
    }

    const textbook: Textbook = this.mapTextbook(textbookRows[0]);

    const unitRows: TextbookUnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(eq(textbookUnits.textbookId, id))
      .orderBy(asc(textbookUnits.unitOrder));

    const units: TextbookUnit[] = unitRows.map((row: TextbookUnitSelect) => this.mapUnit(row));

    return { textbook, units };
  }

  async getUnitDetail(id: string, unitId: string): Promise<TextbookUnit> {
    // 先验证教材存在
    const textbookRows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(eq(textbooks.id, id));

    if (textbookRows.length === 0) {
      throw new NotFoundException('教材不存在');
    }

    const unitRows: TextbookUnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(and(
        eq(textbookUnits.id, unitId),
        eq(textbookUnits.textbookId, id),
      ));

    if (unitRows.length === 0) {
      throw new NotFoundException('单元不存在');
    }

    return this.mapUnit(unitRows[0]);
  }

  // ===== 教材树 =====

  async getTree(subject?: string): Promise<TextbookTreeItem[]> {
    const conditions = [];
    conditions.push(eq(textbooks.isPublished, true));
    if (subject) {
      conditions.push(eq(textbooks.subject, subject));
    }

    const textbookRows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(and(...conditions))
      .orderBy(asc(textbooks.sortOrder), asc(textbooks.grade));

    if (textbookRows.length === 0) {
      return [];
    }

    const textbookIds: string[] = textbookRows.map((row: TextbookSelect) => row.id);

    const allUnitRows: TextbookUnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(inArray(textbookUnits.textbookId, textbookIds))
      .orderBy(asc(textbookUnits.unitOrder));

    const unitsByTextbook = new Map<string, TextbookUnit[]>();
    for (const row of allUnitRows) {
      const unit: TextbookUnit = this.mapUnit(row);
      const list: TextbookUnit[] = unitsByTextbook.get(unit.textbookId) ?? [];
      list.push(unit);
      unitsByTextbook.set(unit.textbookId, list);
    }

    return textbookRows.map((row: TextbookSelect) => ({
      id: row.id,
      subject: row.subject ?? 'english',
      title: row.title,
      publisher: row.publisher,
      grade: row.grade,
      semester: row.semester,
      totalUnits: row.totalUnits,
      sortOrder: row.sortOrder,
      units: unitsByTextbook.get(row.id) ?? [],
    }));
  }

  // ===== 单元课文/知识点 =====

  async getUnitLessons(
    textbookId: string,
    unitId: string,
  ): Promise<{ chineseLessons: ChineseLesson[]; mathTopics: MathTopic[] }> {
    // 验证教材存在
    const textbookRows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(eq(textbooks.id, textbookId));

    if (textbookRows.length === 0) {
      throw new NotFoundException('教材不存在');
    }

    // 验证单元存在
    const unitRows: TextbookUnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(and(
        eq(textbookUnits.id, unitId),
        eq(textbookUnits.textbookId, textbookId),
      ));

    if (unitRows.length === 0) {
      throw new NotFoundException('单元不存在');
    }

    // 查询语文课文
    const lessonRows: ChineseLessonSelect[] = await this.db
      .select()
      .from(chineseLessons)
      .where(and(
        eq(chineseLessons.textbookId, textbookId),
        eq(chineseLessons.unitId, unitId),
      ))
      .orderBy(asc(chineseLessons.lessonOrder));

    const chineseLessonsList: ChineseLesson[] = lessonRows.map(
      (row: ChineseLessonSelect) => this.mapChineseLesson(row),
    );

    // 查询数学知识点
    const topicRows: MathTopicSelect[] = await this.db
      .select()
      .from(mathTopics)
      .where(and(
        eq(mathTopics.textbookId, textbookId),
        eq(mathTopics.unitId, unitId),
      ))
      .orderBy(asc(mathTopics.topicOrder));

    const mathTopicsList: MathTopic[] = topicRows.map(
      (row: MathTopicSelect) => this.mapMathTopic(row),
    );

    return { chineseLessons: chineseLessonsList, mathTopics: mathTopicsList };
  }

  // ===== 语文课文详情 =====

  async getChineseLesson(lessonId: string): Promise<ChineseLesson> {
    const rows: ChineseLessonSelect[] = await this.db
      .select()
      .from(chineseLessons)
      .where(eq(chineseLessons.id, lessonId));

    if (rows.length === 0) {
      throw new NotFoundException('课文不存在');
    }

    return this.mapChineseLesson(rows[0]);
  }

  // ===== 数学知识点详情 =====

  async getMathTopic(
    topicId: string,
  ): Promise<MathTopic & { practiceItems: MathPracticeItem[]; shapePuzzles: ShapePuzzleItem[] }> {
    const topicRows: MathTopicSelect[] = await this.db
      .select()
      .from(mathTopics)
      .where(eq(mathTopics.id, topicId));

    if (topicRows.length === 0) {
      throw new NotFoundException('知识点不存在');
    }

    const topic: MathTopic = this.mapMathTopic(topicRows[0]);

    // 查询练习题
    const practiceRows: MathPracticeItemSelect[] = await this.db
      .select()
      .from(mathPracticeItems)
      .where(eq(mathPracticeItems.topicId, topicId))
      .orderBy(asc(mathPracticeItems.itemOrder));

    const practiceItems: MathPracticeItem[] = practiceRows.map(
      (row: MathPracticeItemSelect) => this.mapMathPracticeItem(row),
    );

    // 查询图形拼图题
    const puzzleRows: ShapePuzzleItemSelect[] = await this.db
      .select()
      .from(shapePuzzleItems)
      .where(eq(shapePuzzleItems.topicId, topicId))
      .orderBy(asc(shapePuzzleItems.puzzleOrder));

    const shapePuzzles: ShapePuzzleItem[] = puzzleRows.map(
      (row: ShapePuzzleItemSelect) => this.mapShapePuzzleItem(row),
    );

    return { ...topic, practiceItems, shapePuzzles };
  }

  // ===== 语文练习 - 课文列表 =====

  async getChineseLessonsList(params: {
    textbookId?: string;
    unitId?: string;
    lessonType?: string;
  }): Promise<ChineseLesson[]> {
    const conditions = [];
    if (params.textbookId) {
      conditions.push(eq(chineseLessons.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(chineseLessons.unitId, params.unitId));
    }
    if (params.lessonType) {
      conditions.push(eq(chineseLessons.lessonType, params.lessonType));
    }

    const baseQuery = conditions.length > 0
      ? this.db.select().from(chineseLessons).where(and(...conditions))
      : this.db.select().from(chineseLessons);

    const rows: ChineseLessonSelect[] = await baseQuery
      .orderBy(asc(chineseLessons.lessonOrder));

    return rows.map((row: ChineseLessonSelect) => this.mapChineseLesson(row));
  }

  // ===== 语文练习 - 生字列表（去重） =====

  async getChineseCharacters(params: {
    textbookId?: string;
    unitId?: string;
    lessonId?: string;
  }): Promise<ChineseNewWord[]> {
    const conditions = [];
    if (params.textbookId) {
      conditions.push(eq(chineseLessons.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(chineseLessons.unitId, params.unitId));
    }
    if (params.lessonId) {
      conditions.push(eq(chineseLessons.id, params.lessonId));
    }

    const seen = new Set<string>();
    const result: ChineseNewWord[] = [];

    const charConditions = [];
    if (params.textbookId) {
      charConditions.push(eq(chineseCharacters.textbookId, params.textbookId));
    }
    if (params.unitId) {
      charConditions.push(eq(chineseCharacters.unitId, params.unitId));
    }
    if (charConditions.length > 0) {
      const charRows: ChineseCharacterSelect[] = await this.db
        .select()
        .from(chineseCharacters)
        .where(and(...charConditions))
        .orderBy(asc(chineseCharacters.charOrder));
      for (const row of charRows) {
        if (seen.has(row.character)) continue;
        seen.add(row.character);
        result.push({
          word: row.character,
          pinyin: row.pinyin || '',
          radical: row.radical || '',
          strokes: row.strokes || 0,
          meaning: row.meaning || '',
          partOfSpeech: undefined,
        });
      }
      if (result.length > 0) return result;
    }

    const baseQuery = conditions.length > 0
      ? this.db.select().from(chineseLessons).where(and(...conditions))
      : this.db.select().from(chineseLessons);

    const rows: ChineseLessonSelect[] = await baseQuery
      .orderBy(asc(chineseLessons.lessonOrder));

    for (const row of rows) {
      const words = (row.newWords as ChineseNewWord[]) ?? [];
      for (const w of words) {
        if (!seen.has(w.word)) {
          seen.add(w.word);
          result.push(w);
        }
      }
    }

    return result;
  }

  // ===== 语文练习 - 听写题目（随机抽取） =====

  async getChineseDictation(params: {
    count: number;
    textbookId?: string;
  }): Promise<ChineseDictationItem[]> {
    const allChars: ChineseNewWord[] = await this.getChineseCharacters({
      textbookId: params.textbookId,
    });

    if (allChars.length === 0) return [];

    const count = Math.min(params.count, allChars.length);

    // Fisher-Yates shuffle
    const shuffled = [...allChars];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count).map((w: ChineseNewWord) => ({
      character: w.word,
      pinyin: w.pinyin,
      meaning: w.meaning,
    }));
  }

  // ===== 语文练习 - 古诗列表（使用 chinese_poems 表） =====

  async getChinesePoetry(params: {
    textbookId?: string;
    grade?: string;
    unitId?: string;
    limit?: number;
  }): Promise<ChinesePoetry[]> {
    const conditions = [];
    if (params.textbookId) {
      conditions.push(eq(chinesePoems.textbookId, params.textbookId));
    }
    if (params.unitId) {
      conditions.push(eq(chinesePoems.unitId, params.unitId));
    }
    if (params.grade) {
      conditions.push(eq(chinesePoems.grade, params.grade));
    }

    const baseQuery = conditions.length > 0
      ? this.db
          .select()
          .from(chinesePoems)
          .where(and(...conditions))
          .orderBy(asc(chinesePoems.poemOrder))
      : this.db
          .select()
          .from(chinesePoems)
          .orderBy(asc(chinesePoems.poemOrder));

    const rows: ChinesePoetrySelect[] = params.limit && params.limit > 0
      ? await baseQuery.limit(params.limit)
      : await baseQuery;

    // 降级方案：chinese_poems 表为空时，从课文中取 poetry 类型
    if (rows.length === 0) {
      const lessonConditions = [];
      if (params.textbookId) {
        lessonConditions.push(eq(chineseLessons.textbookId, params.textbookId));
      }
      lessonConditions.push(eq(chineseLessons.lessonType, 'poetry'));

      const lessonRows: ChineseLessonSelect[] = await this.db
        .select()
        .from(chineseLessons)
        .where(and(...lessonConditions))
        .orderBy(asc(chineseLessons.lessonOrder))
        .limit(10);

      if (lessonRows.length > 0) {
        return lessonRows.map((row: ChineseLessonSelect, idx: number) => {
          const lines = row.content
            .split(/\r?\n\r?\n/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          return {
            id: row.id,
            textbookId: row.textbookId,
            unitId: row.unitId,
            title: row.title,
            author: row.author ?? undefined,
            content: lines,
            poemOrder: row.lessonOrder + idx,
            grade: params.grade,
          };
        });
      }
    }

    return rows.map((row: ChinesePoetrySelect) => this.mapChinesePoem(row));
  }

  // ===== 语文练习 - 保存练习记录 =====

  async savePracticeRecord(
    userId: string,
    dto: { practiceType: string; lessonId?: string; correctCount: number; totalCount: number; duration: number },
  ): Promise<ChinesePracticeRecord> {
    // 目前不新增表，直接返回成功记录；后续可接入 user_dictation_records 或新建表
    const now = new Date();
    return {
      id: `temp_${Date.now()}`,
      userId,
      practiceType: dto.practiceType,
      lessonId: dto.lessonId,
      correctCount: dto.correctCount,
      totalCount: dto.totalCount,
      duration: dto.duration,
      createdAt: now.toISOString(),
    };
  }

  // ===== 数学练习：口算题 =====

  async getMentalArithmetic(params: {
    count: number;
    difficulty: number;
    operations: string[];
    textbookId?: string;
    unitId?: string;
  }): Promise<MentalArithmeticItem[]> {
    const { count, difficulty, operations, textbookId, unitId } = params;
    const safeCount = Math.min(Math.max(count, 1), 100);
    const safeDiff = Math.min(Math.max(difficulty, 1), 5);
    const validOps = operations.filter((op: string) =>
      ['add', 'subtract', 'multiply', 'divide'].includes(op),
    );
    const opsToUse = validOps.length > 0 ? validOps : ['add', 'subtract'];

    // 先尝试从数据库随机抽取
    const conditions = [
      eq(mathPracticeItems.difficulty, safeDiff),
      eq(mathPracticeItems.itemType, 'oral'),
    ];
    if (textbookId) conditions.push(eq(mathPracticeItems.textbookId, textbookId));
    if (unitId) conditions.push(eq(mathPracticeItems.unitId, unitId));

    const dbRows: MathPracticeItemSelect[] = await this.db
      .select()
      .from(mathPracticeItems)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(safeCount);

    const dbItems: MentalArithmeticItem[] = dbRows.map((row: MathPracticeItemSelect) => ({
      id: row.id,
      question: row.question,
      answer: row.correctAnswer,
      itemType: (row.itemType === 'choice' ? 'choice' : 'fillblank') as 'fillblank' | 'choice',
      options: (row.options as MathPracticeOption[]) ?? undefined,
      difficulty: row.difficulty,
      operation: this.inferOperation(row.question),
    }));

    // 根据 operation 过滤一下，尽量匹配用户选择
    const filtered = dbItems.filter((item: MentalArithmeticItem) =>
      opsToUse.includes(item.operation),
    );

    if (filtered.length >= safeCount) {
      return filtered.slice(0, safeCount);
    }

    // 数量不足时动态生成
    const needed = safeCount - filtered.length;
    const generated: MentalArithmeticItem[] = this.generateMentalArithmetic(
      needed,
      safeDiff,
      opsToUse,
    );

    return [...filtered, ...generated];
  }

  private inferOperation(question: string): 'add' | 'subtract' | 'multiply' | 'divide' {
    if (question.includes('×') || question.includes('*')) return 'multiply';
    if (question.includes('÷') || question.includes('/')) return 'divide';
    // 减法：包含明确的减号符号（半角或全角），且不是负号开头的场景
    if (/\d[−-]/.test(question)) return 'subtract';
    if (question.includes('+') || question.includes('＋')) return 'add';
    return 'add';
  }

  private generateMentalArithmetic(
    count: number,
    difficulty: number,
    operations: string[],
  ): MentalArithmeticItem[] {
    const items: MentalArithmeticItem[] = [];

    // 根据难度设置数字范围
    const ranges: Record<number, { add: [number, number]; mul: [number, number] }> = {
      1: { add: [1, 20], mul: [1, 9] },
      2: { add: [10, 100], mul: [2, 9] },
      3: { add: [10, 500], mul: [2, 20] },
      4: { add: [100, 1000], mul: [5, 50] },
      5: { add: [100, 9999], mul: [10, 99] },
    };
    const range = ranges[difficulty] || ranges[1];

    for (let i = 0; i < count; i += 1) {
      const op = operations[i % operations.length];
      let a = 0;
      let b = 0;
      let answer = 0;
      let question = '';

      if (op === 'add') {
        a = this.randInt(range.add[0], range.add[1]);
        b = this.randInt(range.add[0], range.add[1]);
        answer = a + b;
        question = `${a} + ${b} =`;
      } else if (op === 'subtract') {
        a = this.randInt(range.add[0], range.add[1]);
        b = this.randInt(range.add[0], a);
        answer = a - b;
        question = `${a} − ${b} =`;
      } else if (op === 'multiply') {
        a = this.randInt(range.mul[0], range.mul[1]);
        b = this.randInt(range.mul[0], range.mul[1]);
        answer = a * b;
        question = `${a} × ${b} =`;
      } else {
        // divide: 确保整除
        b = this.randInt(Math.max(2, range.mul[0]), range.mul[1]);
        const quotient = this.randInt(range.mul[0], range.mul[1]);
        a = b * quotient;
        answer = quotient;
        question = `${a} ÷ ${b} =`;
      }

      items.push({
        id: `gen-${Date.now()}-${i}`,
        question,
        answer: String(answer),
        itemType: 'fillblank',
        difficulty,
        operation: op as 'add' | 'subtract' | 'multiply' | 'divide',
      });
    }

    // 打乱顺序
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return items;
  }

  private randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ===== 数学练习：图形列表 =====

  async getShapes(): Promise<MathShapeListResponse> {
    // 尝试从数据库提取图形相关拼图作为 3D 图形数据来源
    const puzzleRows: ShapePuzzleItemSelect[] = await this.db
      .select()
      .from(shapePuzzleItems)
      .limit(50);

    const shapesFromDb = new Map<string, ShapeInfo>();
    for (const row of puzzleRows) {
      if (row.targetShape && !shapesFromDb.has(row.targetShape)) {
        shapesFromDb.set(row.targetShape, {
          id: `db-${row.id}`,
          name: row.targetShape,
          shapeType: '3d',
          properties: {
            拼图块数: row.pieces ? (row.pieces as ShapePuzzlePiece[]).length : 0,
            难度: row.difficulty,
          },
          description: row.description ?? '',
        });
      }
    }

    // 内置 2D 图形（保底数据）
    const shapes2d: ShapeInfo[] = [
      { id: 'square', name: '正方形', shapeType: '2d',
        properties: { 边数: 4, 顶点数: 4, 内角和: '360°', 对称轴: 4 },
        description: '四条边都相等，四个角都是直角的四边形。' },
      { id: 'rectangle', name: '长方形', shapeType: '2d',
        properties: { 边数: 4, 顶点数: 4, 内角和: '360°', 对称轴: 2 },
        description: '对边相等，四个角都是直角的四边形。' },
      { id: 'triangle', name: '三角形', shapeType: '2d',
        properties: { 边数: 3, 顶点数: 3, 内角和: '180°', 高: 3 },
        description: '由三条线段首尾相连围成的封闭图形。' },
      { id: 'circle', name: '圆形', shapeType: '2d',
        properties: { 半径: 'r', 直径: '2r', 周长: '2πr', 面积: 'πr²' },
        description: '平面上到定点距离等于定长的所有点组成的图形。' },
      { id: 'parallelogram', name: '平行四边形', shapeType: '2d',
        properties: { 边数: 4, 顶点数: 4, 对边: '平行且相等', 对角线: '互相平分' },
        description: '两组对边分别平行的四边形。' },
      { id: 'trapezoid', name: '梯形', shapeType: '2d',
        properties: { 边数: 4, 顶点数: 4, 平行边数: 2, 高: '两底之间的距离' },
        description: '只有一组对边平行的四边形。' },
    ];

    // 内置 3D 图形（保底数据）
    const shapes3d: ShapeInfo[] = [
      { id: 'cube', name: '正方体', shapeType: '3d',
        properties: { 面数: 6, 棱数: 12, 顶点数: 8, 面的形状: '正方形' },
        description: '由六个完全相同的正方形围成的立体图形。' },
      { id: 'cuboid', name: '长方体', shapeType: '3d',
        properties: { 面数: 6, 棱数: 12, 顶点数: 8, 面的形状: '长方形' },
        description: '由六个长方形围成的立体图形，相对的面完全相同。' },
      { id: 'cylinder', name: '圆柱', shapeType: '3d',
        properties: { 面数: 3, 底面形状: '圆形', 侧面展开: '长方形', 高: '两底之间的距离' },
        description: '以矩形的一边为轴旋转一周所得到的立体图形。' },
      { id: 'cone', name: '圆锥', shapeType: '3d',
        properties: { 面数: 2, 底面形状: '圆形', 顶点数: 1, 侧面展开: '扇形' },
        description: '以直角三角形的一条直角边为轴旋转一周所得到的立体图形。' },
      { id: 'sphere', name: '球', shapeType: '3d',
        properties: { 面数: 1, 半径: 'r', 直径: '2r', 表面积: '4πr²' },
        description: '空间中到定点距离等于定长的所有点组成的图形。' },
      { id: 'prism', name: '棱柱', shapeType: '3d',
        properties: { 底面: '多边形', 侧面: '平行四边形', 顶点数: '2n', 棱数: '3n' },
        description: '有两个面互相平行，其余各面都是四边形的多面体。' },
    ];

    // 合并数据库中提取的图形（如果名称不重复）
    const extra3d: ShapeInfo[] = [];
    const existingNames = new Set(shapes3d.map((s: ShapeInfo) => s.name));
    for (const shape of shapesFromDb.values()) {
      if (!existingNames.has(shape.name)) {
        extra3d.push(shape);
      }
    }

    return {
      shapes2d,
      shapes3d: [...shapes3d, ...extra3d],
    };
  }

  // ===== 数学练习：拼图题列表 & 详情 =====

  async getPuzzleList(params: {
    textbookId?: string;
    unitId?: string;
    difficulty?: number;
  }): Promise<MathPuzzleListItem[]> {
    const { textbookId, unitId, difficulty } = params;
    const conditions = [];
    if (textbookId) conditions.push(eq(shapePuzzleItems.textbookId, textbookId));
    if (unitId) conditions.push(eq(shapePuzzleItems.unitId, unitId));
    if (difficulty !== undefined) conditions.push(eq(shapePuzzleItems.difficulty, difficulty));

    const rows: ShapePuzzleItemSelect[] = conditions.length > 0
      ? await this.db
          .select()
          .from(shapePuzzleItems)
          .where(and(...conditions))
          .orderBy(asc(shapePuzzleItems.puzzleOrder))
      : await this.db
          .select()
          .from(shapePuzzleItems)
          .orderBy(asc(shapePuzzleItems.puzzleOrder));

    return rows.map((row: ShapePuzzleItemSelect) => ({
      id: row.id,
      title: row.title,
      targetShape: row.targetShape ?? undefined,
      difficulty: row.difficulty,
      description: row.description ?? undefined,
    }));
  }

  async getPuzzleDetail(id: string): Promise<ShapePuzzleItem> {
    const rows: ShapePuzzleItemSelect[] = await this.db
      .select()
      .from(shapePuzzleItems)
      .where(eq(shapePuzzleItems.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('拼图题不存在');
    }

    return this.mapShapePuzzleItem(rows[0]);
  }

  // ===== 数学练习：应用题列表 =====

  // ===== 生字听写 =====

  private stripTones(pinyin: string): string {
    const toneMap: Record<string, string> = {
      ā: 'a', á: 'a', ǎ: 'a', à: 'a',
      ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
      ē: 'e', é: 'e', ě: 'e', è: 'e',
      ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
      ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
      ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v',
      Ā: 'A', Á: 'A', Ǎ: 'A', À: 'A',
      Ō: 'O', Ó: 'O', Ǒ: 'O', Ò: 'O',
      Ē: 'E', É: 'E', Ě: 'E', È: 'E',
      Ī: 'I', Í: 'I', Ǐ: 'I', Ì: 'I',
      Ū: 'U', Ú: 'U', Ǔ: 'U', Ù: 'U',
    };
    let result = '';
    for (const ch of pinyin) {
      result += toneMap[ch] ?? ch;
    }
    return result;
  }

  private extractPostgresErrorCode(error: unknown): string | undefined {
    let current: unknown = error;
    for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
      const { code, cause } = current as { code?: unknown; cause?: unknown };
      if (typeof code === 'string') return code;
      current = cause;
    }
    return undefined;
  }

  private mapDictationSession(row: DictationSessionSelect): ChineseDictationSession {
    return {
      id: row.id,
      userId: row.userId,
      subject: row.subject,
      grade: row.grade,
      semester: row.semester,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      mode: row.mode as ChineseDictationSession['mode'],
      speed: row.speed as ChineseDictationSession['speed'],
      totalCount: row.totalCount,
      correctCount: row.correctCount ?? undefined,
      score: row.score ?? undefined,
      durationSeconds: row.durationSeconds ?? undefined,
      status: row.status as ChineseDictationSession['status'],
      startedAt: row.startedAt ? row.startedAt.toISOString() : undefined,
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapDictationSessionWord(
    row: DictationSessionWordSelect & {
      radical?: string | null;
      strokes?: number | null;
      meaning?: string | null;
      examples?: string | null;
    },
  ): ChineseDictationSessionWord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      charId: row.charId,
      character: row.character,
      pinyin: row.pinyin ?? undefined,
      wordOrder: row.wordOrder,
      userAnswer: row.userAnswer ?? undefined,
      isCorrect: row.isCorrect ?? undefined,
      answeredAt: row.answeredAt ? row.answeredAt.toISOString() : undefined,
      radical: row.radical ?? undefined,
      strokes: row.strokes ?? undefined,
      meaning: row.meaning ?? undefined,
      examples: row.examples ?? undefined,
    };
  }

  private mapDictationWrongWord(
    row: DictationWrongWordSelect & {
      radical?: string | null;
      strokes?: number | null;
      meaning?: string | null;
      examples?: string | null;
    },
  ): ChineseDictationWrongWord {
    return {
      id: row.id,
      userId: row.userId,
      charId: row.charId,
      character: row.character,
      pinyin: row.pinyin ?? undefined,
      subject: row.subject,
      wrongCount: row.wrongCount,
      lastWrongAt: row.lastWrongAt.toISOString(),
      mastered: row.mastered,
      radical: row.radical ?? undefined,
      strokes: row.strokes ?? undefined,
      meaning: row.meaning ?? undefined,
      examples: row.examples ?? undefined,
    };
  }

  async createDictationSession(
    userId: string,
    dto: {
      grade: string;
      semester: string;
      textbookId?: string;
      unitId?: string;
      mode?: string;
      speed?: string;
      count?: number;
    },
  ): Promise<ChineseDictationSession> {
    const mode = dto.mode ?? 'pinyin_to_char';
    const speed = dto.speed ?? 'normal';
    const count = Math.min(Math.max(dto.count ?? 10, 1), 100);

    const validModes = ['pinyin_to_char', 'char_to_pinyin', 'audio_to_char', 'audio_to_pinyin'];
    if (!validModes.includes(mode)) {
      throw new BadRequestException('无效的听写模式');
    }
    const validSpeeds = ['slow', 'normal', 'fast'];
    if (!validSpeeds.includes(speed)) {
      throw new BadRequestException('无效的语速');
    }

    // 从 chinese_characters 随机抽取生字
    const conditions = [];
    if (dto.textbookId) conditions.push(eq(chineseCharacters.textbookId, dto.textbookId));
    if (dto.unitId) conditions.push(eq(chineseCharacters.unitId, dto.unitId));

    const baseQuery = conditions.length > 0
      ? this.db.select().from(chineseCharacters).where(and(...conditions))
      : this.db.select().from(chineseCharacters);

    const charRows: ChineseCharacterSelect[] = await baseQuery
      .orderBy(sql`random()`)
      .limit(count);

    if (charRows.length === 0) {
      throw new BadRequestException('没有找到可用的生字');
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const sessionRows = await this.db
      .insert(dictationSessions)
      .values({
        userId: sql`ROW(${userId})::user_profile`,
        subject: 'chinese',
        grade: dto.grade,
        semester: dto.semester,
        textbookId: dto.textbookId,
        unitId: dto.unitId,
        mode,
        speed,
        totalCount: charRows.length,
        correctCount: 0,
        status: 'in_progress',
        startedAt: now,
      })
      .returning();

    const session: ChineseDictationSession = this.mapDictationSession(sessionRows[0]);

    // 写入 session_words
    const wordValues = charRows.map((char: ChineseCharacterSelect, idx: number) => ({
      sessionId: session.id,
      charId: char.id,
      character: char.character,
      pinyin: char.pinyin,
      wordOrder: idx + 1,
    }));

    const wordRows = await this.db
      .insert(dictationSessionWords)
      .values(wordValues)
      .returning();

    const words: ChineseDictationSessionWord[] = wordRows.map((row: DictationSessionWordSelect) =>
      this.mapDictationSessionWord(row),
    );

    return { ...session, words };
  }

  async getDictationSession(
    userId: string,
    sessionId: string,
  ): Promise<ChineseDictationSession & { words: ChineseDictationSessionWord[] }> {
    const sessionRows: DictationSessionSelect[] = await this.db
      .select()
      .from(dictationSessions)
      .where(and(
        eq(dictationSessions.id, sessionId),
        sql`(${dictationSessions.userId}).user_id = ${userId}`,
      ));

    if (sessionRows.length === 0) {
      throw new NotFoundException('听写会话不存在');
    }

    const session: ChineseDictationSession = this.mapDictationSession(sessionRows[0]);

    // 取 words 并 join chinese_characters 拿详情
    const wordRows = await this.db
      .select({
        id: dictationSessionWords.id,
        sessionId: dictationSessionWords.sessionId,
        charId: dictationSessionWords.charId,
        character: dictationSessionWords.character,
        pinyin: dictationSessionWords.pinyin,
        wordOrder: dictationSessionWords.wordOrder,
        userAnswer: dictationSessionWords.userAnswer,
        isCorrect: dictationSessionWords.isCorrect,
        answeredAt: dictationSessionWords.answeredAt,
        createdAt: dictationSessionWords.createdAt,
        updatedAt: dictationSessionWords.updatedAt,
        radical: chineseCharacters.radical,
        strokes: chineseCharacters.strokes,
        meaning: chineseCharacters.meaning,
        examples: chineseCharacters.examples,
      })
      .from(dictationSessionWords)
      .leftJoin(
        chineseCharacters,
        eq(dictationSessionWords.charId, chineseCharacters.id),
      )
      .where(eq(dictationSessionWords.sessionId, sessionId))
      .orderBy(asc(dictationSessionWords.wordOrder));

    const words: ChineseDictationSessionWord[] = wordRows.map((row) =>
      this.mapDictationSessionWord(row as DictationSessionWordSelect & {
        radical?: string | null;
        strokes?: number | null;
        meaning?: string | null;
        examples?: string | null;
      }),
    );

    return { ...session, words };
  }

  async answerDictationWord(
    userId: string,
    sessionId: string,
    dto: { wordOrder: number; userAnswer: string },
  ): Promise<{ isCorrect: boolean; correctAnswer: string; character?: string; pinyin?: string }> {
    // 验证会话存在且属于用户
    const sessionRows: DictationSessionSelect[] = await this.db
      .select()
      .from(dictationSessions)
      .where(and(
        eq(dictationSessions.id, sessionId),
        sql`(${dictationSessions.userId}).user_id = ${userId}`,
      ));

    if (sessionRows.length === 0) {
      throw new NotFoundException('听写会话不存在');
    }

    if (sessionRows[0].status === 'completed') {
      throw new BadRequestException('听写已提交，不能再作答');
    }

    const session = sessionRows[0];

    // 找到该 wordOrder 的字
    const wordRows = await this.db
      .select()
      .from(dictationSessionWords)
      .where(and(
        eq(dictationSessionWords.sessionId, sessionId),
        eq(dictationSessionWords.wordOrder, dto.wordOrder),
      ));

    if (wordRows.length === 0) {
      throw new NotFoundException('生字不存在');
    }

    const word = wordRows[0];
    const mode = session.mode;

    let isCorrect = false;
    let correctAnswer = '';

    if (mode === 'pinyin_to_char' || mode === 'audio_to_char') {
      // 比较汉字，去掉空格
      const userAns = dto.userAnswer.replace(/\s/g, '');
      const correctAns = word.character.replace(/\s/g, '');
      correctAnswer = word.character;
      isCorrect = userAns === correctAns;
    } else {
      // char_to_pinyin / audio_to_pinyin：去声调比较
      const userAns = this.stripTones(dto.userAnswer.replace(/\s/g, '').toLowerCase());
      const correctAns = this.stripTones((word.pinyin ?? '').replace(/\s/g, '').toLowerCase());
      correctAnswer = word.pinyin ?? '';
      isCorrect = userAns === correctAns && userAns.length > 0;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    await this.db
      .update(dictationSessionWords)
      .set({
        userAnswer: dto.userAnswer,
        isCorrect,
        answeredAt: now,
      })
      .where(eq(dictationSessionWords.id, word.id));

    return {
      isCorrect,
      correctAnswer,
      character: word.character,
      pinyin: word.pinyin ?? undefined,
    };
  }

  async submitDictationSession(
    userId: string,
    sessionId: string,
    dto: { answers: { wordOrder: number; userAnswer: string }[]; durationSeconds: number },
  ): Promise<ChineseDictationResult> {
    // 验证会话存在且属于用户
    const sessionRows: DictationSessionSelect[] = await this.db
      .select()
      .from(dictationSessions)
      .where(and(
        eq(dictationSessions.id, sessionId),
        sql`(${dictationSessions.userId}).user_id = ${userId}`,
      ));

    if (sessionRows.length === 0) {
      throw new NotFoundException('听写会话不存在');
    }

    if (sessionRows[0].status === 'completed') {
      throw new BadRequestException('听写已提交');
    }

    const sessionRow = sessionRows[0];
    const mode = sessionRow.mode;

    // 取所有 words
    const allWordRows: DictationSessionWordSelect[] = await this.db
      .select()
      .from(dictationSessionWords)
      .where(eq(dictationSessionWords.sessionId, sessionId))
      .orderBy(asc(dictationSessionWords.wordOrder));

    if (allWordRows.length === 0) {
      throw new BadRequestException('听写会话没有生字');
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 逐题判分并更新
    const answerMap = new Map<number, string>();
    for (const a of dto.answers) {
      answerMap.set(a.wordOrder, a.userAnswer);
    }

    let correctCount = 0;
    const wrongChars: { charId: string; character: string; pinyin: string | null }[] = [];

    for (const word of allWordRows) {
      const userAnswer = answerMap.get(word.wordOrder) ?? word.userAnswer ?? '';
      let isCorrect = false;

      if (mode === 'pinyin_to_char' || mode === 'audio_to_char') {
        const userAns = userAnswer.replace(/\s/g, '');
        const correctAns = word.character.replace(/\s/g, '');
        isCorrect = userAns === correctAns && userAns.length > 0;
      } else {
        const userAns = this.stripTones(userAnswer.replace(/\s/g, '').toLowerCase());
        const correctAns = this.stripTones((word.pinyin ?? '').replace(/\s/g, '').toLowerCase());
        isCorrect = userAns === correctAns && userAns.length > 0;
      }

      if (isCorrect) {
        correctCount += 1;
      } else {
        wrongChars.push({
          charId: word.charId,
          character: word.character,
          pinyin: word.pinyin ?? null,
        });
      }

      // 只更新有变化的
      if (userAnswer !== word.userAnswer || isCorrect !== word.isCorrect) {
        await this.db
          .update(dictationSessionWords)
          .set({
            userAnswer,
            isCorrect,
            answeredAt: now,
          })
          .where(eq(dictationSessionWords.id, word.id));
      }
    }

    const totalCount = allWordRows.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // 更新 session
    await this.db
      .update(dictationSessions)
      .set({
        correctCount,
        score,
        durationSeconds: dto.durationSeconds,
        status: 'completed',
        submittedAt: now,
      })
      .where(eq(dictationSessions.id, sessionId));

    // 写入错字本（upsert by char_id，因 charId 有 UNIQUE 索引）
    for (const wrong of wrongChars) {
      try {
        await this.db
          .insert(dictationWrongWords)
          .values({
            userId: sql`ROW(${userId})::user_profile`,
            charId: wrong.charId,
            character: wrong.character,
            pinyin: wrong.pinyin ?? undefined,
            subject: 'chinese',
            wrongCount: 1,
            lastWrongAt: now,
            mastered: false,
          })
          .onConflictDoUpdate({
            target: dictationWrongWords.charId,
            set: {
              wrongCount: sql`${dictationWrongWords.wrongCount} + 1`,
              lastWrongAt: now,
              mastered: false,
            },
          });
      } catch (err: unknown) {
        // 忽略错字本写入错误，不影响主流程
        this.logger.warn(
          `写入错字本失败: ${JSON.stringify({ charId: wrong.charId, error: String(err) })}`,
        );
      }
    }

    // 重新取完整结果（带生字详情）
    const fullSession = await this.getDictationSession(userId, sessionId);

    return {
      session: fullSession,
      words: fullSession.words,
      correctCount,
      totalCount,
      score,
      wrongCount: totalCount - correctCount,
      durationSeconds: dto.durationSeconds,
    };
  }

  async listDictationSessions(
    userId: string,
    params: { grade?: string; page?: number; pageSize?: number },
  ): Promise<PagedResponse<ChineseDictationSession>> {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 10, 1), 100);
    const offset = (page - 1) * pageSize;

    const conditions = [sql`(${dictationSessions.userId}).user_id = ${userId}`];
    if (params.grade) conditions.push(eq(dictationSessions.grade, params.grade));

    const countResult = await this.db
      .select({ count: count() })
      .from(dictationSessions)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count ?? 0);

    const rows: DictationSessionSelect[] = await this.db
      .select()
      .from(dictationSessions)
      .where(and(...conditions))
      .orderBy(desc(dictationSessions.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items: ChineseDictationSession[] = rows.map((row: DictationSessionSelect) =>
      this.mapDictationSession(row),
    );

    return { items, total, page, pageSize };
  }

  async listDictationWrongWords(
    userId: string,
    params: { grade?: string; mastered?: boolean; page?: number; pageSize?: number },
  ): Promise<PagedResponse<ChineseDictationWrongWord>> {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 10, 1), 100);
    const offset = (page - 1) * pageSize;

    const conditions = [sql`(${dictationWrongWords.userId}).user_id = ${userId}`];
    if (params.mastered !== undefined) {
      conditions.push(eq(dictationWrongWords.mastered, params.mastered));
    }

    const countResult = await this.db
      .select({ count: count() })
      .from(dictationWrongWords)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select({
        id: dictationWrongWords.id,
        userId: dictationWrongWords.userId,
        charId: dictationWrongWords.charId,
        character: dictationWrongWords.character,
        pinyin: dictationWrongWords.pinyin,
        subject: dictationWrongWords.subject,
        wrongCount: dictationWrongWords.wrongCount,
        lastWrongAt: dictationWrongWords.lastWrongAt,
        mastered: dictationWrongWords.mastered,
        createdAt: dictationWrongWords.createdAt,
        updatedAt: dictationWrongWords.updatedAt,
        radical: chineseCharacters.radical,
        strokes: chineseCharacters.strokes,
        meaning: chineseCharacters.meaning,
        examples: chineseCharacters.examples,
      })
      .from(dictationWrongWords)
      .leftJoin(
        chineseCharacters,
        eq(dictationWrongWords.charId, chineseCharacters.id),
      )
      .where(and(...conditions))
      .orderBy(desc(dictationWrongWords.lastWrongAt))
      .limit(pageSize)
      .offset(offset);

    const items: ChineseDictationWrongWord[] = rows.map((row) =>
      this.mapDictationWrongWord(row as DictationWrongWordSelect & {
        radical?: string | null;
        strokes?: number | null;
        meaning?: string | null;
        examples?: string | null;
      }),
    );

    return { items, total, page, pageSize };
  }

  // ===== 数学练习：应用题列表 =====

  async getMathWordProblemList(params: {
    textbookId?: string;
    unitId?: string;
    difficulty?: number;
    limit?: number;
  }): Promise<MathWordProblemItem[]> {
    const { textbookId, unitId, difficulty, limit } = params;
    const conditions = [eq(mathPracticeItems.itemType, 'word_problem')];
    if (textbookId) conditions.push(eq(mathPracticeItems.textbookId, textbookId));
    if (unitId) conditions.push(eq(mathPracticeItems.unitId, unitId));
    if (difficulty !== undefined) conditions.push(eq(mathPracticeItems.difficulty, difficulty));

    const baseQuery = this.db
      .select()
      .from(mathPracticeItems)
      .where(and(...conditions))
      .orderBy(asc(mathPracticeItems.itemOrder));

    const rows: MathPracticeItemSelect[] = limit !== undefined
      ? await baseQuery.limit(limit)
      : await baseQuery;

    return rows.map((row: MathPracticeItemSelect) => ({
      id: row.id,
      topicId: row.topicId,
      textbookId: row.textbookId,
      unitId: row.unitId,
      question: row.question,
      correctAnswer: row.correctAnswer,
      solution: row.solution ?? undefined,
      difficulty: row.difficulty,
      itemOrder: row.itemOrder,
    }));
  }
}
