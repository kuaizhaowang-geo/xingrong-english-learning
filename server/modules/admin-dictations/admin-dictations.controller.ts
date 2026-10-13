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
import { AdminDictationsService } from './admin-dictations.service';
import type {
  AdminDictationItem,
  PagedResponse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
@Controller('api/admin/dictations')
export class AdminDictationsController {
  constructor(
    private readonly adminDictationsService: AdminDictationsService,
  ) {}

  @Get()
  async getDictations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PagedResponse<AdminDictationItem>> {
    return this.adminDictationsService.getDictations({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      textbookId,
      unitId,
      keyword,
    });
  }

  @Get(':id')
  async getDictation(
    @Param('id') id: string,
  ): Promise<AdminDictationItem> {
    return this.adminDictationsService.getDictation(id);
  }

  @Post()
  async createDictation(@Body() body: {
    sentence: string;
    translation: string;
    hint?: string;
    difficulty?: number;
    itemOrder?: number;
    textbookId?: string;
    unitId?: string;
    tags?: string[];
  }): Promise<AdminDictationItem> {
    return this.adminDictationsService.createDictation(body);
  }

  @Post('batch')
  async batchCreateDictations(@Body() body: {
    textbookId?: string;
    unitId?: string;
    items: Array<{
      sentence: string;
      translation: string;
      hint?: string;
      difficulty?: number;
      itemOrder?: number;
      tags?: string[];
    }>;
  }): Promise<{ count: number }> {
    return this.adminDictationsService.batchCreateDictations(
      body.textbookId,
      body.unitId,
      body.items,
    );
  }

  @Patch(':id')
  async updateDictation(
    @Param('id') id: string,
    @Body() body: {
      sentence?: string;
      translation?: string;
      hint?: string;
      difficulty?: number;
      itemOrder?: number;
      textbookId?: string;
      unitId?: string;
      tags?: string[];
    },
  ): Promise<AdminDictationItem> {
    return this.adminDictationsService.updateDictation(id, body);
  }

  @Delete(':id')
  async deleteDictation(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.adminDictationsService.deleteDictation(id);
    return { success: true };
  }
}
