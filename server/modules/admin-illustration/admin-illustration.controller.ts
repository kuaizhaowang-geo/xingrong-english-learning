import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard, AdminRoles } from '../admin-auth/admin-auth.guard';
import { AdminIllustrationService } from './admin-illustration.service';
import type {
  AiIllustration,
  AppSetting,
  AppSettingSaveRequest,
  IllustrationListResponse,
  IllustrationReviewRequest,
  IllustrationStats,
} from '@shared/api.interface';

@Controller('api/admin/illustrations')
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
export class AdminIllustrationController {
  constructor(
    private readonly adminIllustrationService: AdminIllustrationService,
  ) {}

  /**
   * 获取 AI 设置列表
   * GET /api/admin/illustrations/settings
   */
  @Get('settings')
  async getAiSettings(): Promise<AppSetting[]> {
    return this.adminIllustrationService.getAiSettings();
  }

  /**
   * 保存 AI 设置
   * PUT /api/admin/illustrations/settings
   */
  @Put('settings')
  async saveAiSetting(
    @Body() dto: AppSettingSaveRequest,
  ): Promise<AppSetting> {
    return this.adminIllustrationService.saveAiSetting(dto);
  }

  /**
   * 测试 API 连接
   * POST /api/admin/illustrations/settings/test
   */
  @Post('settings/test')
  async testImageApi(
    @Body() body: { provider: string; apiKey: string },
  ): Promise<{ success: boolean; message: string }> {
    if (!body.provider || !body.apiKey) {
      throw new BadRequestException('provider 和 apiKey 不能为空');
    }
    return this.adminIllustrationService.testImageApi(
      body.provider,
      body.apiKey,
    );
  }

  /**
   * 插图列表
   * GET /api/admin/illustrations?page=1&pageSize=20&contentType=&status=&keyword=
   */
  @Get()
  async getIllustrationList(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('contentType') contentType?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ): Promise<IllustrationListResponse> {
    const pageNum: number = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum: number = Math.min(
      100,
      Math.max(1, parseInt(pageSize, 10) || 20),
    );
    return this.adminIllustrationService.getIllustrationList({
      page: pageNum,
      pageSize: pageSizeNum,
      contentType,
      status,
      keyword,
    });
  }

  /**
   * 插图统计
   * GET /api/admin/illustrations/stats
   */
  @Get('stats')
  async getStats(): Promise<IllustrationStats> {
    return this.adminIllustrationService.getStats();
  }

  /**
   * 插图详情
   * GET /api/admin/illustrations/:id
   */
  @Get(':id')
  async getIllustration(@Param('id') id: string): Promise<AiIllustration> {
    return this.adminIllustrationService.getIllustration(id);
  }

  /**
   * 批量审核
   * PUT /api/admin/illustrations/batch-review
   */
  @Put('batch-review')
  async batchReview(
    @Req() req: { userContext: { userId: string } },
    @Body() dto: IllustrationReviewRequest,
  ): Promise<{ updated: number }> {
    const { userId } = req.userContext;
    return this.adminIllustrationService.batchReview(dto, userId);
  }

  /**
   * 单张通过
   * PUT /api/admin/illustrations/:id/approve
   */
  @Put(':id/approve')
  async approve(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body?: { note?: string },
  ): Promise<{ updated: number }> {
    const { userId } = req.userContext;
    const updated = await this.adminIllustrationService.approveIllustrations(
      [id],
      userId,
      body?.note,
    );
    return { updated };
  }

  /**
   * 单张拒绝
   * PUT /api/admin/illustrations/:id/reject
   */
  @Put(':id/reject')
  async reject(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body?: { note?: string },
  ): Promise<{ updated: number }> {
    const { userId } = req.userContext;
    const updated = await this.adminIllustrationService.rejectIllustrations(
      [id],
      userId,
      body?.note,
    );
    return { updated };
  }

  /**
   * 删除插图
   * DELETE /api/admin/illustrations/:id
   */
  @Delete(':id')
  async deleteIllustration(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.adminIllustrationService.deleteIllustration(id);
    return { success: true };
  }
}
