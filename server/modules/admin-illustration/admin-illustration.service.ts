import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { and, count, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import axios from 'axios';

import {
  aiIllustrationTasks,
  aiIllustrations,
  appSettings,
  sentencePuzzles,
  wordItems,
} from '@server/database/schema';
import type {
  AiIllustration,
  AppSetting,
  AppSettingSaveRequest,
  IllustrationListResponse,
  IllustrationReviewRequest,
  IllustrationStats,
  IllustrationContentType,
} from '@shared/api.interface';

const DEFAULT_AI_SETTINGS: Array<{ key: string; value: string; description: string }> = [
  { key: 'ai_image_provider', value: 'dashscope', description: 'AI 插图生成服务提供商' },
  { key: 'dashscope_api_key', value: '', description: 'DashScope API Key' },
  { key: 'ai_image_model', value: 'wanx-v1', description: 'AI 插图生成模型' },
  { key: 'ai_image_size', value: '1024*1024', description: 'AI 插图默认尺寸' },
  { key: 'ai_default_style', value: 'cartoon_kids', description: 'AI 插图默认风格' },
  { key: 'ai_prompt_template', value: '', description: 'AI 插图提示词模板' },
];

@Injectable()
export class AdminIllustrationService {
  private readonly logger = new Logger(AdminIllustrationService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取 AI 设置列表
   * 从 app_settings 读取所有 ai_ 前缀的设置，未设置的返回默认值
   */
  async getAiSettings(): Promise<AppSetting[]> {
    const rows = await this.db
      .select({
        settingKey: appSettings.settingKey,
        settingValue: appSettings.settingValue,
        description: appSettings.description,
      })
      .from(appSettings)
      .where(sql`${appSettings.settingKey} LIKE 'ai_%' OR ${appSettings.settingKey} = 'dashscope_api_key'`);

    const settingMap = new Map<string, { value: string; description?: string }>();
    for (const row of rows) {
      settingMap.set(row.settingKey, {
        value: row.settingValue,
        description: row.description ?? undefined,
      });
    }

    const result: AppSetting[] = [];
    for (const def of DEFAULT_AI_SETTINGS) {
      const existing = settingMap.get(def.key);
      result.push({
        key: def.key,
        value: existing ? existing.value : def.value,
        description: existing?.description ?? def.description,
      });
    }
    return result;
  }

  /**
   * 保存单个 AI 设置
   */
  async saveAiSetting(dto: AppSettingSaveRequest): Promise<AppSetting> {
    if (!dto.key || dto.value === undefined || dto.value === null) {
      throw new BadRequestException('设置 key 和 value 不能为空');
    }

    const insertValues: typeof appSettings.$inferInsert = {
      settingKey: dto.key,
      settingValue: dto.value,
    };
    if (dto.description !== undefined) {
      insertValues.description = dto.description;
    }

    const updateSet: Record<string, unknown> = {
      settingValue: dto.value,
    };
    if (dto.description !== undefined) {
      updateSet.description = dto.description;
    }

    await this.db
      .insert(appSettings)
      .values(insertValues)
      .onConflictDoUpdate({
        target: appSettings.settingKey,
        set: updateSet,
      });

    this.logger.log(`保存 AI 设置: ${dto.key}`);

    return {
      key: dto.key,
      value: dto.value,
      description: dto.description,
    };
  }

  /**
   * 测试图像生成 API 连接
   */
  async testImageApi(
    provider: string,
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!apiKey) {
      return { success: false, message: 'API Key 不能为空' };
    }

    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
        {
          model: 'wanx-v1',
          input: { prompt: 'a cute cat, cartoon style' },
          parameters: { size: '256*256', n: 1 },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      if (response.status === 200 && response.data?.output?.task_id) {
        this.logger.log(`DashScope API 测试成功, provider=${provider}`);
        return { success: true, message: 'API 连接测试成功' };
      }

      const errMsg = response.data?.message || '未知错误';
      return { success: false, message: `API 返回异常: ${errMsg}` };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = err.response?.data?.message || err.message || '请求失败';
      this.logger.warn(`DashScope API 测试失败: ${errMsg}`);
      return { success: false, message: `连接失败: ${errMsg}` };
    }
  }

  /**
   * 获取插图列表（分页 + 筛选）
   */
  async getIllustrationList(params: {
    page: number;
    pageSize: number;
    contentType?: string;
    status?: string;
    keyword?: string;
  }): Promise<IllustrationListResponse> {
    const { page, pageSize, contentType, status, keyword } = params;

    const conditions = [];
    if (contentType) conditions.push(eq(aiIllustrations.contentType, contentType));
    if (status) conditions.push(eq(aiIllustrations.status, status));
    if (keyword) {
      conditions.push(ilike(aiIllustrations.contentText, `%${keyword}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(aiIllustrations)
        .where(whereClause),
      this.db
        .select()
        .from(aiIllustrations)
        .where(whereClause)
        .orderBy(desc(aiIllustrations.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const items: AiIllustration[] = rows.map((row) => ({
      id: row.id,
      contentType: row.contentType as IllustrationContentType,
      contentId: row.contentId,
      contentText: row.contentText,
      translation: row.translation ?? undefined,
      imageUrl: row.imageUrl,
      filePath: row.filePath ?? undefined,
      prompt: row.prompt,
      stylePreset: row.stylePreset,
      status: row.status as AiIllustration['status'],
      taskId: row.taskId ?? undefined,
      reviewNote: row.reviewNote ?? undefined,
      reviewedBy: row.reviewedBy ?? undefined,
      reviewedAt: row.reviewedAt ? (row.reviewedAt as Date).toISOString() : undefined,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  /**
   * 获取单张插图详情
   */
  async getIllustration(id: string): Promise<AiIllustration> {
    const rows = await this.db
      .select()
      .from(aiIllustrations)
      .where(eq(aiIllustrations.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('插图不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      contentType: row.contentType as IllustrationContentType,
      contentId: row.contentId,
      contentText: row.contentText,
      translation: row.translation ?? undefined,
      imageUrl: row.imageUrl,
      filePath: row.filePath ?? undefined,
      prompt: row.prompt,
      stylePreset: row.stylePreset,
      status: row.status as AiIllustration['status'],
      taskId: row.taskId ?? undefined,
      reviewNote: row.reviewNote ?? undefined,
      reviewedBy: row.reviewedBy ?? undefined,
      reviewedAt: row.reviewedAt ? (row.reviewedAt as Date).toISOString() : undefined,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    };
  }

  /**
   * 批量审核通过
   */
  async approveIllustrations(
    ids: string[],
    userId: string,
    note?: string,
  ): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请选择要审核的插图');
    }

    const illustrations = await this.db
      .select({
        id: aiIllustrations.id,
        contentType: aiIllustrations.contentType,
        contentId: aiIllustrations.contentId,
        imageUrl: aiIllustrations.imageUrl,
      })
      .from(aiIllustrations)
      .where(inArray(aiIllustrations.id, ids));

    if (illustrations.length === 0) {
      return 0;
    }

    const now = new Date();
    const updated = await this.db
      .update(aiIllustrations)
      .set({
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: now,
        reviewNote: note ?? null,
      })
      .where(inArray(aiIllustrations.id, ids))
      .returning({ id: aiIllustrations.id });

    // 同步更新对应内容表的 illustrationUrl
    for (const illus of illustrations) {
      if (illus.contentType === 'word') {
        await this.db
          .update(wordItems)
          .set({ illustrationUrl: illus.imageUrl })
          .where(eq(wordItems.id, illus.contentId));
      } else if (illus.contentType === 'sentence') {
        await this.db
          .update(sentencePuzzles)
          .set({ illustrationUrl: illus.imageUrl })
          .where(eq(sentencePuzzles.id, illus.contentId));
      }
    }

    this.logger.log(
      `审核通过 ${updated.length} 张插图, 审核人=${userId}`,
    );
    return updated.length;
  }

  /**
   * 批量审核拒绝
   */
  async rejectIllustrations(
    ids: string[],
    userId: string,
    note?: string,
  ): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请选择要审核的插图');
    }

    const illustrations = await this.db
      .select({
        id: aiIllustrations.id,
        contentType: aiIllustrations.contentType,
        contentId: aiIllustrations.contentId,
        imageUrl: aiIllustrations.imageUrl,
      })
      .from(aiIllustrations)
      .where(inArray(aiIllustrations.id, ids));

    if (illustrations.length === 0) {
      return 0;
    }

    const now = new Date();
    const updated = await this.db
      .update(aiIllustrations)
      .set({
        status: 'rejected',
        reviewedBy: userId,
        reviewedAt: now,
        reviewNote: note ?? null,
      })
      .where(inArray(aiIllustrations.id, ids))
      .returning({ id: aiIllustrations.id });

    // 如果对应内容的 illustrationUrl 等于这张图的 imageUrl，则清空
    for (const illus of illustrations) {
      if (illus.contentType === 'word') {
        await this.db
          .update(wordItems)
          .set({ illustrationUrl: null })
          .where(
            and(
              eq(wordItems.id, illus.contentId),
              eq(wordItems.illustrationUrl, illus.imageUrl),
            ),
          );
      } else if (illus.contentType === 'sentence') {
        await this.db
          .update(sentencePuzzles)
          .set({ illustrationUrl: null })
          .where(
            and(
              eq(sentencePuzzles.id, illus.contentId),
              eq(sentencePuzzles.illustrationUrl, illus.imageUrl),
            ),
          );
      }
    }

    this.logger.log(
      `审核拒绝 ${updated.length} 张插图, 审核人=${userId}`,
    );
    return updated.length;
  }

  /**
   * 删除插图
   */
  async deleteIllustration(id: string): Promise<void> {
    const rows = await this.db
      .select({
        id: aiIllustrations.id,
        contentType: aiIllustrations.contentType,
        contentId: aiIllustrations.contentId,
        imageUrl: aiIllustrations.imageUrl,
        filePath: aiIllustrations.filePath,
      })
      .from(aiIllustrations)
      .where(eq(aiIllustrations.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('插图不存在');
    }

    const illus = rows[0];

    // 如果对应内容的 illustrationUrl 等于该图的 imageUrl，则清空
    if (illus.contentType === 'word') {
      await this.db
        .update(wordItems)
        .set({ illustrationUrl: null })
        .where(
          and(
            eq(wordItems.id, illus.contentId),
            eq(wordItems.illustrationUrl, illus.imageUrl),
          ),
        );
    } else if (illus.contentType === 'sentence') {
      await this.db
        .update(sentencePuzzles)
        .set({ illustrationUrl: null })
        .where(
          and(
            eq(sentencePuzzles.id, illus.contentId),
            eq(sentencePuzzles.illustrationUrl, illus.imageUrl),
          ),
        );
    }

    await this.db.delete(aiIllustrations).where(eq(aiIllustrations.id, id));

    this.logger.log(`删除插图: ${id}`);
  }

  /**
   * 获取插图统计
   */
  async getStats(): Promise<IllustrationStats> {
    const rows = await this.db
      .select({
        status: aiIllustrations.status,
        count: count(),
      })
      .from(aiIllustrations)
      .groupBy(aiIllustrations.status);

    let total = 0;
    let pendingReview = 0;
    let approved = 0;
    let rejected = 0;

    for (const row of rows) {
      const c = Number(row.count);
      total += c;
      if (row.status === 'pending_review') pendingReview = c;
      else if (row.status === 'approved') approved = c;
      else if (row.status === 'rejected') rejected = c;
    }

    return { total, pendingReview, approved, rejected };
  }

  /**
   * 批量审核（根据 action 分派）
   */
  async batchReview(
    dto: IllustrationReviewRequest,
    userId: string,
  ): Promise<{ updated: number }> {
    if (dto.action === 'approve') {
      const updated = await this.approveIllustrations(dto.ids, userId, dto.note);
      return { updated };
    } else if (dto.action === 'reject') {
      const updated = await this.rejectIllustrations(dto.ids, userId, dto.note);
      return { updated };
    } else {
      throw new BadRequestException('无效的审核操作');
    }
  }
}
