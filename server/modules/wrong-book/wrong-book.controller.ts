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
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { WrongBookService } from './wrong-book.service';
import type {
  WrongWordItem,
  WrongSentenceItem,
  MasterStatus,
  UpdateMasterStatusDto,
  BatchDeleteWordsDto,
  BatchDeleteSentencesDto,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/wrong-book')
export class WrongBookController {
  constructor(private readonly wrongBookService: WrongBookService) {}

  // ===== 单词错题本 =====

  @Get('words')
  async getWrongWords(
    @Req() req: Request,
    @Query('status') status: MasterStatus,
  ): Promise<WrongWordItem[]> {
    const { userId } = req.userContext;
    return this.wrongBookService.getWrongWords(userId, status);
  }

  @Patch('words/:wordId/status')
  async updateWordStatus(
    @Req() req: Request,
    @Param('wordId') wordId: string,
    @Body() dto: UpdateMasterStatusDto,
  ): Promise<WrongWordItem> {
    const { userId } = req.userContext;
    return this.wrongBookService.updateWordStatus(userId, wordId, dto.status);
  }

  @Delete('words')
  async batchDeleteWords(
    @Req() req: Request,
    @Body() dto: BatchDeleteWordsDto,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wrongBookService.batchDeleteWords(userId, dto.wordIds);
  }

  @Delete('words/all')
  async clearWordsByStatus(
    @Req() req: Request,
    @Query('status') status: MasterStatus,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wrongBookService.clearWordsByStatus(userId, status);
  }

  // ===== 句子错题本 =====

  @Get('sentences')
  async getWrongSentences(
    @Req() req: Request,
    @Query('status') status: MasterStatus,
  ): Promise<WrongSentenceItem[]> {
    const { userId } = req.userContext;
    return this.wrongBookService.getWrongSentences(userId, status);
  }

  @Patch('sentences/:puzzleId/status')
  async updateSentenceStatus(
    @Req() req: Request,
    @Param('puzzleId') puzzleId: string,
    @Body() dto: UpdateMasterStatusDto,
  ): Promise<WrongSentenceItem> {
    const { userId } = req.userContext;
    return this.wrongBookService.updateSentenceStatus(userId, puzzleId, dto.status);
  }

  @Delete('sentences')
  async batchDeleteSentences(
    @Req() req: Request,
    @Body() dto: BatchDeleteSentencesDto,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wrongBookService.batchDeleteSentences(userId, dto.puzzleIds);
  }

  @Delete('sentences/all')
  async clearSentencesByStatus(
    @Req() req: Request,
    @Query('status') status: MasterStatus,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wrongBookService.clearSentencesByStatus(userId, status);
  }
}
