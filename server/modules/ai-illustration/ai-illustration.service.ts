import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
  FileService,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, inArray, desc, count } from 'drizzle-orm';
import axios from 'axios';
import type {
  AiIllustration,
  AiIllustrationTask,
  IllustrationListResponse,
  IllustrationTaskListResponse,
  IllustrationStats,
  BatchGenerateRequest,
  BatchGeneratePreview,
  IllustrationContentType,
} from '@shared/api.interface';
import {
  aiIllustrations,
  aiIllustrationTasks,
  wordItems,
  sentencePuzzles,
  appSettings,
} from '@server/database/schema';
import { buildPrompt } from './prompt-templates';

const DASHSCOPE_TASK_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const DASHSCOPE_TASK_STATUS_URL =
  'https://dashscope.aliyuncs.com/api/v1/tasks/';

interface GenerateImageResult {
  imageUrl: string;
  filePath: string;
}

interface BatchItem {
  id: string;
  text: string;
  translation: string;
  hasIllustration: boolean;
}

@Injectable()
export class AiIllustrationService {
  private readonly logger = new Logger(AiIllustrationService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly fileService: FileService,
  ) {}

  // ==================== API Key ====================

  async getImageApiKey(): Promise<string> {
    try {
      const rows = await this.db
        .select({ settingValue: appSettings.settingValue })
        .from(appSettings)
        .where(eq(appSettings.settingKey, 'dashscope_api_key'))
        .limit(1);

      if (rows.length === 0 || !rows[0].settingValue) {
        return '';
      }
      return rows[0].settingValue;
    } catch (error) {
      this.logger.error(
        '读取 DashScope API Key 失败',
        JSON.stringify(error),
      );
      return '';
    }
  }

  // ==================== 测试连接 ====================

  async testApiConnection(
    apiKey: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length < 8) {
      return { success: false, message: 'API Key 格式不正确' };
    }
    try {
      // 调用一次简短的生成请求（异步提交，超时15秒）
      const response = await axios.post(
        DASHSCOPE_TASK_URL,
        {
          model: 'wanx-v1',
          input: { prompt: 'a cute cat' },
          parameters: { size: '1024*1024', n: 1 },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable',
          },
          timeout: 15000,
        },
      );

      if (response.data?.output?.task_id) {
        return { success: true, message: 'API Key 有效，连接成功' };
      }
      return {
        success: false,
        message:
          response.data?.message || 'API 返回异常，请检查 Key 是否正确',
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      this.logger.error('测试 DashScope 连接失败', JSON.stringify(error));
      const msg = err.response?.data?.message || err.message || '未知错误';
      return { success: false, message: `连接失败: ${msg}` };
    }
  }

  // ==================== 单张生成 ====================

  async generateSingleImage(prompt: string): Promise<GenerateImageResult> {
    const apiKey = await this.getImageApiKey();
    if (!apiKey) {
      throw new BadRequestException('尚未配置 DashScope API Key');
    }

    // 1. 提交异步任务
    let taskId: string;
    try {
      const response = await axios.post(
        DASHSCOPE_TASK_URL,
        {
          model: 'wanx-v1',
          input: { prompt },
          parameters: { size: '1024*1024', n: 1 },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable',
          },
          timeout: 30000,
        },
      );

      taskId = response.data?.output?.task_id;
      if (!taskId) {
        throw new Error(
          `提交任务失败: ${response.data?.message || '未知错误'}`,
        );
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      this.logger.error(
        `提交 DashScope 生成任务失败: ${err.message}`,
        JSON.stringify(error),
      );
      throw new BadRequestException(
        `提交生成任务失败: ${err.response?.data?.message || err.message}`,
      );
    }

    // 2. 轮询任务状态
    const imageUrl = await this.pollTaskStatus(taskId, apiKey);

    // 3. 下载图片并上传到应用存储
    const { downloadURL, filePath } = await this.downloadAndUpload(imageUrl);

    return { imageUrl: downloadURL, filePath };
  }

  private async pollTaskStatus(
    taskId: string,
    apiKey: string,
  ): Promise<string> {
    const maxAttempts = 60;
    const intervalMs = 2000;

    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        const response = await axios.get(
          `${DASHSCOPE_TASK_STATUS_URL}${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          },
        );

        const status: string = response.data?.output?.task_status;

        if (status === 'SUCCEEDED') {
          const results = response.data?.output?.results ?? [];
          if (results.length > 0 && results[0]?.url) {
            return results[0].url;
          }
          throw new Error('任务完成但未找到图片 URL');
        }

        if (status === 'FAILED') {
          const msg =
            response.data?.output?.message ||
            response.data?.message ||
            '任务失败';
          throw new Error(`生成任务失败: ${msg}`);
        }

        // PENDING / RUNNING 继续等待
        if (i < maxAttempts - 1) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, intervalMs);
          });
        }
      } catch (error: unknown) {
        // 如果是 Error 且已经是我们抛的失败信息，直接重新抛出
        if (error instanceof Error && error.message.startsWith('生成任务失败')) {
          throw error;
        }
        const err = error as { message?: string };
        this.logger.warn(
          `轮询任务状态出错 (第 ${i + 1} 次): ${err.message}`,
        );
        if (i < maxAttempts - 1) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, intervalMs);
          });
        }
      }
    }

    throw new Error('生成任务超时，请稍后重试');
  }

  private async downloadAndUpload(
    remoteUrl: string,
  ): Promise<{ downloadURL: string; filePath: string }> {
    try {
      const response = await axios.get(remoteUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      const buffer = Buffer.from(response.data as ArrayBuffer);
      const fileName = `ai-illustration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

      const fileMeta = await this.fileService.upload(buffer, {
        fileName,
        contentType: 'image/png',
      });

      return {
        downloadURL: fileMeta.downloadURL,
        filePath: fileMeta.filePath,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(
        `下载或上传图片失败: ${err.message}`,
        JSON.stringify(error),
      );
      throw new BadRequestException(
        `图片下载或上传失败: ${err.message}`,
      );
    }
  }

  // ==================== 统计 ====================

  async getIllustrationStats(): Promise<IllustrationStats> {
    const totalResult = await this.db
      .select({ value: count() })
      .from(aiIllustrations);

    const pendingResult = await this.db
      .select({ value: count() })
      .from(aiIllustrations)
      .where(eq(aiIllustrations.status, 'pending_review'));

    const approvedResult = await this.db
      .select({ value: count() })
      .from(aiIllustrations)
      .where(eq(aiIllustrations.status, 'approved'));

    const rejectedResult = await this.db
      .select({ value: count() })
      .from(aiIllustrations)
      .where(eq(aiIllustrations.status, 'rejected'));

    return {
      total: Number(totalResult[0]?.value ?? 0),
      pendingReview: Number(pendingResult[0]?.value ?? 0),
      approved: Number(approvedResult[0]?.value ?? 0),
      rejected: Number(rejectedResult[0]?.value ?? 0),
    };
  }

  // ==================== 插图列表 ====================

  async getIllustrationList(params: {
    page: number;
    pageSize: number;
    contentType?: IllustrationContentType;
    status?: string;
    contentId?: string;
    taskId?: string;
  }): Promise<IllustrationListResponse> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const whereClauses = [];
    if (params.contentType) {
      whereClauses.push(eq(aiIllustrations.contentType, params.contentType));
    }
    if (params.status) {
      whereClauses.push(eq(aiIllustrations.status, params.status));
    }
    if (params.contentId) {
      whereClauses.push(eq(aiIllustrations.contentId, params.contentId));
    }
    if (params.taskId) {
      whereClauses.push(eq(aiIllustrations.taskId, params.taskId));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    const [rows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(aiIllustrations)
        .where(where)
        .orderBy(desc(aiIllustrations.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ value: count() }).from(aiIllustrations).where(where),
    ]);

    return {
      items: rows.map((row) => this.mapIllustrationRow(row)),
      total: Number(totalResult[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  private mapIllustrationRow(
    row: typeof aiIllustrations.$inferSelect,
  ): AiIllustration {
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
      reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // ==================== 任务列表 ====================

  async getTaskList(params: {
    page: number;
    pageSize: number;
    status?: string;
  }): Promise<IllustrationTaskListResponse> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(100, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const where = params.status
      ? eq(aiIllustrationTasks.status, params.status)
      : undefined;

    const [rows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(aiIllustrationTasks)
        .where(where)
        .orderBy(desc(aiIllustrationTasks.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(aiIllustrationTasks)
        .where(where),
    ]);

    return {
      items: rows.map((row) => this.mapTaskRow(row)),
      total: Number(totalResult[0]?.value ?? 0),
      page,
      pageSize,
    };
  }

  async getTask(taskId: string): Promise<AiIllustrationTask> {
    const rows = await this.db
      .select()
      .from(aiIllustrationTasks)
      .where(eq(aiIllustrationTasks.id, taskId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('任务不存在');
    }

    return this.mapTaskRow(rows[0]);
  }

  private mapTaskRow(
    row: typeof aiIllustrationTasks.$inferSelect,
  ): AiIllustrationTask {
    const scopeParams = row.scopeParams as AiIllustrationTask['scopeParams'];
    return {
      id: row.id,
      taskType: row.taskType,
      scopeType: row.scopeType,
      scopeParams,
      totalCount: row.totalCount,
      successCount: row.successCount,
      failedCount: row.failedCount,
      status: row.status as AiIllustrationTask['status'],
      errorMessage: row.errorMessage ?? undefined,
      startedAt: row.startedAt ? row.startedAt.toISOString() : undefined,
      completedAt: row.completedAt
        ? row.completedAt.toISOString()
        : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  // ==================== 批量预览 ====================

  async getBatchPreview(
    dto: BatchGenerateRequest,
  ): Promise<BatchGeneratePreview> {
    const items = await this.getScopeItems(dto);
    const willGenerate = dto.skipExisting
      ? items.filter((item) => !item.hasIllustration)
      : items;

    return {
      items: items.map((item) => ({
        id: item.id,
        text: item.text,
        translation: item.translation || undefined,
        hasIllustration: item.hasIllustration,
      })),
      totalCount: items.length,
      willGenerateCount: willGenerate.length,
    };
  }

  private async getScopeItems(dto: BatchGenerateRequest): Promise<BatchItem[]> {
    const { contentType, scopeType, textbookId, unitId, itemIds } = dto;

    if (contentType === 'word') {
      const conditions = [];
      if (scopeType === 'textbook' && textbookId) {
        conditions.push(eq(wordItems.textbookId, textbookId));
      } else if (scopeType === 'unit' && unitId) {
        conditions.push(eq(wordItems.unitId, unitId));
      } else if (scopeType === 'items' && itemIds && itemIds.length > 0) {
        conditions.push(inArray(wordItems.id, itemIds));
      } else {
        throw new BadRequestException('无效的范围参数');
      }

      const where = and(...conditions);
      const rows = await this.db
        .select({
          id: wordItems.id,
          word: wordItems.word,
          meaning: wordItems.meaning,
          illustrationUrl: wordItems.illustrationUrl,
        })
        .from(wordItems)
        .where(where)
        .orderBy(wordItems.wordOrder, wordItems.word);

      return rows.map((row) => ({
        id: row.id,
        text: row.word,
        translation: row.meaning,
        hasIllustration: Boolean(row.illustrationUrl),
      }));
    }

    // sentence
    const conditions = [];
    if (scopeType === 'textbook' && textbookId) {
      conditions.push(eq(sentencePuzzles.textbookId, textbookId));
    } else if (scopeType === 'unit' && unitId) {
      conditions.push(eq(sentencePuzzles.unitId, unitId));
    } else if (scopeType === 'items' && itemIds && itemIds.length > 0) {
      conditions.push(inArray(sentencePuzzles.id, itemIds));
    } else {
      throw new BadRequestException('无效的范围参数');
    }

    const where = and(...conditions);
    const rows = await this.db
      .select({
        id: sentencePuzzles.id,
        sentence: sentencePuzzles.sentence,
        translation: sentencePuzzles.translation,
        illustrationUrl: sentencePuzzles.illustrationUrl,
      })
      .from(sentencePuzzles)
      .where(where)
      .orderBy(sentencePuzzles.puzzleOrder);

    return rows.map((row) => ({
      id: row.id,
      text: row.sentence,
      translation: row.translation,
      hasIllustration: Boolean(row.illustrationUrl),
    }));
  }

  // ==================== 启动批量生成 ====================

  async startBatchGenerate(
    dto: BatchGenerateRequest,
    userId: string,
  ): Promise<{ taskId: string }> {
    const items = await this.getScopeItems(dto);
    const toGenerate = dto.skipExisting
      ? items.filter((item) => !item.hasIllustration)
      : items;

    if (toGenerate.length === 0) {
      throw new BadRequestException('没有需要生成插图的内容');
    }

    // 创建任务记录
    const scopeParams = {
      textbookId: dto.textbookId,
      unitId: dto.unitId,
      itemIds: dto.itemIds,
      contentType: dto.contentType,
      stylePreset: dto.stylePreset ?? 'cartoon_kids',
      customPrompt: dto.customPrompt,
      skipExisting: dto.skipExisting ?? false,
    };

    const inserted = await this.db
      .insert(aiIllustrationTasks)
      .values({
        taskType: 'batch_generate',
        scopeType: dto.scopeType,
        scopeParams: scopeParams as Record<string, unknown>,
        totalCount: toGenerate.length,
        successCount: 0,
        failedCount: 0,
        status: 'pending',
      })
      .returning({ id: aiIllustrationTasks.id });

    const taskId = inserted[0].id;
    const stylePreset = dto.stylePreset ?? 'cartoon_kids';
    const customPrompt = dto.customPrompt;

    // 异步触发后台处理（不阻塞请求）
    setTimeout(() => {
      void this.processBatchTask(
        taskId,
        toGenerate.map((item) => ({
          id: item.id,
          text: item.text,
          translation: item.translation,
        })),
        stylePreset,
        customPrompt,
        dto.contentType,
        userId,
      );
    }, 0);

    this.logger.log(
      `批量生成任务已创建: taskId=${taskId}, count=${toGenerate.length}, contentType=${dto.contentType}`,
    );

    return { taskId };
  }

  // ==================== 后台批量处理 ====================

  async processBatchTask(
    taskId: string,
    items: Array<{ id: string; text: string; translation: string }>,
    stylePreset: string,
    customPrompt: string | undefined,
    contentType: IllustrationContentType,
    userId: string,
  ): Promise<void> {
    try {
      // 更新状态为 running
      await this.db
        .update(aiIllustrationTasks)
        .set({
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(aiIllustrationTasks.id, taskId));

      this.logger.log(`批量生成任务开始: taskId=${taskId}, total=${items.length}`);

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        try {
          const prompt = buildPrompt(
            item.text,
            item.translation,
            stylePreset,
            customPrompt,
          );
          const result = await this.generateSingleImage(prompt);

          // 插入插图记录
          await this.db.insert(aiIllustrations).values({
            contentType,
            contentId: item.id,
            contentText: item.text,
            translation: item.translation,
            imageUrl: result.imageUrl,
            filePath: result.filePath,
            prompt,
            stylePreset,
            status: 'pending_review',
            taskId,
          });

          successCount += 1;
          this.logger.log(
            `[${taskId}] 生成成功 (${successCount + failedCount}/${items.length}): ${item.text}`,
          );
        } catch (error: unknown) {
          failedCount += 1;
          const err = error as { message?: string };
          this.logger.error(
            `[${taskId}] 生成失败 (${successCount + failedCount}/${items.length}): ${item.text}, 错误: ${err.message}`,
          );
        }

        // 每 5 个或最后一个更新进度
        if ((i + 1) % 5 === 0 || i === items.length - 1) {
          await this.db
            .update(aiIllustrationTasks)
            .set({
              successCount,
              failedCount,
              updatedAt: new Date(),
            })
            .where(eq(aiIllustrationTasks.id, taskId));
        }
      }

      // 完成
      await this.db
        .update(aiIllustrationTasks)
        .set({
          status: 'completed',
          successCount,
          failedCount,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(aiIllustrationTasks.id, taskId));

      this.logger.log(
        `批量生成任务完成: taskId=${taskId}, success=${successCount}, failed=${failedCount}`,
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(
        `批量生成任务异常失败: taskId=${taskId}, 错误: ${err.message}`,
        JSON.stringify(error),
      );
      try {
        await this.db
          .update(aiIllustrationTasks)
          .set({
            status: 'failed',
            errorMessage: err.message || '未知错误',
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(aiIllustrationTasks.id, taskId));
      } catch (updateError) {
        this.logger.error(
          `更新任务失败状态出错: taskId=${taskId}`,
          JSON.stringify(updateError),
        );
      }
    }
  }

  // ==================== 单张生成（新建插图） ====================

  async generateSingleIllustration(
    dto: {
      contentType: IllustrationContentType;
      contentId: string;
      contentText: string;
      translation?: string;
      stylePreset?: string;
      customPrompt?: string;
    },
    userId: string,
  ): Promise<AiIllustration> {
    const stylePreset = dto.stylePreset ?? 'cartoon_kids';
    const prompt = buildPrompt(
      dto.contentText,
      dto.translation,
      stylePreset,
      dto.customPrompt,
    );

    const result = await this.generateSingleImage(prompt);

    const inserted = await this.db
      .insert(aiIllustrations)
      .values({
        contentType: dto.contentType,
        contentId: dto.contentId,
        contentText: dto.contentText,
        translation: dto.translation,
        imageUrl: result.imageUrl,
        filePath: result.filePath,
        prompt,
        stylePreset,
        status: 'pending_review',
      })
      .returning();

    return this.mapIllustrationRow(inserted[0]);
  }

  // ==================== 重新生成 ====================

  async regenerateIllustration(
    id: string,
    userId: string,
    customPrompt?: string,
  ): Promise<AiIllustration> {
    const rows = await this.db
      .select()
      .from(aiIllustrations)
      .where(eq(aiIllustrations.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('插图不存在');
    }

    const existing = rows[0];
    const prompt = buildPrompt(
      existing.contentText,
      existing.translation ?? undefined,
      existing.stylePreset,
      customPrompt,
    );

    const result = await this.generateSingleImage(prompt);

    const updated = await this.db
      .update(aiIllustrations)
      .set({
        imageUrl: result.imageUrl,
        filePath: result.filePath,
        prompt,
        status: 'pending_review',
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(aiIllustrations.id, id))
      .returning();

    return this.mapIllustrationRow(updated[0]);
  }

  // ==================== 获取内容的已通过插图 ====================

  async getIllustrationForContent(
    contentType: IllustrationContentType,
    contentId: string,
  ): Promise<AiIllustration | null> {
    const rows = await this.db
      .select()
      .from(aiIllustrations)
      .where(
        and(
          eq(aiIllustrations.contentType, contentType),
          eq(aiIllustrations.contentId, contentId),
          eq(aiIllustrations.status, 'approved'),
        ),
      )
      .orderBy(desc(aiIllustrations.updatedAt))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return this.mapIllustrationRow(rows[0]);
  }
}
