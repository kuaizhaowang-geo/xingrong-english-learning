import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
  CapabilityService,
} from '@lark-apaas/fullstack-nestjs-core';
import { aiCourses } from '@server/database/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type {
  AICourse,
  AICourseContent,
  PagedResponse,
  CreateAICourseDto,
} from '@shared/api.interface';
import type {
  GenerateCustomEnglishLearningCourseOneInput,
  GenerateCustomEnglishLearningCourseOneOutput,
} from '@shared/plugin-types';

const PLUGIN_INSTANCE_ID = 'generate_custom_english_learning_course_1';

@Injectable()
export class AICoursesService {
  private readonly logger = new Logger(AICoursesService.name);
  private capability: ReturnType<CapabilityService['load']> | null = null;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly capabilityService: CapabilityService,
  ) {}

  private getCapability() {
    if (!this.capability) {
      this.capability = this.capabilityService.load(PLUGIN_INSTANCE_ID);
    }
    return this.capability;
  }

  async getMyCourses(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PagedResponse<AICourse>> {
    if (page < 1) {
      throw new BadRequestException('page 必须大于等于 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('pageSize 必须在 1-100 之间');
    }

    try {
      const offset = (page - 1) * pageSize;

      const [itemsResult, countResult] = await Promise.all([
        this.db
          .select({
            id: aiCourses.id,
            title: aiCourses.title,
            topic: aiCourses.topic,
            learningGoal: aiCourses.learningGoal,
            level: aiCourses.level,
            content: aiCourses.content,
            status: aiCourses.status,
            createdAt: aiCourses.createdAt,
          })
          .from(aiCourses)
          .where(eq(aiCourses.userProfile, userId))
          .orderBy(desc(aiCourses.createdAt))
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ count: count() })
          .from(aiCourses)
          .where(eq(aiCourses.userProfile, userId)),
      ]);

      const total = Number(countResult[0]?.count ?? 0);
      const items: AICourse[] = itemsResult.map((r) => this.mapToAICourse(r));

      return {
        items,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error('获取AI课程列表失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getById(userId: string, id: string): Promise<AICourse> {
    try {
      const records = await this.db
        .select({
          id: aiCourses.id,
          userProfile: aiCourses.userProfile,
          title: aiCourses.title,
          topic: aiCourses.topic,
          learningGoal: aiCourses.learningGoal,
          level: aiCourses.level,
          content: aiCourses.content,
          status: aiCourses.status,
          createdAt: aiCourses.createdAt,
        })
        .from(aiCourses)
        .where(eq(aiCourses.id, id))
        .limit(1);

      if (records.length === 0) {
        throw new NotFoundException('AI 课程不存在');
      }

      const record = records[0];
      if (record.userProfile !== userId) {
        throw new ForbiddenException('无权访问此课程');
      }

      return this.mapToAICourse(record);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('获取AI课程详情失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async generateCourse(userId: string, dto: CreateAICourseDto): Promise<AICourse> {
    if (!dto.topic || dto.topic.trim() === '') {
      throw new BadRequestException('topic 不能为空');
    }

    const topic = dto.topic.trim();
    const level = dto.level ?? 'intermediate';
    const learningGoal = dto.learningGoal ?? '掌握相关英语表达，提升日常交流能力';
    const title = dto.title?.trim() || `${topic} - AI定制课程`;

    try {
      // 调用 AI 插件生成内容
      const capability = this.getCapability();
      const input: GenerateCustomEnglishLearningCourseOneInput = {
        topic,
        learning_objective: learningGoal,
        level,
      };

      let rawContent = '';

      try {
        const streamResult = (await capability.callStream(
          'textGenerate',
          input,
        )) as unknown as
          | AsyncIterable<GenerateCustomEnglishLearningCourseOneOutput>
          | { output: AsyncIterable<GenerateCustomEnglishLearningCourseOneOutput> };

        const resultObj = streamResult as Record<string, unknown>;
        const outputVal = resultObj.output as Record<string, unknown> | undefined;
        const hasOutputStream = !!outputVal &&
          typeof outputVal[Symbol.asyncIterator as unknown as string] === 'function';
        const stream: AsyncIterable<GenerateCustomEnglishLearningCourseOneOutput> =
          hasOutputStream
            ? (outputVal as unknown as AsyncIterable<GenerateCustomEnglishLearningCourseOneOutput>)
            : (streamResult as AsyncIterable<GenerateCustomEnglishLearningCourseOneOutput>);

        for await (const chunk of stream) {
          if (chunk && typeof chunk.content === 'string') {
            rawContent += chunk.content;
          }
        }
      } catch (callError) {
        const errMsg = callError instanceof Error ? callError.message : String(callError);
        this.logger.error(`AI 生文插件调用失败，启用离线模板降级: ${errMsg}`);
        rawContent = this.generateOfflineCourse(topic, level, learningGoal);
      }

      if (!rawContent || rawContent.trim() === '') {
        rawContent = this.generateOfflineCourse(topic, level, learningGoal);
      }

      // 解析 JSON 内容，处理可能包裹的 markdown 代码块
      const content = this.parseAIJsonContent(rawContent);

      // 保存到数据库
      const inserted = await this.db
        .insert(aiCourses)
        .values({
          userProfile: userId,
          title,
          topic,
          learningGoal,
          level,
          content: content as unknown as Record<string, unknown>,
          status: 'published',
        })
        .returning({ id: aiCourses.id });

      const result = await this.db
        .select({
          id: aiCourses.id,
          title: aiCourses.title,
          topic: aiCourses.topic,
          learningGoal: aiCourses.learningGoal,
          level: aiCourses.level,
          content: aiCourses.content,
          status: aiCourses.status,
          createdAt: aiCourses.createdAt,
        })
        .from(aiCourses)
        .where(eq(aiCourses.id, inserted[0].id));

      return this.mapToAICourse(result[0]);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error('生成AI课程失败', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException(
        `生成 AI 课程失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteCourse(userId: string, id: string): Promise<void> {
    try {
      const existing = await this.db
        .select({
          id: aiCourses.id,
          userProfile: aiCourses.userProfile,
        })
        .from(aiCourses)
        .where(eq(aiCourses.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('AI 课程不存在');
      }

      if (existing[0].userProfile !== userId) {
        throw new ForbiddenException('无权删除此课程');
      }

      const deleted = await this.db
        .delete(aiCourses)
        .where(eq(aiCourses.id, id))
        .returning({ id: aiCourses.id });

      if (deleted.length === 0) {
        throw new NotFoundException('删除失败，课程不存在');
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error('删除AI课程失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private generateOfflineCourse(topic: string, level: string, goal: string): string {
    const levelLabel: Record<string, string> = {
      beginner: '初级',
      intermediate: '中级',
      upper: '高级',
    };
    const label = levelLabel[level] || '中级';
    const words = [
      { word: `${topic} 1`, phonetic: '/.../', meaning: '核心词汇1', example: `This is a ${topic} example.` },
      { word: `${topic} 2`, phonetic: '/.../', meaning: '核心词汇2', example: `I learn ${topic} every day.` },
      { word: `${topic} 3`, phonetic: '/.../', meaning: '核心词汇3', example: `She is good at ${topic}.` },
      { word: `${topic} 4`, phonetic: '/.../', meaning: '核心词汇4', example: `${topic} is important for us.` },
      { word: `${topic} 5`, phonetic: '/.../', meaning: '核心词汇5', example: `We practice ${topic} together.` },
      { word: `${topic} 6`, phonetic: '/.../', meaning: '核心词汇6', example: `He enjoys learning ${topic}.` },
      { word: `${topic} 7`, phonetic: '/.../', meaning: '核心词汇7', example: `${topic} makes progress step by step.` },
      { word: `${topic} 8`, phonetic: '/.../', meaning: '核心词汇8', example: `Keep on with your ${topic} study.` },
    ];
    const sentences = [
      { sentence: 'I want to improve my English.', translation: '我想提高我的英语水平。', components: [{ id: '1', text: 'I', type: 'subject' }, { id: '2', text: 'want to improve', type: 'verb' }, { id: '3', text: 'my English', type: 'object' }, { id: '4', text: '.', type: 'punctuation' }] },
      { sentence: 'Learning a new language takes time.', translation: '学习一门新语言需要时间。', components: [{ id: '1', text: 'Learning a new language', type: 'subject' }, { id: '2', text: 'takes', type: 'verb' }, { id: '3', text: 'time', type: 'object' }, { id: '4', text: '.', type: 'punctuation' }] },
      { sentence: 'Practice makes perfect.', translation: '熟能生巧。', components: [{ id: '1', text: 'Practice', type: 'subject' }, { id: '2', text: 'makes', type: 'verb' }, { id: '3', text: 'perfect', type: 'complement' }, { id: '4', text: '.', type: 'punctuation' }] },
      { sentence: 'She speaks English fluently.', translation: '她英语说得很流利。', components: [{ id: '1', text: 'She', type: 'subject' }, { id: '2', text: 'speaks', type: 'verb' }, { id: '3', text: 'English', type: 'object' }, { id: '4', text: 'fluently', type: 'adverb' }, { id: '5', text: '.', type: 'punctuation' }] },
      { sentence: 'Reading is a good way to learn.', translation: '阅读是学习的好方法。', components: [{ id: '1', text: 'Reading', type: 'subject' }, { id: '2', text: 'is', type: 'verb' }, { id: '3', text: 'a good way to learn', type: 'complement' }, { id: '4', text: '.', type: 'punctuation' }] },
      { sentence: 'We can practice together every day.', translation: '我们可以每天一起练习。', components: [{ id: '1', text: 'We', type: 'subject' }, { id: '2', text: 'can practice', type: 'verb' }, { id: '3', text: 'together', type: 'adverb' }, { id: '4', text: 'every day', type: 'adverbial' }, { id: '5', text: '.', type: 'punctuation' }] },
    ];
    const dialogues = [
      { speaker: 'A', text: `Hello! Let's start our ${topic} lesson.`, translation: `你好！我们开始${topic}课程吧。` },
      { speaker: 'B', text: 'Great! I am ready to learn.', translation: '太好了！我准备好学习了。' },
      { speaker: 'A', text: 'What would you like to focus on today?', translation: '你今天想重点学什么？' },
      { speaker: 'B', text: `I want to improve my ${topic} skills.`, translation: `我想提高我的${topic}技能。` },
    ];
    const grammars = [
      { point: '一般现在时', explanation: '表示经常性、习惯性的动作或状态，常与 always, usually, every day 等时间状语连用。', example: 'I study English every day.' },
      { point: '名词复数', explanation: '大多数名词直接加 -s；以 s, x, ch, sh 结尾的加 -es；辅音字母+y 结尾的变 y 为 i 再加 -es。', example: 'book → books, box → boxes, city → cities' },
    ];
    return JSON.stringify({
      words,
      sentences,
      dialogues,
      grammar: grammars,
      vocabulary: [topic, label, goal],
    });
  }

  private parseAIJsonContent(raw: string): AICourseContent {
    let jsonStr = raw.trim();

    // 去除可能的 markdown 代码块包裹
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // 找到第一个 { 和最后一个 } 之间的内容
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(jsonStr) as AICourseContent;

      // 基本结构校验和补全
      return {
        words: Array.isArray(parsed.words) ? parsed.words : [],
        sentences: Array.isArray(parsed.sentences) ? parsed.sentences : [],
        dialogues: Array.isArray(parsed.dialogues) ? parsed.dialogues : [],
        grammar: Array.isArray(parsed.grammar) ? parsed.grammar : [],
        vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : undefined,
      };
    } catch (parseError) {
      this.logger.error(
        `AI 返回内容 JSON 解析失败，原始内容：${raw.slice(0, 500)}`,
        parseError instanceof Error ? parseError.stack : String(parseError),
      );
      throw new InternalServerErrorException('AI 返回内容格式错误，无法解析为课程结构');
    }
  }

  private mapToAICourse(row: {
    id: string;
    title: string;
    topic: string;
    learningGoal: string | null;
    level: string | null;
    content: unknown;
    status: string | null;
    createdAt: Date;
  }): AICourse {
    const content = (row.content ?? {}) as AICourseContent;
    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      learningGoal: row.learningGoal ?? undefined,
      level: row.level ?? 'intermediate',
      content,
      status: row.status ?? 'draft',
      createdAt: row.createdAt.toISOString(),
    };
  }
}
