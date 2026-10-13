import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { MathPracticeService } from './math-practice.service';
import type {
  MathPracticeItem,
  MathPracticeSession,
  MathWrongQuestion,
  MathKnowledgeMastery,
  MathPracticeStats,
  PagedResponse,
  SubmitMathAnswerDto,
  SubmitMathAnswerResponse,
  CreateMathPracticeSessionReqDto,
  FinishMathSessionDto,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/math-practice')
export class MathPracticeController {
  constructor(private readonly mathPracticeService: MathPracticeService) {}

  // ===== 题目列表 =====

  @Get('items')
  async getItems(
    @Req() req: Request,
    @Query('topicId') topicId?: string,
    @Query('itemType') itemType?: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<MathPracticeItem>> {
    return this.mathPracticeService.getItems({
      topicId,
      itemType,
      difficulty,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('items/random')
  async getRandomItems(
    @Req() req: Request,
    @Query('count') count: string,
    @Query('topicId') topicId?: string,
    @Query('itemTypes') itemTypes?: string,
    @Query('difficulty') difficulty?: string,
  ): Promise<{ items: MathPracticeItem[] }> {
    const countNum = count ? parseInt(count, 10) : 10;
    if (isNaN(countNum) || countNum <= 0) {
      throw new BadRequestException('count 必须为正整数');
    }
    const itemTypeArray: string[] | undefined = itemTypes
      ? itemTypes.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;
    const items: MathPracticeItem[] =
      await this.mathPracticeService.getRandomItems({
        count: countNum,
        topicId,
        itemTypes: itemTypeArray,
        difficulty,
      });
    return { items };
  }

  // ===== 练习会话 =====

  @Post('sessions')
  async createSession(
    @Req() req: Request,
    @Body() body: CreateMathPracticeSessionReqDto,
  ): Promise<{ session: MathPracticeSession; items: MathPracticeItem[] }> {
    const { userId } = req.userContext;
    const {
      grade,
      semester,
      unitId,
      topicId,
      count,
      itemTypes,
      difficulty,
      mode,
    } = body;
    if (!mode) {
      throw new BadRequestException('mode 不能为空');
    }
    if (!count || count <= 0) {
      throw new BadRequestException('count 必须为正整数');
    }
    return this.mathPracticeService.createSession(userId, {
      grade,
      semester,
      unitId,
      topicId,
      count,
      itemTypes,
      difficulty,
      mode,
    });
  }

  @Post('sessions/:id/submit')
  async submitAnswer(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: SubmitMathAnswerDto,
  ): Promise<SubmitMathAnswerResponse> {
    const { userId } = req.userContext;
    if (!body.itemId || body.userAnswer === undefined) {
      throw new BadRequestException('itemId 和 userAnswer 不能为空');
    }
    return this.mathPracticeService.submitAnswer(userId, id, body);
  }

  @Post('sessions/:id/finish')
  async finishSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: FinishMathSessionDto,
  ): Promise<MathPracticeSession> {
    const { userId } = req.userContext;
    const duration: number = body.duration ?? 0;
    return this.mathPracticeService.finishSession(userId, id, duration);
  }

  @Get('sessions')
  async getMySessions(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<MathPracticeSession>> {
    const { userId } = req.userContext;
    return this.mathPracticeService.getMySessions(userId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // ===== 错题本 =====

  @Get('wrong-questions')
  async getWrongQuestions(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('itemType') itemType?: string,
  ): Promise<PagedResponse<MathWrongQuestion>> {
    const { userId } = req.userContext;
    return this.mathPracticeService.getWrongQuestions(userId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      itemType,
    });
  }

  @Post('wrong-questions/:id/master')
  async markWrongQuestionMastered(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<MathWrongQuestion> {
    const { userId } = req.userContext;
    return this.mathPracticeService.markWrongQuestionMastered(userId, id);
  }

  // ===== 学习统计 =====

  @Get('stats')
  async getStats(@Req() req: Request): Promise<MathPracticeStats> {
    const { userId } = req.userContext;
    return this.mathPracticeService.getStats(userId);
  }

  // ===== 知识点掌握度 =====

  @Get('knowledge-mastery')
  async getKnowledgeMastery(
    @Req() req: Request,
  ): Promise<MathKnowledgeMastery[]> {
    const { userId } = req.userContext;
    return this.mathPracticeService.getKnowledgeMastery(userId);
  }
}
