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
import { AdminSentencesService } from './admin-sentences.service';
import type {
  AdminSentenceItem,
  PagedResponse,
  WordParse,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin')
@Controller('api/admin/sentences')
export class AdminSentencesController {
  constructor(
    private readonly adminSentencesService: AdminSentencesService,
  ) {}

  @Get()
  async getSentences(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PagedResponse<AdminSentenceItem>> {
    return this.adminSentencesService.getSentences({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      textbookId,
      unitId,
      courseId,
      lessonId,
      keyword,
    });
  }

  @Get(':id')
  async getSentence(
    @Param('id') id: string,
  ): Promise<AdminSentenceItem> {
    return this.adminSentencesService.getSentence(id);
  }

  @Post()
  async createSentence(@Body() body: {
    sentence: string;
    translation: string;
    wordParses?: WordParse[];
    sentenceAnalysis?: string;
    imageUrl?: string;
    textbookId?: string;
    unitId?: string;
    puzzleOrder?: number;
    difficulty?: number;
    tags?: string[];
  }): Promise<AdminSentenceItem> {
    return this.adminSentencesService.createSentence(body);
  }

  @Post('batch')
  async batchCreateSentences(@Body() body: {
    textbookId?: string;
    unitId?: string;
    courseId?: string;
    lessonId?: string;
    sentences: Array<{
      sentence: string;
      translation: string;
      grammarComponents?: Array<{ id: string; text: string; type: string }>;
      wordParses?: WordParse[];
      sentenceAnalysis?: string;
      puzzleOrder?: number;
      difficulty?: number;
      tags?: string[];
      sentenceType?: string;
      courseId?: string;
      lessonId?: string;
    }>;
  }): Promise<{ success: number; failed: number; errors: Array<{ index: number; sentence?: string; error: string }> }> {
    return this.adminSentencesService.batchCreateSentences({
      textbookId: body.textbookId,
      unitId: body.unitId,
      courseId: body.courseId,
      lessonId: body.lessonId,
      sentences: body.sentences,
    });
  }

  @Patch(':id')
  async updateSentence(
    @Param('id') id: string,
    @Body() body: {
      sentence?: string;
      translation?: string;
      wordParses?: WordParse[];
      sentenceAnalysis?: string;
      imageUrl?: string;
      textbookId?: string;
      unitId?: string;
      puzzleOrder?: number;
      difficulty?: number;
      tags?: string[];
    },
  ): Promise<AdminSentenceItem> {
    return this.adminSentencesService.updateSentence(id, body);
  }

  @Delete(':id')
  async deleteSentence(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.adminSentencesService.deleteSentence(id);
    return { success: true };
  }
}
