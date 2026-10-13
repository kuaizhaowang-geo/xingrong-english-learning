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
import { ChineseDictationService } from './chinese-dictation.service';
import type {
  ChineseCharacter,
  ChineseDictationSession,
  ChineseWrongCharacter,
  ChineseDictationStats,
  PagedResponse,
  SubmitDictationAnswerDto,
  SubmitDictationAnswerResponse,
  FinishDictationSessionDto,
  CreateDictationSessionReqDto,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/chinese-dictation')
export class ChineseDictationController {
  constructor(
    private readonly chineseDictationService: ChineseDictationService,
  ) {}

  // ===== 生字列表 =====

  @Get('characters')
  async getCharacters(
    @Req() req: Request,
    @Query('grade') grade?: string,
    @Query('semester') semester?: string,
    @Query('unitId') unitId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<ChineseCharacter>> {
    return this.chineseDictationService.getCharacters({
      grade,
      semester,
      unitId,
      difficulty,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('characters/random')
  async getRandomCharacters(
    @Req() req: Request,
    @Query('count') count: string,
    @Query('grade') grade?: string,
    @Query('semester') semester?: string,
    @Query('unitId') unitId?: string,
    @Query('difficulty') difficulty?: string,
  ): Promise<{ items: ChineseCharacter[] }> {
    const countNum = count ? parseInt(count, 10) : 10;
    if (isNaN(countNum) || countNum <= 0) {
      throw new BadRequestException('count 必须为正整数');
    }
    const items: ChineseCharacter[] =
      await this.chineseDictationService.getRandomCharacters({
        count: countNum,
        grade,
        semester,
        unitId,
        difficulty,
      });
    return { items };
  }

  @Get('characters/:id')
  async getCharacterDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ChineseCharacter> {
    const character: ChineseCharacter | null =
      await this.chineseDictationService.getCharacterById(id);
    if (!character) {
      throw new NotFoundException('生字不存在');
    }
    return character;
  }

  // ===== 听写会话 =====

  @Post('sessions')
  async createSession(
    @Req() req: Request,
    @Body() body: CreateDictationSessionReqDto,
  ): Promise<{ session: ChineseDictationSession; characters: ChineseCharacter[] }> {
    const { userId } = req.userContext;
    const {
      grade,
      semester,
      unitId,
      count,
      difficulty,
      mode,
    } = body;
    if (!mode) {
      throw new BadRequestException('mode 不能为空');
    }
    if (!count || count <= 0) {
      throw new BadRequestException('count 必须为正整数');
    }
    return this.chineseDictationService.createSession(userId, {
      grade,
      semester,
      unitId,
      count,
      difficulty,
      mode,
    });
  }

  @Post('sessions/:id/submit')
  async submitAnswer(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: SubmitDictationAnswerDto,
  ): Promise<SubmitDictationAnswerResponse> {
    const { userId } = req.userContext;
    if (!body.characterId || !body.userAnswer) {
      throw new BadRequestException('characterId 和 userAnswer 不能为空');
    }
    return this.chineseDictationService.submitAnswer(userId, id, body);
  }

  @Post('sessions/:id/finish')
  async finishSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: FinishDictationSessionDto,
  ): Promise<ChineseDictationSession> {
    const { userId } = req.userContext;
    const duration: number = body.duration ?? 0;
    return this.chineseDictationService.finishSession(userId, id, duration);
  }

  @Get('sessions')
  async getMySessions(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<ChineseDictationSession>> {
    const { userId } = req.userContext;
    return this.chineseDictationService.getMySessions(userId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // ===== 错字本 =====

  @Get('wrong-characters')
  async getWrongCharacters(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ): Promise<PagedResponse<ChineseWrongCharacter>> {
    const { userId } = req.userContext;
    return this.chineseDictationService.getWrongCharacters(userId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
    });
  }

  @Post('wrong-characters/:id/master')
  async markWrongCharacterMastered(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ChineseWrongCharacter> {
    const { userId } = req.userContext;
    return this.chineseDictationService.markWrongCharacterMastered(userId, id);
  }

  // ===== 学习统计 =====

  @Get('stats')
  async getStats(
    @Req() req: Request,
  ): Promise<ChineseDictationStats> {
    const { userId } = req.userContext;
    return this.chineseDictationService.getStats(userId);
  }
}
