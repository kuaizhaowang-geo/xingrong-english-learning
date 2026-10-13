import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  questions,
  aiQuizzes,
  aiQuizQuestions,
  aiWrongQuestions,
} from '@server/database/schema';
import { eq, and, desc, count, inArray, sql, type SQL } from 'drizzle-orm';
import type {
  Question,
  PagedResponse,
  CreateQuestionDto,
  UpdateQuestionDto,
  GenerateQuestionsDto,
  QuestionOption,
  AIQuiz,
  AIQuizQuestion,
  AIWrongQuestion,
  CreateAIQuizDto,
  SubmitAIQuizAnswerDto,
  SubmitAIQuizDto,
  AIQuizResult,
} from '@shared/api.interface';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async listQuestions(params: {
    subject?: string;
    grade?: string;
    semester?: string;
    unitId?: string;
    knowledgePoint?: string;
    questionType?: string;
    difficulty?: string;
    page: number;
    pageSize: number;
  }): Promise<PagedResponse<Question>> {
    const { page, pageSize } = params;
    if (page < 1) {
      throw new BadRequestException('page 必须大于等于 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('pageSize 必须在 1-100 之间');
    }

    try {
      const conditions = this.buildFilterConditions(params);
      const offset = (page - 1) * pageSize;

      const [itemsResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(questions)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(questions.createdAt))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(questions)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      const total = Number(countResult[0]?.count ?? 0);
      const items: Question[] = itemsResult.map((r) => this.mapToQuestion(r));

      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error(
        '获取题目列表失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getQuestion(id: string): Promise<Question> {
    try {
      const records = await this.db
        .select()
        .from(questions)
        .where(eq(questions.id, id))
        .limit(1);

      if (records.length === 0) {
        throw new NotFoundException('题目不存在');
      }

      return this.mapToQuestion(records[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        '获取题目详情失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    if (!dto.stem || dto.stem.trim() === '') {
      throw new BadRequestException('题干不能为空');
    }
    if (!dto.answer || dto.answer.trim() === '') {
      throw new BadRequestException('答案不能为空');
    }

    try {
      const inserted = await this.db
        .insert(questions)
        .values({
          subject: dto.subject,
          grade: dto.grade,
          semester: dto.semester,
          textbookId: dto.textbookId,
          unitId: dto.unitId,
          knowledgePoint: dto.knowledgePoint,
          questionType: dto.questionType,
          difficulty: dto.difficulty,
          stem: dto.stem.trim(),
          options: (dto.options ?? []) as unknown as Record<string, unknown>[],
          answer: dto.answer.trim(),
          analysis: dto.analysis,
          source: dto.source ?? 'manual',
        })
        .returning({ id: questions.id });

      const result = await this.db
        .select()
        .from(questions)
        .where(eq(questions.id, inserted[0].id));

      return this.mapToQuestion(result[0]);
    } catch (error) {
      this.logger.error(
        '创建题目失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `创建题目失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto): Promise<Question> {
    try {
      const existing = await this.db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('题目不存在');
      }

      const patch: Partial<typeof questions.$inferInsert> = {};
      if (dto.subject !== undefined) patch.subject = dto.subject;
      if (dto.grade !== undefined) patch.grade = dto.grade;
      if (dto.semester !== undefined) patch.semester = dto.semester;
      if (dto.textbookId !== undefined) patch.textbookId = dto.textbookId;
      if (dto.unitId !== undefined) patch.unitId = dto.unitId;
      if (dto.knowledgePoint !== undefined) {
        patch.knowledgePoint = dto.knowledgePoint;
      }
      if (dto.questionType !== undefined) patch.questionType = dto.questionType;
      if (dto.difficulty !== undefined) patch.difficulty = dto.difficulty;
      if (dto.stem !== undefined) patch.stem = dto.stem.trim();
      if (dto.options !== undefined) {
        patch.options = dto.options as unknown as Record<string, unknown>[];
      }
      if (dto.answer !== undefined) patch.answer = dto.answer.trim();
      if (dto.analysis !== undefined) patch.analysis = dto.analysis;
      if (dto.source !== undefined) patch.source = dto.source;

      if (Object.keys(patch).length === 0) {
        throw new BadRequestException('未提供可更新字段');
      }

      patch.updatedAt = new Date();

      const updated = await this.db
        .update(questions)
        .set(patch)
        .where(eq(questions.id, id))
        .returning({ id: questions.id });

      if (updated.length === 0) {
        throw new NotFoundException('题目不存在');
      }

      const result = await this.db
        .select()
        .from(questions)
        .where(eq(questions.id, id));

      return this.mapToQuestion(result[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        '更新题目失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `更新题目失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    try {
      const deleted = await this.db
        .delete(questions)
        .where(eq(questions.id, id))
        .returning({ id: questions.id });

      if (deleted.length === 0) {
        throw new NotFoundException('题目不存在');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        '删除题目失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async generateQuestions(
    userId: string,
    dto: GenerateQuestionsDto,
  ): Promise<Question[]> {
    const count = Math.min(Math.max(dto.count ?? 5, 1), 20);
    const questionType = dto.questionType ?? 'choice';
    const difficulty = dto.difficulty ?? 'medium';

    try {
      // TODO: 后续替换为真实 AI 插件调用
      // const capability = this.capabilityService.load(PLUGIN_INSTANCE_ID);
      // const streamResult = await capability.callStream('textGenerate', input);

      // 使用模板生成 fallback，保证功能可用
      const generated: CreateQuestionDto[] = this.generateTemplateQuestions(
        dto.subject,
        dto.grade,
        dto.semester,
        dto.unitId,
        dto.knowledgePoint ?? '',
        questionType,
        difficulty,
        count,
      );

      const results: Question[] = [];
      for (const qDto of generated) {
        const question = await this.createQuestion(qDto);
        results.push(question);
      }

      return results;
    } catch (error) {
      this.logger.error(
        'AI 生成题目失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `AI 生成题目失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private generateTemplateQuestions(
    subject: string,
    grade: string,
    semester: string,
    unitId: string | undefined,
    knowledgePoint: string,
    questionType: string,
    difficulty: string,
    count: number,
  ): CreateQuestionDto[] {
    const result: CreateQuestionDto[] = [];

    if (subject === 'math') {
      for (let i = 0; i < count; i += 1) {
        result.push(
          this.generateMathQuestion(
            grade,
            semester,
            unitId,
            knowledgePoint,
            questionType,
            difficulty,
            i,
          ),
        );
      }
    } else if (subject === 'chinese') {
      for (let i = 0; i < count; i += 1) {
        result.push(
          this.generateChineseQuestion(
            grade,
            semester,
            unitId,
            knowledgePoint,
            questionType,
            difficulty,
            i,
          ),
        );
      }
    } else {
      // 英语
      for (let i = 0; i < count; i += 1) {
        result.push(
          this.generateEnglishQuestion(
            grade,
            semester,
            unitId,
            knowledgePoint,
            questionType,
            difficulty,
            i,
          ),
        );
      }
    }

    return result;
  }

  private detectMathOp(knowledgePoint: string): 'add' | 'subtract' | 'multiply' | 'divide' | 'mixed' {
    const kp = knowledgePoint.toLowerCase();
    if (kp.includes('乘') || kp.includes('乘法') || kp.includes('积') || kp.includes('倍')) {
      return 'multiply';
    }
    if (kp.includes('除') || kp.includes('除法') || kp.includes('商')) {
      return 'divide';
    }
    if (kp.includes('加') || kp.includes('加法') || kp.includes('和')) {
      return 'add';
    }
    if (kp.includes('减') || kp.includes('减法') || kp.includes('差')) {
      return 'subtract';
    }
    if (kp.includes('四则') || kp.includes('混合') || kp.includes('运算')) {
      return 'mixed';
    }
    return 'add';
  }

  private generateNumbers(
    op: 'add' | 'subtract' | 'multiply' | 'divide' | 'mixed',
    difficulty: string,
  ): { a: number; b: number; answer: number; opSymbol: string } {
    const isHard = difficulty === 'hard';
    const isMedium = difficulty === 'medium';
    let actualOp = op;
    if (op === 'mixed') {
      const ops = ['add', 'subtract', 'multiply', 'divide'] as const;
      actualOp = ops[this.randomInt(0, 3)];
    }

    switch (actualOp) {
      case 'add': {
        const max = isHard ? 999 : isMedium ? 199 : 99;
        const a = this.randomInt(1, max);
        const b = this.randomInt(1, max - a);
        return { a, b, answer: a + b, opSymbol: '+' };
      }
      case 'subtract': {
        const max = isHard ? 999 : isMedium ? 199 : 99;
        const a = this.randomInt(10, max);
        const b = this.randomInt(1, a - 1);
        return { a, b, answer: a - b, opSymbol: '−' };
      }
      case 'multiply': {
        const aMax = isHard ? 99 : isMedium ? 19 : 9;
        const bMax = isHard ? 99 : isMedium ? 9 : 9;
        const a = this.randomInt(2, aMax);
        const b = this.randomInt(2, bMax);
        return { a, b, answer: a * b, opSymbol: '×' };
      }
      case 'divide': {
        const bMax = isHard ? 99 : isMedium ? 9 : 9;
        const b = this.randomInt(2, bMax);
        const quotientMax = isHard ? 99 : isMedium ? 19 : 9;
        const quotient = this.randomInt(2, quotientMax);
        return { a: b * quotient, b, answer: quotient, opSymbol: '÷' };
      }
    }
  }

  private generateMathQuestion(
    grade: string,
    semester: string,
    unitId: string | undefined,
    knowledgePoint: string,
    questionType: string,
    difficulty: string,
    index: number,
  ): CreateQuestionDto {
    const kpLabel = knowledgePoint || '计算练习';
    const op = this.detectMathOp(knowledgePoint);

    if (questionType === 'fill_in_blank' || questionType === 'calculation') {
      const { a, b, answer, opSymbol } = this.generateNumbers(op, difficulty);
      const answerStr = String(answer);
      const stem = questionType === 'fill_in_blank'
        ? `${a} ${opSymbol} ${b} = ____`
        : `计算：${a} ${opSymbol} ${b} = ?`;
      return {
        subject: 'math',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType,
        difficulty,
        stem,
        answer: answerStr,
        analysis: `${a} ${opSymbol} ${b} = ${answerStr}。`,
        source: 'ai_generated',
        options: [],
      };
    }

    if (questionType === 'word_problem') {
      const { a, b, answer, opSymbol } = this.generateNumbers(op, difficulty);
      const stems: Record<string, string> = {
        add: `小明有 ${a} 个苹果，妈妈又给了他 ${b} 个，小明现在一共有多少个苹果？`,
        subtract: `小明有 ${a} 个苹果，送给朋友 ${b} 个，还剩下多少个苹果？`,
        multiply: `每盒有 ${a} 个苹果，${b} 盒一共有多少个苹果？`,
        divide: `${a} 个苹果平均分给 ${b} 个小朋友，每人分多少个？`,
        mixed: `小明有 ${a} 个苹果，妈妈又给了他 ${b} 个，小明现在一共有多少个苹果？`,
      };
      const analyses: Record<string, string> = {
        add: `小明原有 ${a} 个苹果，加上妈妈给的 ${b} 个，一共是 ${a} + ${b} = ${answer} 个。`,
        subtract: `小明原有 ${a} 个苹果，送出 ${b} 个后，还剩 ${a} − ${b} = ${answer} 个。`,
        multiply: `每盒 ${a} 个，${b} 盒总共是 ${a} × ${b} = ${answer} 个。`,
        divide: `${a} 个苹果平均分给 ${b} 个小朋友，每人分到 ${a} ÷ ${b} = ${answer} 个。`,
        mixed: `计算可得 ${a} ${opSymbol} ${b} = ${answer}。`,
      };
      const actualOp = op === 'mixed' ? 'add' : op;
      return {
        subject: 'math',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'word_problem',
        difficulty,
        stem: stems[actualOp],
        answer: String(answer),
        analysis: analyses[actualOp],
        source: 'ai_generated',
        options: [],
      };
    }

    if (questionType === 'true_false') {
      const { a, b, answer, opSymbol } = this.generateNumbers(op, difficulty);
      const isWrong = this.randomInt(0, 1) === 1;
      const shownAnswer = isWrong ? answer + this.randomInt(1, 5) : answer;
      return {
        subject: 'math',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'true_false',
        difficulty,
        stem: `判断：${a} ${opSymbol} ${b} = ${shownAnswer}`,
        answer: isWrong ? 'false' : 'true',
        analysis: `${a} ${opSymbol} ${b} = ${answer}，${isWrong ? `不等于 ${shownAnswer}，所以答案是错的。` : '所以答案是对的。'}`,
        source: 'ai_generated',
        options: [],
      };
    }

    // choice（选择题）
    const { a, b, answer, opSymbol } = this.generateNumbers(op, difficulty);
    const correct = answer;
    const options: QuestionOption[] = [
      { label: 'A', content: String(correct) },
      { label: 'B', content: String(correct + this.randomInt(1, 5)) },
      { label: 'C', content: String(Math.max(1, correct - this.randomInt(1, 5))) },
      { label: 'D', content: String(correct + this.randomInt(6, 10)) },
    ].sort(() => Math.random() - 0.5);
    const letters = ['A', 'B', 'C', 'D'];
    const correctLabel = options.findIndex((opt: QuestionOption) => Number(opt.content) === correct);
    return {
      subject: 'math',
      grade,
      semester,
      unitId,
      knowledgePoint: kpLabel,
      questionType: 'choice',
      difficulty,
      stem: `${a} ${opSymbol} ${b} = ?`,
      answer: letters[correctLabel],
      analysis: `${a} ${opSymbol} ${b} = ${correct}，选 ${letters[correctLabel]}。`,
      source: 'ai_generated',
      options,
    };
  }

  private generateEnglishQuestion(
    grade: string,
    semester: string,
    unitId: string | undefined,
    knowledgePoint: string,
    questionType: string,
    difficulty: string,
    index: number,
  ): CreateQuestionDto {
    const kpLabel = knowledgePoint || '词汇语法练习';
    const wordPool = [
      { word: 'apple', meaning: '苹果', distractors: ['banana', 'orange', 'grape'] },
      { word: 'cat', meaning: '猫', distractors: ['dog', 'bird', 'fish'] },
      { word: 'happy', meaning: '快乐的', distractors: ['sad', 'angry', 'tired'] },
      { word: 'run', meaning: '跑', distractors: ['walk', 'jump', 'swim'] },
      { word: 'book', meaning: '书', distractors: ['pen', 'pencil', 'bag'] },
      { word: 'teacher', meaning: '老师', distractors: ['student', 'doctor', 'nurse'] },
      { word: 'morning', meaning: '早晨', distractors: ['afternoon', 'evening', 'night'] },
      { word: 'beautiful', meaning: '美丽的', distractors: ['ugly', 'tall', 'short'] },
    ];

    const w = wordPool[index % wordPool.length];

    if (questionType === 'fill_in_the_blank') {
      return {
        subject: 'english',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'fill_in_the_blank',
        difficulty,
        stem: `I have an _____. （我有一个苹果。）`,
        answer: w.word,
        analysis: `根据中文提示"苹果"，应填入 ${w.word}。`,
        source: 'ai_generated',
        options: [],
      };
    }

    if (questionType === 'spelling_choice') {
      const options: QuestionOption[] = [
        { label: 'A', content: w.word },
        { label: 'B', content: w.distractors[0] },
        { label: 'C', content: w.distractors[1] },
        { label: 'D', content: w.distractors[2] },
      ];
      return {
        subject: 'english',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'spelling_choice',
        difficulty,
        stem: `下列哪个单词的意思是"${w.meaning}"？`,
        options,
        answer: 'A',
        analysis: `${w.word} 的意思是"${w.meaning}"，故正确答案是 A。`,
        source: 'ai_generated',
      };
    }

    if (questionType === 'sentence_arrangement') {
      const words = w.word.length > 3
        ? ['I', 'like', w.word + 's.']
        : ['This', 'is', 'an', w.word + '.'];
      return {
        subject: 'english',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'sentence_arrangement',
        difficulty,
        stem: `将下列单词排列成正确的句子：${words.join(' ')}`,
        answer: words.join(' '),
        analysis: `正确顺序为：${words.join(' ')}`,
        source: 'ai_generated',
        options: [],
      };
    }

    if (questionType === 'reading_comprehension') {
      return {
        subject: 'english',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'reading_comprehension',
        difficulty,
        stem: `阅读短文：Tom has a ${w.word}. It is very nice. He likes it very much.\n问题：What does Tom have?`,
        options: [
          { label: 'A', content: `A ${w.word}` },
          { label: 'B', content: `A ${w.distractors[0]}` },
          { label: 'C', content: `A ${w.distractors[1]}` },
          { label: 'D', content: `A ${w.distractors[2]}` },
        ],
        answer: 'A',
        analysis: `文中第一句说 Tom has a ${w.word}，所以答案是 A。`,
        source: 'ai_generated',
      };
    }

    // 默认 choice
    const options: QuestionOption[] = [
      { label: 'A', content: w.word },
      { label: 'B', content: w.distractors[0] },
      { label: 'C', content: w.distractors[1] },
      { label: 'D', content: w.distractors[2] },
    ];
    return {
      subject: 'english',
      grade,
      semester,
      unitId,
      knowledgePoint: kpLabel,
      questionType: 'choice',
      difficulty,
      stem: `"${w.meaning}" 的英文单词是：`,
      options,
      answer: 'A',
      analysis: `${w.word} = ${w.meaning}，正确答案为 A。`,
      source: 'ai_generated',
    };
  }

  private generateChineseQuestion(
    grade: string,
    semester: string,
    unitId: string | undefined,
    knowledgePoint: string,
    questionType: string,
    difficulty: string,
    index: number,
  ): CreateQuestionDto {
    const kpLabel = knowledgePoint || '字词积累';
    const wordPool = [
      { word: '春', pinyin: 'chūn', meaning: '春天', distractors: ['chūn', 'cūn', 'chuī', 'chōng'] },
      { word: '花', pinyin: 'huā', meaning: '花朵', distractors: ['huā', 'huá', 'huà', 'fā'] },
      { word: '山', pinyin: 'shān', meaning: '山脉', distractors: ['shān', 'sān', 'shāng', 'chān'] },
      { word: '水', pinyin: 'shuǐ', meaning: '水流', distractors: ['shuǐ', 'suǐ', 'shuí', 'suī'] },
      { word: '日', pinyin: 'rì', meaning: '太阳', distractors: ['rì', 'lì', 'rìe', 'yù'] },
      { word: '月', pinyin: 'yuè', meaning: '月亮', distractors: ['yuè', 'yüè', 'yè', 'ruì'] },
    ];

    const w = wordPool[index % wordPool.length];

    if (questionType === 'pinyin_choice') {
      const options: QuestionOption[] = w.distractors.map((d, i) => ({
        label: String.fromCharCode(65 + i),
        content: d,
      }));
      return {
        subject: 'chinese',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'pinyin_choice',
        difficulty,
        stem: `"${w.word}"字的正确读音是：`,
        options,
        answer: 'A',
        analysis: `"${w.word}"读作"${w.pinyin}"，第一声。`,
        source: 'ai_generated',
      };
    }

    if (questionType === 'fill_in_blank') {
      return {
        subject: 'chinese',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'fill_in_blank',
        difficulty,
        stem: `______天来了，花儿开了。`,
        answer: '春',
        analysis: `根据语境，应填入"春"字，春天是万物复苏、花儿开放的季节。`,
        source: 'ai_generated',
        options: [],
      };
    }

    if (questionType === 'poem_recitation') {
      return {
        subject: 'chinese',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'poem_recitation',
        difficulty,
        stem: `补全诗句："______眠不觉晓，处处闻啼鸟。"`,
        answer: '春',
        analysis: `出自孟浩然《春晓》："春眠不觉晓，处处闻啼鸟。"`,
        source: 'ai_generated',
        options: [],
      };
    }

    if (questionType === 'reading_comprehension') {
      return {
        subject: 'chinese',
        grade,
        semester,
        unitId,
        knowledgePoint: kpLabel,
        questionType: 'reading_comprehension',
        difficulty,
        stem: `春天来了，小草绿了，花儿开了，小鸟在树上唱歌。小朋友们在公园里放风筝。\n问题：这是什么季节？`,
        options: [
          { label: 'A', content: '春天' },
          { label: 'B', content: '夏天' },
          { label: 'C', content: '秋天' },
          { label: 'D', content: '冬天' },
        ],
        answer: 'A',
        analysis: `文章第一句就点明了"春天来了"，所以答案是 A。`,
        source: 'ai_generated',
      };
    }

    // 默认 choice
    const options: QuestionOption[] = [
      { label: 'A', content: w.meaning },
      { label: 'B', content: '不是' + w.meaning },
      { label: 'C', content: '也许' + w.meaning },
      { label: 'D', content: '没有' + w.meaning },
    ];
    return {
      subject: 'chinese',
      grade,
      semester,
      unitId,
      knowledgePoint: kpLabel,
      questionType: 'choice',
      difficulty,
      stem: `"${w.word}"字的意思是：`,
      options,
      answer: 'A',
      analysis: `"${w.word}"的意思是${w.meaning}。`,
      source: 'ai_generated',
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private buildFilterConditions(params: {
    subject?: string;
    grade?: string;
    semester?: string;
    unitId?: string;
    knowledgePoint?: string;
    questionType?: string;
    difficulty?: string;
  }): SQL<unknown>[] {
    const conditions: SQL<unknown>[] = [];

    if (params.subject) {
      conditions.push(eq(questions.subject, params.subject));
    }
    if (params.grade) {
      conditions.push(eq(questions.grade, params.grade));
    }
    if (params.semester) {
      conditions.push(eq(questions.semester, params.semester));
    }
    if (params.unitId) {
      conditions.push(eq(questions.unitId, params.unitId));
    }
    if (params.knowledgePoint) {
      conditions.push(eq(questions.knowledgePoint, params.knowledgePoint));
    }
    if (params.questionType) {
      conditions.push(eq(questions.questionType, params.questionType));
    }
    if (params.difficulty) {
      conditions.push(eq(questions.difficulty, params.difficulty));
    }

    return conditions;
  }

  // ===== AI 出题会话 =====

  async createAIQuiz(
    userId: string,
    dto: CreateAIQuizDto,
  ): Promise<AIQuiz> {
    const count = Math.min(Math.max(dto.count ?? 5, 1), 20);
    const questionType = dto.questionType ?? 'choice';
    const difficulty = dto.difficulty ?? 'medium';

    try {
      // 调用现有 generateQuestions 生成题目
      const generatedQuestions: Question[] = await this.generateQuestions(
        userId,
        {
          subject: dto.subject,
          grade: dto.grade,
          semester: dto.semester,
          unitId: dto.unitId,
          knowledgePoint: dto.knowledgePoint,
          questionType,
          difficulty,
          count,
        },
      );

      const now = new Date();

      // 创建 ai_quizzes 记录
      const inserted = await this.db
        .insert(aiQuizzes)
        .values({
          userId,
          subject: dto.subject,
          grade: dto.grade,
          semester: dto.semester,
          textbookId: dto.textbookId,
          unitId: dto.unitId,
          questionType,
          difficulty,
          totalCount: generatedQuestions.length,
          status: 'in_progress',
          startedAt: now,
        })
        .returning({ id: aiQuizzes.id });

      const quizId = inserted[0].id;

      // 写入 ai_quiz_questions
      const quizQuestionRows = generatedQuestions.map(
        (q: Question, idx: number) => ({
          quizId,
          questionId: q.id,
          questionOrder: idx + 1,
        }),
      );
      await this.db.insert(aiQuizQuestions).values(quizQuestionRows);

      return this.getAIQuiz(userId, quizId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        '创建 AI 出题会话失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getAIQuiz(userId: string, id: string): Promise<AIQuiz> {
    try {
      const quizRecords = await this.db
        .select()
        .from(aiQuizzes)
        .where(and(eq(aiQuizzes.id, id), sql`(${aiQuizzes.userId}).user_id = ${userId}`))
        .limit(1);

      if (quizRecords.length === 0) {
        throw new NotFoundException('出题会话不存在');
      }

      const quizQuestions = await this.db
        .select()
        .from(aiQuizQuestions)
        .where(eq(aiQuizQuestions.quizId, id))
        .orderBy(aiQuizQuestions.questionOrder);

      const questionIds: string[] = quizQuestions.map(
        (q: typeof aiQuizQuestions.$inferSelect) => q.questionId,
      );

      let questionsMap: Map<string, Question> = new Map();
      if (questionIds.length > 0) {
        const questionRecords = await this.db
          .select()
          .from(questions)
          .where(inArray(questions.id, questionIds));
        for (const row of questionRecords) {
          questionsMap.set(row.id, this.mapToQuestion(row));
        }
      }

      const aiQuizQuestionsList: AIQuizQuestion[] = quizQuestions.map(
        (row: typeof aiQuizQuestions.$inferSelect) => {
          const q = this.mapToAIQuizQuestion(row);
          q.question = questionsMap.get(row.questionId);
          return q;
        },
      );

      const quiz = this.mapToAIQuiz(quizRecords[0]);
      quiz.questions = aiQuizQuestionsList;

      return quiz;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        '获取出题会话详情失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async answerAIQuizQuestion(
    userId: string,
    quizId: string,
    dto: SubmitAIQuizAnswerDto,
  ): Promise<{ isCorrect: boolean; correctAnswer: string; analysis?: string }> {
    try {
      // 校验 quiz 归属
      const quizRecords = await this.db
        .select({ id: aiQuizzes.id, status: aiQuizzes.status })
        .from(aiQuizzes)
        .where(
          and(eq(aiQuizzes.id, quizId), sql`(${aiQuizzes.userId}).user_id = ${userId}`),
        )
        .limit(1);

      if (quizRecords.length === 0) {
        throw new NotFoundException('出题会话不存在');
      }

      if (quizRecords[0].status === 'completed') {
        throw new BadRequestException('答题已提交，不能再单独作答');
      }

      // 找到对应的 quiz question
      const qqRecords = await this.db
        .select()
        .from(aiQuizQuestions)
        .where(
          and(
            eq(aiQuizQuestions.quizId, quizId),
            eq(aiQuizQuestions.questionOrder, dto.questionOrder),
          ),
        )
        .limit(1);

      if (qqRecords.length === 0) {
        throw new NotFoundException('题目不存在');
      }

      const questionId = qqRecords[0].questionId;

      // 获取题目正确答案
      const questionRecords = await this.db
        .select({
          id: questions.id,
          questionType: questions.questionType,
          answer: questions.answer,
          analysis: questions.analysis,
          options: questions.options,
        })
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      if (questionRecords.length === 0) {
        throw new NotFoundException('题目不存在');
      }

      const correctAnswer = questionRecords[0].answer;
      const questionType = questionRecords[0].questionType;
      const isCorrect = this.checkAnswer(
        questionType,
        dto.userAnswer,
        correctAnswer,
      );

      const now = new Date();
      await this.db
        .update(aiQuizQuestions)
        .set({
          userAnswer: dto.userAnswer,
          isCorrect,
          answeredAt: now,
        })
        .where(eq(aiQuizQuestions.id, qqRecords[0].id));

      return {
        isCorrect,
        correctAnswer,
        analysis: questionRecords[0].analysis ?? undefined,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        '提交单题答案失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async submitAIQuiz(
    userId: string,
    quizId: string,
    dto: SubmitAIQuizDto,
  ): Promise<AIQuizResult> {
    try {
      // 校验 quiz 归属
      const quizRecords = await this.db
        .select()
        .from(aiQuizzes)
        .where(
          and(eq(aiQuizzes.id, quizId), sql`(${aiQuizzes.userId}).user_id = ${userId}`),
        )
        .limit(1);

      if (quizRecords.length === 0) {
        throw new NotFoundException('出题会话不存在');
      }

      if (quizRecords[0].status === 'completed') {
        throw new BadRequestException('答题已提交');
      }

      // 获取所有 quiz questions
      const allQuizQuestions = await this.db
        .select()
        .from(aiQuizQuestions)
        .where(eq(aiQuizQuestions.quizId, quizId))
        .orderBy(aiQuizQuestions.questionOrder);

      if (allQuizQuestions.length === 0) {
        throw new BadRequestException('该出题会话没有题目');
      }

      const questionIds: string[] = allQuizQuestions.map(
        (q: typeof aiQuizQuestions.$inferSelect) => q.questionId,
      );

      // 获取所有题目详情（答案）
      const questionRecords = await this.db
        .select()
        .from(questions)
        .where(inArray(questions.id, questionIds));

      const questionMap = new Map<string, typeof questionRecords[number]>();
      for (const q of questionRecords) {
        questionMap.set(q.id, q);
      }

      // 构建答案 map
      const answerMap = new Map<number, string>();
      for (const ans of dto.answers) {
        answerMap.set(ans.questionOrder, ans.userAnswer);
      }

      // 批量判分并更新
      const now = new Date();
      let correctCount = 0;
      const wrongQuestionEntries: {
        questionId: string;
        subject: string;
      }[] = [];
      const updatedQuizQuestions: AIQuizQuestion[] = [];

      for (const qq of allQuizQuestions) {
        const userAnswer = answerMap.get(qq.questionOrder);
        const question = questionMap.get(qq.questionId);
        let isCorrect = false;

        if (question && userAnswer !== undefined) {
          isCorrect = this.checkAnswer(
            question.questionType,
            userAnswer,
            question.answer,
          );
        }

        if (isCorrect) {
          correctCount += 1;
        } else if (question) {
          wrongQuestionEntries.push({
            questionId: question.id,
            subject: question.subject,
          });
        }

        await this.db
          .update(aiQuizQuestions)
          .set({
            userAnswer: userAnswer ?? null,
            isCorrect,
            answeredAt: userAnswer !== undefined ? now : null,
          })
          .where(eq(aiQuizQuestions.id, qq.id));

        const mapped = this.mapToAIQuizQuestion(qq);
        mapped.userAnswer = userAnswer ?? undefined;
        mapped.isCorrect = isCorrect;
        mapped.answeredAt = userAnswer !== undefined ? now.toISOString() : undefined;
        if (question) {
          mapped.question = this.mapToQuestion(question);
        }
        updatedQuizQuestions.push(mapped);
      }

      const totalCount = allQuizQuestions.length;
      const score =
        totalCount > 0
          ? Math.round((correctCount / totalCount) * 100)
          : 0;
      const wrongCount = totalCount - correctCount;

      // 更新 quiz 状态
      await this.db
        .update(aiQuizzes)
        .set({
          status: 'completed',
          score,
          correctCount,
          submittedAt: now,
        })
        .where(eq(aiQuizzes.id, quizId));

      // 写入错题本（upsert）
      for (const entry of wrongQuestionEntries) {
        const existing = await this.db
          .select({ id: aiWrongQuestions.id })
          .from(aiWrongQuestions)
          .where(
            and(
              sql`(${aiWrongQuestions.userId}).user_id = ${userId}`,
              eq(aiWrongQuestions.questionId, entry.questionId),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          await this.db
            .update(aiWrongQuestions)
            .set({
              wrongCount: sql`${aiWrongQuestions.wrongCount} + 1`,
              lastWrongAt: now,
            })
            .where(eq(aiWrongQuestions.id, existing[0].id));
        } else {
          await this.db.insert(aiWrongQuestions).values({
            userId,
            questionId: entry.questionId,
            subject: entry.subject,
            wrongCount: 1,
            lastWrongAt: now,
            mastered: false,
          });
        }
      }

      // 重新获取 quiz 记录
      const finalQuizRecords = await this.db
        .select()
        .from(aiQuizzes)
        .where(eq(aiQuizzes.id, quizId))
        .limit(1);

      const quiz = this.mapToAIQuiz(finalQuizRecords[0]);

      return {
        quiz,
        questions: updatedQuizQuestions,
        correctCount,
        totalCount,
        score,
        wrongCount,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        '提交答题结果失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async listAIQuizzes(params: {
    userId: string;
    subject?: string;
    page: number;
    pageSize: number;
  }): Promise<PagedResponse<AIQuiz>> {
    const { userId, subject, page, pageSize } = params;

    if (page < 1) {
      throw new BadRequestException('page 必须大于等于 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('pageSize 必须在 1-100 之间');
    }

    try {
      const conditions: SQL<unknown>[] = [sql`(${aiQuizzes.userId}).user_id = ${userId}`];
      if (subject) {
        conditions.push(eq(aiQuizzes.subject, subject));
      }

      const offset = (page - 1) * pageSize;
      const where = and(...conditions);

      const [itemsResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(aiQuizzes)
          .where(where)
          .orderBy(desc(aiQuizzes.createdAt))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(aiQuizzes)
          .where(where),
      ]);

      const total = Number(countResult[0]?.count ?? 0);
      const items: AIQuiz[] = itemsResult.map((r) => this.mapToAIQuiz(r));

      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error(
        '获取出题历史列表失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async listAIWrongQuestions(params: {
    userId: string;
    subject?: string;
    mastered?: boolean;
    page: number;
    pageSize: number;
  }): Promise<PagedResponse<AIWrongQuestion>> {
    const { userId, subject, mastered, page, pageSize } = params;

    if (page < 1) {
      throw new BadRequestException('page 必须大于等于 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('pageSize 必须在 1-100 之间');
    }

    try {
      const conditions: SQL<unknown>[] = [sql`(${aiWrongQuestions.userId}).user_id = ${userId}`];
      if (subject) {
        conditions.push(eq(aiWrongQuestions.subject, subject));
      }
      if (mastered !== undefined) {
        conditions.push(eq(aiWrongQuestions.mastered, mastered));
      }

      const offset = (page - 1) * pageSize;
      const where = and(...conditions);

      const [itemsResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(aiWrongQuestions)
          .where(where)
          .orderBy(desc(aiWrongQuestions.lastWrongAt))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(aiWrongQuestions)
          .where(where),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      // 关联题目详情
      const questionIds: string[] = itemsResult.map(
        (r: typeof aiWrongQuestions.$inferSelect) => r.questionId,
      );
      const questionMap = new Map<string, Question>();
      if (questionIds.length > 0) {
        const questionRecords = await this.db
          .select()
          .from(questions)
          .where(inArray(questions.id, questionIds));
        for (const row of questionRecords) {
          questionMap.set(row.id, this.mapToQuestion(row));
        }
      }

      const items: AIWrongQuestion[] = itemsResult.map((r) => {
        const wq = this.mapToAIWrongQuestion(r);
        wq.question = questionMap.get(r.questionId);
        return wq;
      });

      return { items, total, page, pageSize };
    } catch (error) {
      this.logger.error(
        '获取错题本列表失败',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private checkAnswer(
    questionType: string,
    userAnswer: string,
    correctAnswer: string,
  ): boolean {
    if (questionType === 'true_false') {
      // 判断题：比较 'true'/'false' 字符串（不区分大小写）
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }
    if (
      questionType === 'choice' ||
      questionType.includes('choice') ||
      questionType === 'multiple_choice'
    ) {
      // 选择题：比较选项 label（不区分大小写，去空格）
      return userAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
    }
    // 填空题/其他：比较答案文本（去掉首尾空格）
    return userAnswer.trim() === correctAnswer.trim();
  }

  private mapToAIQuiz(row: typeof aiQuizzes.$inferSelect): AIQuiz {
    return {
      id: row.id,
      userId: row.userId,
      subject: row.subject,
      grade: row.grade,
      semester: row.semester,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      questionType: row.questionType,
      difficulty: row.difficulty,
      totalCount: row.totalCount,
      status: row.status as AIQuiz['status'],
      score: row.score ?? undefined,
      correctCount: row.correctCount ?? undefined,
      startedAt: row.startedAt ? row.startedAt.toISOString() : undefined,
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapToAIQuizQuestion(
    row: typeof aiQuizQuestions.$inferSelect,
  ): AIQuizQuestion {
    return {
      id: row.id,
      quizId: row.quizId,
      questionId: row.questionId,
      questionOrder: row.questionOrder,
      userAnswer: row.userAnswer ?? undefined,
      isCorrect: row.isCorrect ?? undefined,
      answeredAt: row.answeredAt ? row.answeredAt.toISOString() : undefined,
    };
  }

  private mapToAIWrongQuestion(
    row: typeof aiWrongQuestions.$inferSelect,
  ): AIWrongQuestion {
    return {
      id: row.id,
      userId: row.userId,
      questionId: row.questionId,
      subject: row.subject,
      wrongCount: row.wrongCount,
      lastWrongAt: row.lastWrongAt.toISOString(),
      mastered: row.mastered,
    };
  }

  private mapToQuestion(row: typeof questions.$inferSelect): Question {
    const optsRaw = row.options as unknown as QuestionOption[] | undefined;
    const options: QuestionOption[] = Array.isArray(optsRaw) ? optsRaw : [];

    return {
      id: row.id,
      subject: row.subject,
      grade: row.grade,
      semester: row.semester,
      textbookId: row.textbookId ?? undefined,
      unitId: row.unitId ?? undefined,
      knowledgePoint: row.knowledgePoint ?? undefined,
      questionType: row.questionType,
      difficulty: row.difficulty,
      stem: row.stem,
      options,
      answer: row.answer,
      analysis: row.analysis ?? undefined,
      source: row.source ?? 'ai_generated',
      createdAt: row.createdAt.toISOString(),
    };
  }
}
