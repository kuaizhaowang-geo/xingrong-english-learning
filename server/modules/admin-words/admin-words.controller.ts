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
import { AdminWordsService } from './admin-words.service';
import type {
  AdminWordItem,
  PagedResponse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
@Controller('api/admin/words')
export class AdminWordsController {
  constructor(private readonly adminWordsService: AdminWordsService) {}

  @Get()
  async getWords(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('keyword') keyword?: string,
    @Query('level') level?: string,
  ): Promise<PagedResponse<AdminWordItem>> {
    return this.adminWordsService.getWords({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      textbookId,
      unitId,
      keyword,
      level,
    });
  }

  @Get(':id')
  async getWord(@Param('id') id: string): Promise<AdminWordItem> {
    return this.adminWordsService.getWord(id);
  }

  @Post()
  async createWord(@Body() body: {
    word: string;
    phonetic?: string;
    meaning: string;
    partOfSpeech?: string;
    exampleSentence?: string;
    exampleTranslation?: string;
    level?: string;
    tags?: string[];
    textbookId?: string;
    unitId?: string;
    wordOrder?: number;
    imageUrl?: string;
  }): Promise<AdminWordItem> {
    return this.adminWordsService.createWord(body);
  }

  @Patch(':id')
  async updateWord(
    @Param('id') id: string,
    @Body() body: {
      word?: string;
      phonetic?: string;
      meaning?: string;
      partOfSpeech?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      level?: string;
      tags?: string[];
      textbookId?: string;
      unitId?: string;
      wordOrder?: number;
      imageUrl?: string;
    },
  ): Promise<AdminWordItem> {
    return this.adminWordsService.updateWord(id, body);
  }

  @Delete(':id')
  async deleteWord(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.adminWordsService.deleteWord(id);
    return { success: true };
  }

  @Post('batch')
  async batchCreateWords(@Body() body: {
    textbookId?: string;
    unitId?: string;
    words: Array<{
      word: string;
      phonetic?: string;
      meaning: string;
      partOfSpeech?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      level?: string;
      tags?: string[];
      wordOrder?: number;
      imageUrl?: string;
    }>;
  }): Promise<{ count: number }> {
    return this.adminWordsService.batchCreateWords(
      body.textbookId,
      body.unitId,
      body.words,
    );
  }
}
