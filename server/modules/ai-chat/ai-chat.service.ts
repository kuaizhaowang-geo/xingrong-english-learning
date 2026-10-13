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
  CapabilityService,
} from '@lark-apaas/fullstack-nestjs-core';
import { aiChatSessions, aiChatMessages } from '@server/database/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type {
  AiChatSession,
  AiChatMessage,
  AiChatSessionWithMessages,
  SendMessageResponse,
  CreateAiChatSessionDto,
  SendMessageDto,
} from '@shared/api.interface';

const PLUGIN_INSTANCE_ID = 'english_conversation_tutor_1';
const MAX_HISTORY_MESSAGES = 10;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
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

  /**
   * 获取当前用户的所有会话，按 updated_at 倒序
   */
  async getSessions(userId: string): Promise<AiChatSession[]> {
    try {
      const records = await this.db
        .select({
          id: aiChatSessions.id,
          title: aiChatSessions.title,
          topic: aiChatSessions.topic,
          assistantName: aiChatSessions.assistantName,
          assistantAccent: aiChatSessions.assistantAccent,
          updatedAt: aiChatSessions.updatedAt,
        })
        .from(aiChatSessions)
        .where(eq(aiChatSessions.userProfile, userId))
        .orderBy(desc(aiChatSessions.updatedAt));

      return records.map((r) => this.mapToSession(r));
    } catch (error) {
      this.logger.error('获取会话列表失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * 创建新会话
   */
  async createSession(
    userId: string,
    dto: CreateAiChatSessionDto,
  ): Promise<AiChatSession> {
    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException('title 不能为空');
    }

    const title = dto.title.trim();
    const topic = dto.topic?.trim() || '日常社交';
    const assistantName = dto.assistantName?.trim() || 'Lisa';
    const assistantAccent = dto.assistantAccent?.trim() || 'american';

    try {
      const inserted = await this.db
        .insert(aiChatSessions)
        .values({
          userProfile: userId,
          title,
          topic,
          assistantName,
          assistantAccent,
        })
        .returning({ id: aiChatSessions.id });

      const records = await this.db
        .select({
          id: aiChatSessions.id,
          title: aiChatSessions.title,
          topic: aiChatSessions.topic,
          assistantName: aiChatSessions.assistantName,
          assistantAccent: aiChatSessions.assistantAccent,
          createdAt: aiChatSessions.createdAt,
          updatedAt: aiChatSessions.updatedAt,
        })
        .from(aiChatSessions)
        .where(eq(aiChatSessions.id, inserted[0].id))
        .limit(1);

      return this.mapToSession(records[0]);
    } catch (error) {
      this.logger.error('创建会话失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * 获取会话详情 + 消息列表
   */
  async getSessionDetail(
    userId: string,
    sessionId: string,
  ): Promise<AiChatSessionWithMessages> {
    try {
      // 查会话
      const sessions = await this.db
        .select({
          id: aiChatSessions.id,
          userProfile: aiChatSessions.userProfile,
          title: aiChatSessions.title,
          topic: aiChatSessions.topic,
          assistantName: aiChatSessions.assistantName,
          assistantAccent: aiChatSessions.assistantAccent,
          createdAt: aiChatSessions.createdAt,
          updatedAt: aiChatSessions.updatedAt,
        })
        .from(aiChatSessions)
        .where(eq(aiChatSessions.id, sessionId))
        .limit(1);

      if (sessions.length === 0) {
        throw new NotFoundException('会话不存在');
      }

      const session = sessions[0];
      if (session.userProfile !== userId) {
        throw new ForbiddenException('无权访问此会话');
      }

      // 查消息
      const messages = await this.db
        .select({
          id: aiChatMessages.id,
          sessionId: aiChatMessages.sessionId,
          role: aiChatMessages.role,
          content: aiChatMessages.content,
          correction: aiChatMessages.correction,
          suggestion: aiChatMessages.suggestion,
          audioUrl: aiChatMessages.audioUrl,
          createdAt: aiChatMessages.createdAt,
        })
        .from(aiChatMessages)
        .where(eq(aiChatMessages.sessionId, sessionId))
        .orderBy(asc(aiChatMessages.createdAt));

      return {
        session: this.mapToSession(session),
        messages: messages.map((m) => this.mapToMessage(m)),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('获取会话详情失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * 删除会话（级联删除消息）
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    try {
      const existing = await this.db
        .select({
          id: aiChatSessions.id,
          userProfile: aiChatSessions.userProfile,
        })
        .from(aiChatSessions)
        .where(eq(aiChatSessions.id, sessionId))
        .limit(1);

      if (existing.length === 0) {
        throw new NotFoundException('会话不存在');
      }

      if (existing[0].userProfile !== userId) {
        throw new ForbiddenException('无权删除此会话');
      }

      const deleted = await this.db
        .delete(aiChatSessions)
        .where(eq(aiChatSessions.id, sessionId))
        .returning({ id: aiChatSessions.id });

      if (deleted.length === 0) {
        throw new NotFoundException('删除失败，会话不存在');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('删除会话失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * 发送消息并获取 AI 回复
   */
  async sendMessage(
    userId: string,
    sessionId: string,
    dto: SendMessageDto,
  ): Promise<SendMessageResponse> {
    if (!dto.content || dto.content.trim() === '') {
      throw new BadRequestException('content 不能为空');
    }

    const userContent = dto.content.trim();

    try {
      // a. 校验会话归属
      const sessions = await this.db
        .select({
          id: aiChatSessions.id,
          userProfile: aiChatSessions.userProfile,
          topic: aiChatSessions.topic,
          title: aiChatSessions.title,
        })
        .from(aiChatSessions)
        .where(eq(aiChatSessions.id, sessionId))
        .limit(1);

      if (sessions.length === 0) {
        throw new NotFoundException('会话不存在');
      }

      if (sessions[0].userProfile !== userId) {
        throw new ForbiddenException('无权访问此会话');
      }

      const session = sessions[0];

      // b. 保存用户消息
      const userMsgInserted = await this.db
        .insert(aiChatMessages)
        .values({
          sessionId,
          userProfile: userId,
          role: 'user',
          content: userContent,
        })
        .returning({ id: aiChatMessages.id });

      // c. 组装 conversation_history（最近10条消息）
      const recentMessages = await this.db
        .select({
          role: aiChatMessages.role,
          content: aiChatMessages.content,
        })
        .from(aiChatMessages)
        .where(eq(aiChatMessages.sessionId, sessionId))
        .orderBy(desc(aiChatMessages.createdAt))
        .limit(MAX_HISTORY_MESSAGES);

      // 按时间正序排列历史
      const conversationHistory = recentMessages
        .reverse()
        .map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        }));

      // d. 调用 AI 插件（非流式 call）
      let replyText = '';
      let correction = '';
      let suggestion = '';

      try {
        const capability = this.getCapability();
        const input = {
          user_input: userContent,
          topic: session.topic,
          conversation_history: conversationHistory,
        };

        const result = (await capability.call('textGenerate', input)) as Record<string, unknown>;
        const rawContent = typeof result.content === 'string' ? result.content : '';

        // e. 解析 AI 返回
        if (rawContent) {
          const parsed = this.parseAiResponse(rawContent);
          replyText = parsed.replyText;
          correction = parsed.correction;
          suggestion = parsed.suggestion;
        }

        if (!replyText) {
          replyText = "I'm sorry, I'm having trouble understanding. Let's try again!";
        }
      } catch (callError) {
        const errMsg = callError instanceof Error ? callError.message : String(callError);
        this.logger.error(`AI 对话插件调用失败，启用降级回复: ${errMsg}`);
        // 失败降级
        replyText = "I'm sorry, I'm having trouble connecting. Let's try again!";
        correction = '';
        suggestion = '';
      }

      // f. 保存 AI 消息
      const assistantMsgInserted = await this.db
        .insert(aiChatMessages)
        .values({
          sessionId,
          userProfile: userId,
          role: 'assistant',
          content: replyText,
          correction: correction || null,
          suggestion: suggestion || null,
        })
        .returning({ id: aiChatMessages.id });

      // g. 更新会话 updated_at
      await this.db
        .update(aiChatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(aiChatSessions.id, sessionId));

      // 返回用户消息 + AI 消息
      const [userMsgResult, assistantMsgResult] = await Promise.all([
        this.db
          .select({
            id: aiChatMessages.id,
            sessionId: aiChatMessages.sessionId,
            role: aiChatMessages.role,
            content: aiChatMessages.content,
            correction: aiChatMessages.correction,
            suggestion: aiChatMessages.suggestion,
            audioUrl: aiChatMessages.audioUrl,
            createdAt: aiChatMessages.createdAt,
          })
          .from(aiChatMessages)
          .where(eq(aiChatMessages.id, userMsgInserted[0].id))
          .limit(1),
        this.db
          .select({
            id: aiChatMessages.id,
            sessionId: aiChatMessages.sessionId,
            role: aiChatMessages.role,
            content: aiChatMessages.content,
            correction: aiChatMessages.correction,
            suggestion: aiChatMessages.suggestion,
            audioUrl: aiChatMessages.audioUrl,
            createdAt: aiChatMessages.createdAt,
          })
          .from(aiChatMessages)
          .where(eq(aiChatMessages.id, assistantMsgInserted[0].id))
          .limit(1),
      ]);

      return {
        userMessage: this.mapToMessage(userMsgResult[0]),
        assistantMessage: this.mapToMessage(assistantMsgResult[0]),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('发送消息失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * 解析 AI 返回的内容，提取对话回复、语法纠错、地道表达建议
   */
  private parseAiResponse(rawContent: string): {
    replyText: string;
    correction: string;
    suggestion: string;
  } {
    const replyMatch = rawContent.match(/【对话回复】([\s\S]*?)(?=【|$)/);
    const correctionMatch = rawContent.match(/【语法纠错】([\s\S]*?)(?=【|$)/);
    const suggestionMatch = rawContent.match(/【地道表达建议】([\s\S]*?)(?=【|$)/);

    return {
      replyText: replyMatch ? replyMatch[1].trim() : rawContent.trim(),
      correction: correctionMatch ? correctionMatch[1].trim() : '',
      suggestion: suggestionMatch ? suggestionMatch[1].trim() : '',
    };
  }

  private mapToSession(record: Record<string, unknown>): AiChatSession {
    const updatedAtRaw = record.updatedAt;
    const createdAtRaw = record.createdAt;

    return {
      id: record.id as string,
      title: record.title as string,
      topic: record.topic as string,
      assistantName: record.assistantName as string,
      assistantAccent: record.assistantAccent as string,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : String(createdAtRaw ?? ''),
      updatedAt: updatedAtRaw instanceof Date ? updatedAtRaw.toISOString() : String(updatedAtRaw ?? ''),
    };
  }

  private mapToMessage(record: Record<string, unknown>): AiChatMessage {
    const createdAtRaw = record.createdAt;

    return {
      id: record.id as string,
      sessionId: record.sessionId as string,
      role: record.role as string,
      content: record.content as string,
      correction: (record.correction as string) || undefined,
      suggestion: (record.suggestion as string) || undefined,
      audioUrl: (record.audioUrl as string) || undefined,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : String(createdAtRaw ?? ''),
    };
  }
}
