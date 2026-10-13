import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard, AdminRoles } from '@server/modules/admin-auth/admin-auth.guard';
import { AdminMathService } from './admin-math.service';
import type {
  AdminMathTopicItem,
  AdminMathPracticeItem,
  PagedResponse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
@Controller('api/admin/math')
export class AdminMathController {
  constructor(private readonly adminMathService: AdminMathService) {}

  // ===== 知识点 =====

  @Get('topics')
  async getMathTopics(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('keyword') keyword?: string,
    @Query('domain') domain?: string,
  ): Promise<PagedResponse<AdminMathTopicItem>> {
    return this.adminMathService.getMathTopics({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      textbookId,
      unitId,
      keyword,
      domain,
    });
  }

  @Get('topics/:id')
  async getMathTopic(
    @Param('id') id: string,
  ): Promise<AdminMathTopicItem> {
    return this.adminMathService.getMathTopic(id);
  }

  @Post('topics')
  async createMathTopic(@Body() body: {
    title: string;
    textbookId: string;
    unitId: string;
    topicOrder?: number;
    domain?: string;
    description: string;
    keyPoints: string;
    examples?: Array<{ question: string; solution: string; answer: string }>;
  }): Promise<AdminMathTopicItem> {
    return this.adminMathService.createMathTopic(body);
  }

  @Patch('topics/:id')
  async updateMathTopic(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      textbookId?: string;
      unitId?: string;
      topicOrder?: number;
      domain?: string;
      description?: string;
      keyPoints?: string;
      examples?: Array<{ question: string; solution: string; answer: string }>;
    },
  ): Promise<AdminMathTopicItem> {
    return this.adminMathService.updateMathTopic(id, body);
  }

  @Delete('topics/:id')
  async deleteMathTopic(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.adminMathService.deleteMathTopic(id);
    return { success: true };
  }

  @Post('topics/batch')
  async batchCreateMathTopics(@Body() body: {
    textbookId?: string;
    unitId?: string;
    topics: Array<{
      title: string;
      topicOrder?: number;
      domain?: string;
      description: string;
      keyPoints: string;
      examples?: Array<{ question: string; solution: string; answer: string }>;
    }>;
  }): Promise<{ count: number }> {
    return this.adminMathService.batchCreateMathTopics(
      body.textbookId,
      body.unitId,
      body.topics,
    );
  }

  // ===== 习题 =====

  @Get('practice-items')
  async getMathPracticeItems(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('topicId') topicId?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('keyword') keyword?: string,
    @Query('difficulty') difficulty?: string,
    @Query('itemType') itemType?: string,
  ): Promise<PagedResponse<AdminMathPracticeItem>> {
    return this.adminMathService.getMathPracticeItems({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      topicId,
      textbookId,
      unitId,
      keyword,
      difficulty,
      itemType,
    });
  }

  @Get('practice-items/:id')
  async getMathPracticeItem(
    @Param('id') id: string,
  ): Promise<AdminMathPracticeItem> {
    return this.adminMathService.getMathPracticeItem(id);
  }

  @Post('practice-items')
  async createMathPracticeItem(@Body() body: {
    question: string;
    options?: Array<{ label: string; text: string }>;
    correctAnswer: string;
    solution?: string;
    difficulty?: number;
    itemOrder?: number;
    itemType?: string;
    grade?: string;
    semester?: string;
    knowledgePoint?: string;
    topicId: string;
    textbookId: string;
    unitId: string;
  }): Promise<AdminMathPracticeItem> {
    return this.adminMathService.createMathPracticeItem(body);
  }

  @Patch('practice-items/:id')
  async updateMathPracticeItem(
    @Param('id') id: string,
    @Body() body: {
      question?: string;
      options?: Array<{ label: string; text: string }>;
      correctAnswer?: string;
      solution?: string;
      difficulty?: number;
      itemOrder?: number;
      itemType?: string;
      grade?: string;
      semester?: string;
      knowledgePoint?: string;
      topicId?: string;
      textbookId?: string;
      unitId?: string;
    },
  ): Promise<AdminMathPracticeItem> {
    return this.adminMathService.updateMathPracticeItem(id, body);
  }

  @Delete('practice-items/:id')
  async deleteMathPracticeItem(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.adminMathService.deleteMathPracticeItem(id);
    return { success: true };
  }

  @Post('practice-items/batch')
  async batchCreateMathPracticeItems(@Body() body: {
    textbookId?: string;
    unitId?: string;
    topicId?: string;
    items: Array<{
      question: string;
      options?: Array<{ label: string; text: string }>;
      correctAnswer: string;
      solution?: string;
      difficulty?: number;
      itemOrder?: number;
      itemType?: string;
      grade?: string;
      semester?: string;
      knowledgePoint?: string;
    }>;
  }): Promise<{ count: number }> {
    return this.adminMathService.batchCreateMathPracticeItems(
      body.textbookId,
      body.unitId,
      body.topicId,
      body.items,
    );
  }
}
