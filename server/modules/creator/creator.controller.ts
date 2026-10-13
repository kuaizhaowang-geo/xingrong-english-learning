import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { CreatorService } from './creator.service';
import type {
  CreatorStatsData,
  CreatorRankResponse,
  AuditListResponse,
  SubmitShareDto,
  WordbookShareSettings,
} from '@shared/api.interface';

@Controller('api/creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  // ========== 创作者中心 ==========

  @NeedLogin()
  @Get('stats')
  async getStats(@Req() req: Request): Promise<CreatorStatsData> {
    const { userId, userName } = req.userContext;
    return this.creatorService.getCreatorStats(userId, userName ?? '');
  }

  @NeedLogin()
  @Get('my-content')
  async getMyContent(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{ items: AuditListResponse['items']; total: number }> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 20;
    return this.creatorService.getMyContent(userId, status, pageNum, size);
  }

  // ========== 分享设置 ==========

  @NeedLogin()
  @Get('wordbooks/:id/share-settings')
  async getShareSettings(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<WordbookShareSettings & { status: string; auditNote?: string }> {
    const { userId } = req.userContext;
    return this.creatorService.getShareSettings(userId, id);
  }

  @NeedLogin()
  @Post('wordbooks/:id/submit-share')
  async submitShare(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SubmitShareDto,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.creatorService.submitShare(userId, id, dto);
    return { success: true };
  }

  // ========== 创作者排行榜 ==========

  @Get('ranking')
  async getRanking(
    @Query('period') period?: string,
    @Query('subject') subject?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<CreatorRankResponse> {
    const validPeriod = (period === 'week' || period === 'month' || period === 'all')
      ? period
      : 'all';
    const pageNum = page ? parseInt(page, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 20;
    return this.creatorService.getRanking(validPeriod, subject, pageNum, size);
  }

  // ========== 创作者主页 ==========

  @Get(':userId/profile')
  async getCreatorProfile(
    @Param('userId') userId: string,
  ): Promise<CreatorStatsData & { publicWordbooks: unknown[] }> {
    return this.creatorService.getCreatorProfile(userId, '');
  }
}
