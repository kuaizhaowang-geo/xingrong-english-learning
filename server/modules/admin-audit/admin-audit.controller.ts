import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminAuthGuard, AdminRoles } from '../admin-auth/admin-auth.guard';
import { AdminAuditService } from './admin-audit.service';
import type { AuditLogItem, PagedResponse } from '@shared/api.interface';

@Controller('api/admin/audit')
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin')
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get()
  async getLogs(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ): Promise<PagedResponse<AuditLogItem>> {
    const pageNum: number = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum: number = Math.min(
      100,
      Math.max(1, parseInt(pageSize, 10) || 10),
    );
    return this.adminAuditService.getLogs({
      page: pageNum,
      pageSize: pageSizeNum,
      userId,
      action,
      targetType,
      targetId,
    });
  }
}
