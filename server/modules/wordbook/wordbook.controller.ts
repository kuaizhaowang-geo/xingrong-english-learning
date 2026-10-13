import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { WordbookService } from './wordbook.service';
import type {
  UserWordbook,
  UserWordbookItem,
  CreateWordbookDto,
  UpdateWordbookDto,
  AddWordbookItemDto,
  AddItemsFromTextbookDto,
  BatchImportResult,
  WordbookListResponse,
  WordbookItemListResponse,
  TextExtractResult,
  StudyRecordDto,
  StudySessionResult,
  WordbookSubject,
  WordbookContentType,
  WordbookSource,
} from '@shared/api.interface';

export interface ImportWordItem {
  word: string;
  phonetic?: string;
  meaning?: string;
  example?: string;
  partOfSpeech?: string;
}

export interface FileImportError {
  row: number;
  word: string;
  reason: string;
}

export interface FileImportResult {
  success: number;
  failed: number;
  errors: FileImportError[];
}

@NeedLogin()
@Controller('api/wordbooks')
export class WordbookController {
  constructor(private readonly wordbookService: WordbookService) {}

  // ===== 词库管理 =====

  @Get()
  async getWordbooks(
    @Req() req: Request,
    @Query('subject') subject?: WordbookSubject,
    @Query('contentType') contentType?: WordbookContentType,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<WordbookListResponse> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.wordbookService.getWordbooks(
      userId, subject, contentType, search, pageNum, pageSizeNum,
    );
  }

  @Get('overview/stats')
  async getOverviewStats(@Req() req: Request): Promise<{
    totalWordbooks: number;
    totalItems: number;
    totalStudyCount: number;
    avgCorrectRate: number;
  }> {
    const { userId } = req.userContext;
    return this.wordbookService.getOverviewStats(userId);
  }

  @Get(':id')
  async getWordbook(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<UserWordbook> {
    const { userId } = req.userContext;
    return this.wordbookService.getWordbook(userId, id);
  }

  @Post()
  async createWordbook(
    @Req() req: Request,
    @Body() dto: CreateWordbookDto,
  ): Promise<UserWordbook> {
    const { userId } = req.userContext;
    if (!dto.name?.trim()) throw new BadRequestException('词库名称不能为空');
    if (!dto.subject) throw new BadRequestException('subject 不能为空');
    if (!dto.contentType) throw new BadRequestException('contentType 不能为空');
    return this.wordbookService.createWordbook(userId, dto);
  }

  @Patch(':id')
  async updateWordbook(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateWordbookDto,
  ): Promise<UserWordbook> {
    const { userId } = req.userContext;
    return this.wordbookService.updateWordbook(userId, id, dto);
  }

  @Delete(':id')
  async deleteWordbook(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wordbookService.deleteWordbook(userId, id);
  }

  // ===== 内容管理 =====

  @Get(':id/items')
  async getItems(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('isStarred') isStarred?: string,
    @Query('source') source?: WordbookSource,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<WordbookItemListResponse> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    const starred = isStarred === 'true' ? true : isStarred === 'false' ? false : undefined;
    return this.wordbookService.getItems(
      userId, id, search, starred, source, pageNum, pageSizeNum,
    );
  }

  @Post(':id/items')
  async addItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddWordbookItemDto,
  ): Promise<UserWordbookItem> {
    const { userId } = req.userContext;
    if (!dto.content?.trim()) throw new BadRequestException('内容不能为空');
    return this.wordbookService.addItem(userId, id, dto);
  }

  @Post(':id/items/batch')
  async addItemsBatch(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { items: AddWordbookItemDto[] },
  ): Promise<BatchImportResult> {
    const { userId } = req.userContext;
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items 必须为数组');
    }
    return this.wordbookService.addItemsBatch(userId, id, body.items);
  }

  @Post(':id/import-file')
  async importFromFile(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { items: ImportWordItem[] },
  ): Promise<FileImportResult> {
    const { userId } = req.userContext;
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items 必须为数组');
    }
    if (body.items.length === 0) {
      throw new BadRequestException('items 不能为空');
    }
    return this.wordbookService.importFromFile(userId, id, body.items);
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: Partial<AddWordbookItemDto> & { isStarred?: boolean },
  ): Promise<UserWordbookItem> {
    const { userId } = req.userContext;
    return this.wordbookService.updateItem(userId, id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  async deleteItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wordbookService.deleteItem(userId, id, itemId);
  }

  @Post(':id/items/:itemId/star')
  async toggleStar(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<{ isStarred: boolean }> {
    const { userId } = req.userContext;
    return this.wordbookService.toggleStar(userId, id, itemId);
  }

  // ===== 从教材加入词库 =====

  @Post(':id/add-from-source')
  async addFromSource(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddItemsFromTextbookDto,
  ): Promise<BatchImportResult> {
    const { userId } = req.userContext;
    if (!dto.sourceIds || !Array.isArray(dto.sourceIds)) {
      throw new BadRequestException('sourceIds 必须为数组');
    }
    if (!dto.sourceType) throw new BadRequestException('sourceType 不能为空');
    return this.wordbookService.addFromSource(userId, id, dto);
  }

  // ===== 文本提取 =====

  @Post('extract-text')
  async extractText(
    @Body() body: { text: string; subject: WordbookSubject; contentType: WordbookContentType },
  ): Promise<TextExtractResult> {
    if (!body.text) throw new BadRequestException('text 不能为空');
    if (!body.subject) throw new BadRequestException('subject 不能为空');
    if (!body.contentType) throw new BadRequestException('contentType 不能为空');
    return this.wordbookService.extractText(body.text, body.subject, body.contentType);
  }

  // ===== 学习记录 =====

  @Get(':id/study-items')
  async getStudyItems(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('mode') mode?: string,
    @Query('order') order?: 'sequential' | 'random' | 'wrong-first',
  ): Promise<UserWordbookItem[]> {
    const { userId } = req.userContext;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const orderMode = order || 'sequential';
    return this.wordbookService.getStudyItems(userId, id, limitNum, mode, orderMode);
  }

  @Post('study-record')
  async submitStudyRecord(
    @Req() req: Request,
    @Body() dto: StudyRecordDto,
  ): Promise<void> {
    const { userId } = req.userContext;
    if (!dto.itemId) throw new BadRequestException('itemId 不能为空');
    if (dto.correct === undefined) throw new BadRequestException('correct 不能为空');
    await this.wordbookService.submitStudyRecord(userId, dto);
  }

  @Post(':id/study-complete')
  async completeStudySession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: {
      total: number;
      correct: number;
      wrong: number;
      accuracy: number;
      durationSeconds: number;
    },
  ): Promise<StudySessionResult> {
    const { userId } = req.userContext;
    return this.wordbookService.completeStudySession(userId, id, body);
  }
}
