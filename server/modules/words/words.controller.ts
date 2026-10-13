import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { WordsService } from './words.service';
import type {
   WordItem,
   UserWordRecord,
   PagedResponse,
   WordAffix,
   WordAffixDetail,
   WordNote,
   WordStats,
   WordRelatedGroup,
   WordLearningStats,
   ReviewMode,
 } from '@shared/api.interface';
import { UpdateWordRecordDto } from './words.dto';

@Controller('api/words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get()
  async getWords(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('level') level?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('textbookId') textbookId?: string,
    @Query('unitId') unitId?: string,
    @Query('sort') sort?: string,
    @Req() req?: Request,
  ): Promise<PagedResponse<WordItem>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    const userId = req?.userContext?.userId;
    return this.wordsService.getWords(pageNum, pageSizeNum, level, tags, search, textbookId, unitId, sort, userId);
  }

  // ===== Roots / Affixes =====

  @Get('roots')
  async getRoots(
    @Query('type') type?: string,
    @Query('search') search?: string,
  ): Promise<WordAffix[]> {
    return this.wordsService.getAffixes(type, search);
  }

  @Get('roots/:id')
  async getRootDetail(@Param('id') id: string): Promise<WordAffixDetail> {
    return this.wordsService.getAffixDetail(id);
  }

  @Get('affixes/list')
  async getAffixes(@Query('type') type?: string): Promise<WordAffix[]> {
    return this.wordsService.getAffixes(type);
  }

  @Post('batch-detail')
  async getBatchWordDetail(
    @Body() body: { words: string[] },
  ): Promise<WordItem[]> {
    if (!body.words || !Array.isArray(body.words)) {
      throw new BadRequestException('words 必须为字符串数组');
    }
    if (body.words.length === 0) {
      return [];
    }
    if (body.words.length > 100) {
      throw new BadRequestException('单次查询单词数量不能超过 100');
    }
    return this.wordsService.getWordsByList(body.words);
  }

  @NeedLogin()
  @Get('review/today')
  async getTodayReview(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('mode') mode?: ReviewMode,
  ): Promise<UserWordRecord[]> {
    const { userId } = req.userContext;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const reviewMode: ReviewMode = mode === 'fast' || mode === 'wrong' ? mode : 'full';
    return this.wordsService.getTodayReview(userId, limitNum, reviewMode);
  }

  @NeedLogin()
  @Post('records')
  async updateWordRecord(
    @Req() req: Request,
    @Body() dto: UpdateWordRecordDto,
  ): Promise<UserWordRecord> {
    const { userId } = req.userContext;
    return this.wordsService.updateWordRecord(userId, dto);
  }

  @NeedLogin()
  @Get('records/stats')
  async getWordStats(@Req() req: Request): Promise<WordStats> {
    const { userId } = req.userContext;
    return this.wordsService.getWordStats(userId);
  }

  // ===== Favorites =====

  @NeedLogin()
  @Get('favorites')
  async getFavorites(@Req() req: Request): Promise<WordItem[]> {
    const { userId } = req.userContext;
    return this.wordsService.getFavorites(userId);
  }

  @NeedLogin()
  @Post('favorites')
  async addFavorite(
    @Req() req: Request,
    @Body() body: { wordId: string },
  ): Promise<void> {
    const { userId } = req.userContext;
    if (!body.wordId) throw new BadRequestException('wordId 不能为空');
    await this.wordsService.addFavorite(userId, body.wordId);
  }

  @NeedLogin()
  @Delete('favorites/:wordId')
  async removeFavorite(
    @Req() req: Request,
    @Param('wordId') wordId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wordsService.removeFavorite(userId, wordId);
  }

  @NeedLogin()
  @Get('favorites/check/:wordId')
  async checkFavorite(
    @Req() req: Request,
    @Param('wordId') wordId: string,
  ): Promise<{ isFavorite: boolean }> {
    const { userId } = req.userContext;
    const isFavorite = await this.wordsService.checkFavorite(userId, wordId);
    return { isFavorite };
  }

  // ===== Wrong Words (错词本) =====

  @NeedLogin()
  @Get('wrong/list')
  async getWrongWords(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ): Promise<WordItem[]> {
    const { userId } = req.userContext;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.wordsService.getWrongWords(userId, limitNum);
  }

  // ===== Mastered Words =====

  @NeedLogin()
  @Get('mastered/list')
  async getMasteredWords(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ): Promise<WordItem[]> {
    const { userId } = req.userContext;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.wordsService.getMasteredWords(userId, limitNum);
  }

  // ===== All user word records =====

  @NeedLogin()
  @Get('user-records')
  async getAllUserWordRecords(@Req() req: Request): Promise<
    { wordId: string; ebbinghausLevel: number; status: string; familiarity: number; wrongCount: number }[]
  > {
    const { userId } = req.userContext;
    return this.wordsService.getAllUserWordRecords(userId);
  }

  // ===== Learning Settings =====

  @NeedLogin()
  @Get('settings')
  async getSettings(@Req() req: Request): Promise<{
    dailyGoal: number;
    preferredModes: string[];
    reminderEnabled: boolean;
    reminderTime: string;
  }> {
    const { userId } = req.userContext;
    return this.wordsService.getSettings(userId);
  }

  @NeedLogin()
  @Put('settings')
  async updateSettings(
    @Req() req: Request,
    @Body() body: {
      dailyGoal?: number;
      preferredModes?: string[];
      reminderEnabled?: boolean;
      reminderTime?: string;
    },
  ): Promise<{
    dailyGoal: number;
    preferredModes: string[];
    reminderEnabled: boolean;
    reminderTime: string;
  }> {
    const { userId } = req.userContext;
    return this.wordsService.updateSettings(userId, body);
  }

  // ===== Choice distractors =====

  @NeedLogin()
  @Get('choice/distractors/:wordId')
  async getChoiceDistractors(
    @Param('wordId') wordId: string,
    @Query('count') count?: string,
  ): Promise<WordItem[]> {
    const countNum = count ? parseInt(count, 10) : 3;
    return this.wordsService.getChoiceDistractors(wordId, countNum);
  }

  // ===== Word Notes =====

  @NeedLogin()
  @Get('notes/:wordId')
  async getNotes(
    @Req() req: Request,
    @Param('wordId') wordId: string,
  ): Promise<WordNote[]> {
    const { userId } = req.userContext;
    return this.wordsService.getNotes(userId, wordId);
  }

  @NeedLogin()
  @Post('notes')
  async createNote(
    @Req() req: Request,
    @Body() body: { wordId: string; content: string },
  ): Promise<WordNote> {
    const { userId } = req.userContext;
    if (!body.wordId) throw new BadRequestException('wordId 不能为空');
    if (!body.content) throw new BadRequestException('content 不能为空');
    return this.wordsService.createNote(userId, body.wordId, body.content);
  }

  @NeedLogin()
  @Put('notes/:id')
  async updateNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { content: string },
  ): Promise<WordNote> {
    const { userId } = req.userContext;
    if (!body.content) throw new BadRequestException('content 不能为空');
    return this.wordsService.updateNote(userId, id, body.content);
  }

  @NeedLogin()
  @Delete('notes/:id')
  async deleteNote(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.wordsService.deleteNote(userId, id);
  }

  // ===== Learning Stats (学习报告) =====

  @NeedLogin()
  @Get('stats/learning')
  async getLearningStats(
    @Req() req: Request,
    @Query('range') range?: string,
  ): Promise<WordLearningStats> {
    const { userId } = req.userContext;
    const validRanges: string[] = ['today', 'week', 'month', 'all'];
    const statsRange = validRanges.includes(range ?? '')
      ? range as 'today' | 'week' | 'month' | 'all'
      : 'week';
    return this.wordsService.getLearningStats(userId, statsRange);
  }

  // ===== Word Relations (关联词) =====

  @Get(':id/relations')
  async getWordRelations(@Param('id') id: string): Promise<WordRelatedGroup[]> {
    return this.wordsService.getWordRelations(id);
  }

  @Get(':id')
  async getWordById(@Param('id') id: string): Promise<WordItem> {
    return this.wordsService.getWordById(id);
  }
}
