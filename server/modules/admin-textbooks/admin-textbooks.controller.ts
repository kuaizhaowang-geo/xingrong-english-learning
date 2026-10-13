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

import { AdminAuthGuard, AdminRoles } from '../admin-auth/admin-auth.guard';
import { AdminTextbooksService } from './admin-textbooks.service';
import type { PagedResponse, Textbook, TextbookUnit } from '@shared/api.interface';

@Controller('api/admin/textbooks')
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin', 'teacher')
export class AdminTextbooksController {
  constructor(private readonly adminTextbooksService: AdminTextbooksService) {}

  // ===== 教材树 =====
  @Get('tree')
  async getTree(@Query('subject') subject?: string) {
    return this.adminTextbooksService.getTree(subject);
  }

  // ===== 教材列表 =====
  @Get()
  async getTextbooks(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('subject') subject?: string,
    @Query('publisher') publisher?: string,
    @Query('grade') grade?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PagedResponse<Textbook>> {
    const pageNum: number = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum: number = Math.min(
      100,
      Math.max(1, parseInt(pageSize, 10) || 10),
    );
    return this.adminTextbooksService.getTextbooks({
      subject,
      publisher,
      grade,
      keyword,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }

  // ===== 教材详情 =====
  @Get(':id')
  async getTextbook(
    @Param('id') id: string,
  ): Promise<{ textbook: Textbook; units: TextbookUnit[] }> {
    return this.adminTextbooksService.getTextbook(id);
  }

  // ===== 创建教材 =====
  @Post()
  async createTextbook(
    @Body()
    body: {
      title: string;
      publisher?: string;
      grade: string;
      semester?: string;
      subject?: string;
      coverImage?: string;
      description?: string;
      totalUnits?: number;
      sortOrder?: number;
      isPublished?: boolean;
    },
  ): Promise<Textbook> {
    return this.adminTextbooksService.createTextbook(body);
  }

  // ===== 更新教材 =====
  @Patch(':id')
  async updateTextbook(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      publisher?: string;
      grade?: string;
      semester?: string;
      subject?: string;
      coverImage?: string;
      description?: string;
      totalUnits?: number;
      sortOrder?: number;
      isPublished?: boolean;
    },
  ): Promise<Textbook> {
    return this.adminTextbooksService.updateTextbook(id, body);
  }

  // ===== 删除教材 =====
  @Delete(':id')
  async deleteTextbook(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.adminTextbooksService.deleteTextbook(id);
    return { success: true };
  }

  // ===== 单元列表 =====
  @Get(':id/units')
  async getUnits(@Param('id') id: string): Promise<TextbookUnit[]> {
    return this.adminTextbooksService.getUnits(id);
  }

  // ===== 新增单元 =====
  @Post(':id/units')
  async createUnit(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      topic?: string;
      unitOrder?: number;
      keySentences?: string[];
      keyWords?: string[];
    },
  ): Promise<TextbookUnit> {
    return this.adminTextbooksService.createUnit(id, body);
  }

  // ===== 更新单元 =====
  @Patch('units/:unitId')
  async updateUnit(
    @Param('unitId') unitId: string,
    @Body()
    body: {
      title?: string;
      topic?: string;
      unitOrder?: number;
      keySentences?: string[];
      keyWords?: string[];
    },
  ): Promise<TextbookUnit> {
    return this.adminTextbooksService.updateUnit(unitId, body);
  }

  // ===== 删除单元 =====
  @Delete('units/:unitId')
  async deleteUnit(
    @Param('unitId') unitId: string,
  ): Promise<{ success: boolean }> {
    await this.adminTextbooksService.deleteUnit(unitId);
    return { success: true };
  }
}
