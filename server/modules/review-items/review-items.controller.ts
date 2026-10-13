import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ReviewItemsService } from './review-items.service';
import type {
  ReviewItem,
  ReviewListResponse,
  MarkUnfamiliarDto,
  ReviewStats,
  ReviewBatchDeleteDto,
  ReviewRecordDto,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/review-items')
export class ReviewItemsController {
  constructor(private readonly reviewItemsService: ReviewItemsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('subject') subject?: string,
    @Query('itemType') itemType?: string,
    @Query('status') status?: string,
    @Query('dueOnly') dueOnly?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ReviewListResponse> {
    const { userId } = req.userContext;
    return this.reviewItemsService.list({
      userId,
      subject,
      itemType,
      status,
      dueOnly: dueOnly === 'true' || dueOnly === '1',
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post()
  async markUnfamiliar(
    @Req() req: Request,
    @Body() dto: MarkUnfamiliarDto,
  ): Promise<ReviewItem> {
    const { userId } = req.userContext;
    return this.reviewItemsService.markUnfamiliar(userId, dto);
  }

  @Patch(':id/mastered')
  async markMastered(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ReviewItem> {
    const { userId } = req.userContext;
    return this.reviewItemsService.markMastered(userId, id);
  }

  @Post(':id/review')
  async recordReview(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReviewRecordDto,
  ): Promise<ReviewItem> {
    const { userId } = req.userContext;
    return this.reviewItemsService.recordReview(userId, id, dto.isCorrect);
  }

  @Get('stats')
  async getStats(@Req() req: Request): Promise<ReviewStats> {
    const { userId } = req.userContext;
    return this.reviewItemsService.getStats(userId);
  }

  @Delete('batch')
  async batchDelete(
    @Req() req: Request,
    @Body() dto: ReviewBatchDeleteDto,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.reviewItemsService.batchDelete(userId, dto.ids);
  }

  @Delete(':id')
  async delete(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.reviewItemsService.delete(userId, id);
  }
}
