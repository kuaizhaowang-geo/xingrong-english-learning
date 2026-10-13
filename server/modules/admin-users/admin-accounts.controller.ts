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

import {
  AdminAuthGuard,
  AdminRoles,
} from '@server/modules/admin-auth/admin-auth.guard';
import { AdminAccountsService } from './admin-accounts.service';
import type { AdminUserManageItem } from './admin-accounts.service';
import type { PagedResponse } from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin')
@Controller('api/admin/accounts')
export class AdminAccountsController {
  constructor(
    private readonly adminAccountsService: AdminAccountsService,
  ) {}

  @Get()
  async getAccounts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('role') role?: string,
    @Query('subject') subject?: string,
  ): Promise<PagedResponse<AdminUserManageItem>> {
    return this.adminAccountsService.getAccounts({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      keyword,
      role,
      subject,
    });
  }

  @Get(':id')
  async getAccount(@Param('id') id: string): Promise<AdminUserManageItem> {
    return this.adminAccountsService.getAccount(id);
  }

  @Post()
  async createAccount(
    @Body()
    body: {
      username: string;
      password: string;
      name: string;
      role: string;
      subject?: string;
      avatarUrl?: string;
    },
  ): Promise<AdminUserManageItem> {
    return this.adminAccountsService.createAccount(body);
  }

  @Patch(':id')
  async updateAccount(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      role?: string;
      subject?: string;
      avatarUrl?: string;
      isActive?: boolean;
      password?: string;
    },
  ): Promise<AdminUserManageItem> {
    return this.adminAccountsService.updateAccount(id, body);
  }

  @Delete(':id')
  async deleteAccount(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.adminAccountsService.deleteAccount(id);
    return { success: true };
  }
}
