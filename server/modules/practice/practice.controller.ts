import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { PracticeService } from './practice.service';
import type {
  SentencePuzzle,
  DictationItem,
  SubmitSentenceResultDto,
  SubmitDictationResultDto,
  SubmitFeedbackDto,
  UpdateSentenceMasteryDto,
  PagedResponse,
} from '@shared/api.interface';

interface SentenceRecordWithPuzzle {
  id: string;
  puzzleId: string;
  isCorrect: boolean;
  attempts: number;
  timeSpentSeconds: number;
  courseId?: string | null;
  lessonId?: string | null;
  createdAt: string;
  puzzle?: SentencePuzzle | null;
}

interface DictationRecordWithItem {
  id: string;
  dictationId: string;
  userAnswer?: string | null;
  isCorrect: boolean;
  attempts: number;
  courseId?: string | null;
  lessonId?: string | null;
  createdAt: string;
  dictation?: DictationItem | null;
}

@Controller('api/practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  // ===== Sentence Puzzles =====

  @Get('sentences')
  async getSentences(
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('limit') limit?: string,
    @Query('preschoolCategory') preschoolCategory?: string,
    @Query('preschoolModule') preschoolModule?: string,
  ): Promise<SentencePuzzle[]> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.practiceService.getSentences(
      courseId,
      lessonId,
      textbookId,
      unitId,
      limitNum,
      preschoolCategory,
      preschoolModule,
    );
  }

  @Get('sentences/:id')
  async getSentenceById(@Param('id') id: string): Promise<SentencePuzzle> {
    return this.practiceService.getSentenceById(id);
  }

  @NeedLogin()
  @Post('sentences/submit')
  async submitSentenceResult(
    @Req() req: Request,
    @Body() dto: SubmitSentenceResultDto,
  ): Promise<{
    id: string;
    puzzleId: string;
    isCorrect: boolean;
    attempts: number;
    timeSpentSeconds: number;
    courseId?: string;
    lessonId?: string;
    createdAt: string;
  }> {
    const { userId } = req.userContext;
    return this.practiceService.submitSentenceResult(userId, dto);
  }

  // ===== Dictation Items =====

  @Get('dictations')
  async getDictations(
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
  ): Promise<DictationItem[]> {
    return this.practiceService.getDictations(courseId, lessonId, textbookId, unitId);
  }

  @Get('dictations/:id')
  async getDictationById(@Param('id') id: string): Promise<DictationItem> {
    return this.practiceService.getDictationById(id);
  }

  @NeedLogin()
  @Post('dictations/submit')
  async submitDictationResult(
    @Req() req: Request,
    @Body() dto: SubmitDictationResultDto,
  ): Promise<{
    id: string;
    dictationId: string;
    userAnswer?: string;
    isCorrect: boolean;
    attempts: number;
    courseId?: string;
    lessonId?: string;
    createdAt: string;
  }> {
    const { userId } = req.userContext;
    return this.practiceService.submitDictationResult(userId, dto);
  }

  // ===== Feedback & Mastery =====

  @NeedLogin()
  @Post('sentences/feedback')
  async submitFeedback(
    @Req() req: Request,
    @Body() dto: SubmitFeedbackDto,
  ): Promise<{ id: string; puzzleId: string; errorType: string; status: string }> {
    const { userId } = req.userContext;
    return this.practiceService.submitFeedback(userId, dto);
  }

  @NeedLogin()
  @Post('sentences/mastery')
  async updateMastery(
    @Req() req: Request,
    @Body() dto: UpdateSentenceMasteryDto,
  ): Promise<{ puzzleId: string; status: string }> {
    const { userId } = req.userContext;
    return this.practiceService.updateMastery(userId, dto);
  }

  // ===== History =====

  @NeedLogin()
  @Get('history/sentences')
  async getSentenceHistory(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<SentenceRecordWithPuzzle>> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.practiceService.getSentenceHistory(
      userId,
      pageNum,
      pageSizeNum,
    );
  }

  @NeedLogin()
  @Get('history/dictations')
  async getDictationHistory(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<DictationRecordWithItem>> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.practiceService.getDictationHistory(
      userId,
      pageNum,
      pageSizeNum,
    );
  }
}
