import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { studyJournals } from '@server/database/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import type {
  StudyJournal,
  PagedResponse,
  UpdateJournalDto,
  JournalType,
  JournalCalendarResponse,
  AiSummarizeResponse,
  AiWrongQuestionDto,
  AiWrongQuestionResponse,
  AiKnowledgeOrganizeResponse,
} from '@shared/api.interface';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getList(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    type?: JournalType,
  ): Promise<PagedResponse<StudyJournal>> {
    if (page < 1) {
      throw new BadRequestException('page 必须大于等于 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('pageSize 必须在 1-100 之间');
    }

    try {
      const offset = (page - 1) * pageSize;

      const allItemsResult = await this.db
        .select({
          id: studyJournals.id,
          journalDate: studyJournals.journalDate,
          content: studyJournals.content,
          mood: studyJournals.mood,
          masteryScore: studyJournals.masteryScore,
          highlights: studyJournals.highlights,
        })
        .from(studyJournals)
        .where(eq(studyJournals.userProfile, userId))
        .orderBy(desc(studyJournals.journalDate));

      let allItems: StudyJournal[] = allItemsResult.map((r) => this.mapToStudyJournal(r));

      if (type) {
        allItems = allItems.filter((item: StudyJournal) => item.type === type);
      }

      const total = allItems.length;
      const items: StudyJournal[] = allItems.slice(offset, offset + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error('获取手账列表失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async search(
    userId: string,
    query: string,
  ): Promise<StudyJournal[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const keyword = query.trim();
    const likePattern = `%${keyword}%`;

    try {
      const results = await this.db
        .select({
          id: studyJournals.id,
          journalDate: studyJournals.journalDate,
          content: studyJournals.content,
          mood: studyJournals.mood,
          masteryScore: studyJournals.masteryScore,
          highlights: studyJournals.highlights,
        })
        .from(studyJournals)
        .where(
          and(
            eq(studyJournals.userProfile, userId),
            sql`${studyJournals.content} ILIKE ${likePattern}`,
          ),
        )
        .orderBy(desc(studyJournals.journalDate))
        .limit(50);

      return results.map((r) => this.mapToStudyJournal(r));
    } catch (error) {
      this.logger.error('搜索手账失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getCalendar(
    userId: string,
    year: number,
    month: number,
  ): Promise<JournalCalendarResponse> {
    if (year < 2000 || year > 2100) {
      throw new BadRequestException('年份无效');
    }
    if (month < 1 || month > 12) {
      throw new BadRequestException('月份无效，应为 1-12');
    }

    const monthStr = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const nextMonth = month === 12 ? year + 1 : year;
    const nextMonthStr = month === 12 ? '01' : (month + 1).toString().padStart(2, '0');
    const endDate = `${nextMonth}-${nextMonthStr}-01`;

    try {
      const rows = await this.db
        .select({
          journalDate: studyJournals.journalDate,
          mood: studyJournals.mood,
          masteryScore: studyJournals.masteryScore,
        })
        .from(studyJournals)
        .where(
          and(
            eq(studyJournals.userProfile, userId),
            sql`${studyJournals.journalDate} >= ${startDate}::date`,
            sql`${studyJournals.journalDate} < ${endDate}::date`,
          ),
        );

      const calendar: JournalCalendarResponse = {};
      for (const row of rows) {
        calendar[row.journalDate] = {
          hasJournal: true,
          mood: row.mood ?? undefined,
          masteryScore: row.masteryScore ?? undefined,
        };
      }
      return calendar;
    } catch (error) {
      this.logger.error('获取手账日历失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async summarize(content: string): Promise<AiSummarizeResponse> {
    if (!content || content.trim().length === 0) {
      return { summary: 'AI学习总结：暂无内容' };
    }

    const sentences = content
      .split(/[。！？.!?\n]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    let summary: string;
    if (sentences.length <= 3) {
      summary = content.trim();
    } else {
      summary = sentences.slice(0, 3).join('。') + '。';
    }

    return { summary: `AI学习总结：${summary}` };
  }

  async wrongQuestionAnalysis(dto: AiWrongQuestionDto): Promise<AiWrongQuestionResponse> {
    const { question, wrongAnswer, correctAnswer } = dto;

    if (!question || question.trim().length === 0) {
      throw new BadRequestException('题目不能为空');
    }

    const keywords = this.extractKeywords(question);
    const mainKeyword = keywords.length > 0 ? keywords[0] : '相关';

    const analysisParts: string[] = [];
    analysisParts.push(`这道题考查的是${mainKeyword}知识点。`);

    if (wrongAnswer) {
      analysisParts.push(`错误答案「${wrongAnswer}」的错误原因可能是对概念理解不透彻，或者混淆了相似用法。`);
    } else {
      analysisParts.push('错误原因可能是对概念理解不透彻，或者混淆了相似用法。');
    }

    if (correctAnswer) {
      analysisParts.push(`正确答案是「${correctAnswer}」。`);
    }

    analysisParts.push('建议从以下角度复习：');
    analysisParts.push(`1. 回顾${mainKeyword}的基本定义和核心用法`);
    analysisParts.push('2. 整理常见易错点，对比记忆容易混淆的概念');
    analysisParts.push('3. 多做同类型练习题，加深理解并总结解题思路');

    const similarQuestions: string[] = [
      `练习1：下列关于${mainKeyword}的说法，正确的是？`,
      `练习2：请用${mainKeyword}相关知识分析下面的句子。`,
      `练习3：对比${mainKeyword}与其他相关概念的区别与联系。`,
    ];

    return {
      analysis: analysisParts.join(''),
      similarQuestions,
    };
  }

  async knowledgeOrganize(knowledge: string): Promise<AiKnowledgeOrganizeResponse> {
    if (!knowledge || knowledge.trim().length === 0) {
      return { structured: '暂无知识点内容' };
    }

    const lines = knowledge
      .split(/[。\n；;]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const keywords = this.extractKeywords(knowledge);
    const mainKeyword = keywords.length > 0 ? keywords[0] : '综合';

    const parts: string[] = [];
    parts.push('【知识要点】');
    lines.slice(0, 8).forEach((line: string, index: number) => {
      parts.push(`${index + 1}. ${line}`);
    });

    parts.push('');
    parts.push('【分类标签建议】');
    const tagSuggestions = [
      `#${mainKeyword}`,
      '#核心概念',
      '#重点掌握',
      '#复习要点',
    ];
    parts.push(tagSuggestions.join(' '));

    parts.push('');
    parts.push('【相关知识点链接建议】');
    const relatedTopics = [
      `- ${mainKeyword}的基础概念与定义`,
      `- ${mainKeyword}的常见应用场景`,
      `- ${mainKeyword}与其他知识点的联系`,
      `- ${mainKeyword}的进阶拓展内容`,
    ];
    parts.push(relatedTopics.join('\n'));

    return { structured: parts.join('\n') };
  }

  async getByDate(userId: string, date: string): Promise<StudyJournal> {
    if (!this.isValidDate(date)) {
      throw new BadRequestException('日期格式无效，请使用 YYYY-MM-DD 格式');
    }

    try {
      const records = await this.db
        .select({
          id: studyJournals.id,
          userProfile: studyJournals.userProfile,
          journalDate: studyJournals.journalDate,
          content: studyJournals.content,
          mood: studyJournals.mood,
          masteryScore: studyJournals.masteryScore,
          highlights: studyJournals.highlights,
        })
        .from(studyJournals)
        .where(
          and(
            eq(studyJournals.userProfile, userId),
            sql`${studyJournals.journalDate} = ${date}::date`,
          ),
        )
        .limit(1);

      if (records.length === 0) {
        throw new NotFoundException('该日期的手账不存在');
      }

      const record = records[0];
      if (record.userProfile !== userId) {
        throw new ForbiddenException('无权访问此手账');
      }

      return this.mapToStudyJournal(record);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('获取手账详情失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async upsert(userId: string, dto: UpdateJournalDto): Promise<StudyJournal> {
    if (!dto.journalDate) {
      throw new BadRequestException('journalDate 不能为空');
    }
    if (!this.isValidDate(dto.journalDate)) {
      throw new BadRequestException('日期格式无效，请使用 YYYY-MM-DD 格式');
    }

    try {
      return await this.db.transaction(async (tx) => {
        const existing = await tx
          .select({
            id: studyJournals.id,
            userProfile: studyJournals.userProfile,
          })
          .from(studyJournals)
          .where(
            and(
              eq(studyJournals.userProfile, userId),
              sql`${studyJournals.journalDate} = ${dto.journalDate}::date`,
            ),
          )
          .limit(1);

        let recordId: string;

        if (existing.length === 0) {
          // 创建手账
          const inserted = await tx
            .insert(studyJournals)
            .values({
              userProfile: userId,
              journalDate: dto.journalDate,
              content: dto.content ?? null,
              mood: dto.mood ?? 'good',
              masteryScore: dto.masteryScore ?? 0,
              highlights: dto.highlights ?? [],
            })
            .returning({ id: studyJournals.id });
          recordId = inserted[0].id;
        } else {
          const record = existing[0];
          if (record.userProfile !== userId) {
            throw new ForbiddenException('无权修改此手账');
          }

          const patch: Partial<typeof studyJournals.$inferInsert> = {};
          if (dto.content !== undefined) patch.content = dto.content;
          if (dto.mood !== undefined) patch.mood = dto.mood;
          if (dto.masteryScore !== undefined) patch.masteryScore = dto.masteryScore;
          if (dto.highlights !== undefined) patch.highlights = dto.highlights;

          const updated = await tx
            .update(studyJournals)
            .set(patch)
            .where(eq(studyJournals.id, record.id))
            .returning({ id: studyJournals.id });
          recordId = updated[0].id;
        }

        const result = await tx
          .select({
            id: studyJournals.id,
            journalDate: studyJournals.journalDate,
            content: studyJournals.content,
            mood: studyJournals.mood,
            masteryScore: studyJournals.masteryScore,
            highlights: studyJournals.highlights,
          })
          .from(studyJournals)
          .where(eq(studyJournals.id, recordId));

        return this.mapToStudyJournal(result[0]);
      });
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('保存手账失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async deleteByDate(userId: string, date: string): Promise<void> {
    if (!this.isValidDate(date)) {
      throw new BadRequestException('日期格式无效，请使用 YYYY-MM-DD 格式');
    }

    try {
      const existing = await this.db
        .select({
          id: studyJournals.id,
          userProfile: studyJournals.userProfile,
        })
        .from(studyJournals)
        .where(
          and(
            eq(studyJournals.userProfile, userId),
            sql`${studyJournals.journalDate} = ${date}::date`,
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('该日期的手账不存在');
      }

      const record = existing[0];
      if (record.userProfile !== userId) {
        throw new ForbiddenException('无权删除此手账');
      }

      const deleted = await this.db
        .delete(studyJournals)
        .where(eq(studyJournals.id, record.id))
        .returning({ id: studyJournals.id });

      if (deleted.length === 0) {
        throw new NotFoundException('删除失败，手账不存在');
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('删除手账失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private isValidDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
  }

  private parseJournalContent(content: string | null): {
    type: JournalType;
    contentHtml?: string;
    tags: string[];
    images: string[];
    plainContent: string | undefined;
  } {
    if (!content) {
      return {
        type: 'diary',
        tags: [],
        images: [],
        plainContent: undefined,
      };
    }

    const trimmed = content.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as {
          type?: JournalType;
          contentHtml?: string;
          tags?: string[];
          images?: string[];
          content?: string;
        };
        return {
          type: this.validateJournalType(parsed.type),
          contentHtml: parsed.contentHtml,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          images: Array.isArray(parsed.images) ? parsed.images : [],
          plainContent: parsed.contentHtml ?? content,
        };
      } catch {
        // JSON 解析失败，按纯文本处理
        return {
          type: 'diary',
          tags: [],
          images: [],
          plainContent: content,
        };
      }
    }

    return {
      type: 'diary',
      tags: [],
      images: [],
      plainContent: content,
    };
  }

  private validateJournalType(value: unknown): JournalType {
    const validTypes: JournalType[] = ['diary', 'wrong-note', 'knowledge', 'free'];
    if (typeof value === 'string' && validTypes.includes(value as JournalType)) {
      return value as JournalType;
    }
    return 'diary';
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      '的', '是', '在', '了', '和', '与', '或', '及', '等', '也', '都', '就',
      '有', '我', '你', '他', '她', '它', '这', '那', '个', '吗', '呢', '吧',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    ]);

    const words = text
      .replace(/[\p{P}\p{S}\s]+/gu, ' ')
      .split(' ')
      .map((w: string) => w.trim())
      .filter((w: string) => w.length >= 2 && !stopWords.has(w.toLowerCase()));

    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);
  }

  private mapToStudyJournal(row: {
    id: string;
    journalDate: string;
    content: string | null;
    mood: string | null;
    masteryScore: number | null;
    highlights: string[] | null;
  }): StudyJournal {
    const richData = this.parseJournalContent(row.content);
    return {
      id: row.id,
      journalDate: row.journalDate,
      content: row.content ?? undefined,
      mood: row.mood ?? 'good',
      masteryScore: row.masteryScore ?? 0,
      highlights: row.highlights ?? [],
      type: richData.type,
      contentHtml: richData.contentHtml,
      tags: richData.tags,
      images: richData.images,
    };
  }
}
