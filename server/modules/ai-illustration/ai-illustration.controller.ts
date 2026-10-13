import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import type {
  IllustrationListResponse,
  IllustrationTaskListResponse,
  IllustrationStats,
  BatchGenerateRequest,
  BatchGeneratePreview,
  AiIllustration,
  AiIllustrationTask,
  IllustrationContentType,
} from '@shared/api.interface';
import { AiIllustrationService } from './ai-illustration.service';

interface TestConnectionBody {
  apiKey: string;
  provider?: string;
}

interface GenerateSingleBody {
  contentType: IllustrationContentType;
  contentId: string;
  contentText: string;
  translation?: string;
  stylePreset?: string;
  customPrompt?: string;
}

@Controller('api/ai-illustration')
export class AiIllustrationController {
  constructor(private readonly aiIllustrationService: AiIllustrationService) {}

  // ==================== 设置 ====================

  @Get('settings')
  async getSettings(): Promise<{ hasKey: boolean; provider: string }> {
    const apiKey = await this.aiIllustrationService.getImageApiKey();
    return {
      hasKey: Boolean(apiKey),
      provider: 'dashscope',
    };
  }

  @Post('test-connection')
  async testConnection(
    @Body() body: TestConnectionBody,
  ): Promise<{ success: boolean; message: string }> {
    if (!body.apiKey) {
      return { success: false, message: 'API Key 不能为空' };
    }
    return this.aiIllustrationService.testApiConnection(body.apiKey);
  }

  // ==================== 统计 ====================

  @Get('stats')
  async getStats(): Promise<IllustrationStats> {
    return this.aiIllustrationService.getIllustrationStats();
  }

  // ==================== 插图列表 ====================

  @Get('illustrations')
  async getIllustrations(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('contentType') contentType?: string,
    @Query('status') status?: string,
    @Query('contentId') contentId?: string,
    @Query('taskId') taskId?: string,
  ): Promise<IllustrationListResponse> {
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;

    return this.aiIllustrationService.getIllustrationList({
      page: pageNum,
      pageSize: pageSizeNum,
      contentType: contentType as IllustrationContentType | undefined,
      status,
      contentId,
      taskId,
    });
  }

  // ==================== 任务列表 ====================

  @Get('tasks')
  async getTasks(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status?: string,
  ): Promise<IllustrationTaskListResponse> {
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;

    return this.aiIllustrationService.getTaskList({
      page: pageNum,
      pageSize: pageSizeNum,
      status,
    });
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string): Promise<AiIllustrationTask> {
    return this.aiIllustrationService.getTask(id);
  }

  // ==================== 批量预览 ====================

  @Post('batch-preview')
  async getBatchPreview(
    @Body() dto: BatchGenerateRequest,
  ): Promise<BatchGeneratePreview> {
    if (!dto.contentType || !dto.scopeType) {
      throw new BadRequestException('contentType 和 scopeType 不能为空');
    }
    return this.aiIllustrationService.getBatchPreview(dto);
  }

  // ==================== 批量生成 ====================

  @NeedLogin()
  @Post('batch-generate')
  async startBatchGenerate(
    @Body() dto: BatchGenerateRequest,
    @Req() req: Request,
  ): Promise<{ taskId: string }> {
    if (!dto.contentType || !dto.scopeType) {
      throw new BadRequestException('contentType 和 scopeType 不能为空');
    }
    const { userId } = req.userContext;
    return this.aiIllustrationService.startBatchGenerate(dto, userId);
  }

  // ==================== 单张生成 ====================

  @NeedLogin()
  @Post('generate-single')
  async generateSingle(
    @Body() body: GenerateSingleBody,
    @Req() req: Request,
  ): Promise<AiIllustration> {
    if (!body.contentType || !body.contentId || !body.contentText) {
      throw new BadRequestException('contentType、contentId、contentText 不能为空');
    }
    const { userId } = req.userContext;
    return this.aiIllustrationService.generateSingleIllustration(
      body,
      userId,
    );
  }

  // ==================== 重新生成 ====================

  @NeedLogin()
  @Post('illustrations/:id/regenerate')
  async regenerate(
    @Param('id') id: string,
    @Body() body?: { customPrompt?: string },
    @Req() req?: Request,
  ): Promise<AiIllustration> {
    const userId = req?.userContext?.userId ?? '';
    return this.aiIllustrationService.regenerateIllustration(
      id,
      userId,
      body?.customPrompt,
    );
  }

  // ==================== 内容插图（学习页面用） ====================

  @Get('content/:contentType/:contentId')
  async getContentIllustration(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
  ): Promise<AiIllustration | null> {
    return this.aiIllustrationService.getIllustrationForContent(
      contentType as IllustrationContentType,
      contentId,
    );
  }
}
