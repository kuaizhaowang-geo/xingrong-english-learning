import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AdminAuthGuard,
  AdminRoles,
} from '@server/modules/admin-auth/admin-auth.guard';
import { AdminUsersService } from './admin-users.service';
import type {
  AdminUserDetail,
  AdminUserItem,
  PagedResponse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'teacher')
@Controller('api/admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async getUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<PagedResponse<AdminUserItem>> {
    return this.adminUsersService.getUsers({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      keyword,
      role,
      status,
    });
  }

  @Get(':id')
  async getUserDetail(@Param('id') id: string): Promise<AdminUserDetail> {
    return this.adminUsersService.getUserDetail(id);
  }

  @Patch(':id/status')
  async toggleUserStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ): Promise<{ success: boolean }> {
    return this.adminUsersService.toggleUserStatus(id, body.isActive);
  }
}
