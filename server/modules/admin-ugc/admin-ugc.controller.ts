import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard, AdminRoles } from '../admin-auth/admin-auth.guard';
import { AdminUgcService } from './admin-ugc.service';
import type {
  UgcPendingListResponse,
  UgcDetailResponse,
  UgcType,
} from '@shared/api.interface';

@Controller('api/admin/ugc')
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
export class AdminUgcController {
  constructor(private readonly adminUgcService: AdminUgcService) {}

  /**
   * 待审核列表
   * GET /api/admin/ugc/pending?type=all|wordbook|textbook|course&page=1&pageSize=20
   */
  @Get('pending')
  async getPendingList(
    @Query('type') type: string = 'all',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ): Promise<UgcPendingListResponse> {
    const validTypes = ['all', 'wordbook', 'textbook', 'course'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException('无效的内容类型');
    }
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    return this.adminUgcService.getPendingList(
      type as 'all' | UgcType,
      p,
      ps,
    );
  }

  /**
   * 内容详情
   * GET /api/admin/ugc/:type/:id
   */
  @Get(':type/:id')
  async getDetail(
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<UgcDetailResponse> {
    this.validateType(type);
    return this.adminUgcService.getDetail(type as UgcType, id);
  }

  /**
   * 审核通过
   * POST /api/admin/ugc/:type/:id/approve
   */
  @Post(':type/:id/approve')
  async approve(
    @Req() req: { userContext: { userId: string } },
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    this.validateType(type);
    const { userId } = req.userContext;
    await this.adminUgcService.approve(type as UgcType, id, userId);
    return { success: true };
  }

  /**
   * 审核拒绝
   * POST /api/admin/ugc/:type/:id/reject
   */
  @Post(':type/:id/reject')
  async reject(
    @Req() req: { userContext: { userId: string } },
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<{ success: boolean }> {
    this.validateType(type);
    const { userId } = req.userContext;
    await this.adminUgcService.reject(type as UgcType, id, body.reason, userId);
    return { success: true };
  }

  /**
   * 下架
   * POST /api/admin/ugc/:type/:id/offline
   */
  @Post(':type/:id/offline')
  async offline(
    @Req() req: { userContext: { userId: string } },
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    this.validateType(type);
    const { userId } = req.userContext;
    await this.adminUgcService.offline(type as UgcType, id, userId);
    return { success: true };
  }

  private validateType(type: string): void {
    const validTypes = ['wordbook', 'textbook', 'course'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException('无效的内容类型');
    }
  }
}
