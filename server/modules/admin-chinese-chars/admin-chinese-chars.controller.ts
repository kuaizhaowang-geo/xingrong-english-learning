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
import { AdminChineseCharsService } from './admin-chinese-chars.service';
import type {
  AdminChineseCharItem,
  PagedResponse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
@Controller('api/admin/chinese-chars')
export class AdminChineseCharsController {
  constructor(
    private readonly adminChineseCharsService: AdminChineseCharsService,
  ) {}

  @Get()
  async getChineseChars(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PagedResponse<AdminChineseCharItem>> {
    return this.adminChineseCharsService.getChineseChars({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      textbookId,
      unitId,
      keyword,
    });
  }

  @Get(':id')
  async getChineseChar(
    @Param('id') id: string,
  ): Promise<AdminChineseCharItem> {
    return this.adminChineseCharsService.getChineseChar(id);
  }

  @Post()
  async createChineseChar(@Body() body: {
    character: string;
    pinyin?: string;
    radical?: string;
    strokes?: number;
    meaning?: string;
    examples?: string;
    charOrder?: number;
    structure?: string;
    words?: string[];
    difficulty?: string;
    grade?: string;
    semester?: string;
    textbookId: string;
    unitId: string;
  }): Promise<AdminChineseCharItem> {
    return this.adminChineseCharsService.createChineseChar(body);
  }

  @Patch(':id')
  async updateChineseChar(
    @Param('id') id: string,
    @Body() body: {
      character?: string;
      pinyin?: string;
      radical?: string;
      strokes?: number;
      meaning?: string;
      examples?: string;
      charOrder?: number;
      structure?: string;
      words?: string[];
      difficulty?: string;
      grade?: string;
      semester?: string;
      textbookId?: string;
      unitId?: string;
    },
  ): Promise<AdminChineseCharItem> {
    return this.adminChineseCharsService.updateChineseChar(id, body);
  }

  @Delete(':id')
  async deleteChineseChar(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.adminChineseCharsService.deleteChineseChar(id);
    return { success: true };
  }

  @Post('batch')
  async batchCreateChineseChars(@Body() body: {
    textbookId?: string;
    unitId?: string;
    chars: Array<{
      character: string;
      pinyin?: string;
      radical?: string;
      strokes?: number;
      meaning?: string;
      examples?: string;
      charOrder?: number;
      structure?: string;
      words?: string[];
      difficulty?: string;
      grade?: string;
      semester?: string;
    }>;
  }): Promise<{ count: number }> {
    return this.adminChineseCharsService.batchCreateChineseChars(
      body.textbookId,
      body.unitId,
      body.chars,
    );
  }
}
