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
import {
  UserTextbooksService,
  type CreateTextbookDto,
  type UpdateTextbookDto,
  type CreateUnitDto,
  type UpdateUnitDto,
  type CreateWordDto,
  type UpdateWordDto,
  type CreateSentenceDto,
  type UpdateSentenceDto,
  type WordImportItem,
  type SentenceImportItem,
  type BatchImportResult,
  type TextbookListResponse,
  type TextbookDetailDto,
  type UserTextbookDto,
  type UnitDto,
  type WordDto,
  type SentenceDto,
} from './user-textbooks.service';

@NeedLogin()
@Controller('api/user-textbooks')
export class UserTextbooksController {
  constructor(private readonly service: UserTextbooksService) {}

  // ===== Textbook CRUD =====

  @Get()
  async getTextbooks(
    @Req() req: Request,
    @Query('subject') subject?: string,
    @Query('grade') grade?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<TextbookListResponse> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.service.getTextbooks(
      userId, subject, grade, keyword, pageNum, pageSizeNum,
    );
  }

  @Get(':id')
  async getTextbook(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<TextbookDetailDto> {
    const { userId } = req.userContext;
    return this.service.getTextbook(userId, id);
  }

  @Post()
  async createTextbook(
    @Req() req: Request,
    @Body() dto: CreateTextbookDto,
  ): Promise<UserTextbookDto> {
    const { userId } = req.userContext;
    if (!dto.name?.trim()) throw new BadRequestException('教材名称不能为空');
    return this.service.createTextbook(userId, dto);
  }

  @Patch(':id')
  async updateTextbook(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTextbookDto,
  ): Promise<UserTextbookDto> {
    const { userId } = req.userContext;
    return this.service.updateTextbook(userId, id, dto);
  }

  @Delete(':id')
  async deleteTextbook(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.service.deleteTextbook(userId, id);
  }

  // ===== Unit Management =====

  @Get(':id/units')
  async getUnits(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<UnitDto[]> {
    const { userId } = req.userContext;
    return this.service.getUnits(userId, id);
  }

  @Post(':id/units')
  async createUnit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateUnitDto,
  ): Promise<UnitDto> {
    const { userId } = req.userContext;
    if (!dto.title?.trim()) throw new BadRequestException('单元标题不能为空');
    return this.service.createUnit(userId, id, dto);
  }

  @Patch('units/:unitId')
  async updateUnit(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<UnitDto> {
    const { userId } = req.userContext;
    return this.service.updateUnit(userId, unitId, dto);
  }

  @Delete('units/:unitId')
  async deleteUnit(
    @Req() req: Request,
    @Param('unitId') unitId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.service.deleteUnit(userId, unitId);
  }

  // ===== Word Management =====

  @Get('units/:unitId/words')
  async getWords(
    @Req() req: Request,
    @Param('unitId') unitId: string,
  ): Promise<WordDto[]> {
    const { userId } = req.userContext;
    return this.service.getWords(userId, unitId);
  }

  @Post('units/:unitId/words')
  async createWord(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() dto: CreateWordDto,
  ): Promise<WordDto> {
    const { userId } = req.userContext;
    if (!dto.word?.trim()) throw new BadRequestException('单词不能为空');
    if (!dto.meaning?.trim()) throw new BadRequestException('释义不能为空');
    return this.service.createWord(userId, unitId, dto);
  }

  @Patch('words/:wordId')
  async updateWord(
    @Req() req: Request,
    @Param('wordId') wordId: string,
    @Body() dto: UpdateWordDto,
  ): Promise<WordDto> {
    const { userId } = req.userContext;
    return this.service.updateWord(userId, wordId, dto);
  }

  @Delete('words/:wordId')
  async deleteWord(
    @Req() req: Request,
    @Param('wordId') wordId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.service.deleteWord(userId, wordId);
  }

  // ===== Sentence Management =====

  @Get('units/:unitId/sentences')
  async getSentences(
    @Req() req: Request,
    @Param('unitId') unitId: string,
  ): Promise<SentenceDto[]> {
    const { userId } = req.userContext;
    return this.service.getSentences(userId, unitId);
  }

  @Post('units/:unitId/sentences')
  async createSentence(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() dto: CreateSentenceDto,
  ): Promise<SentenceDto> {
    const { userId } = req.userContext;
    if (!dto.sentence?.trim()) throw new BadRequestException('句子不能为空');
    return this.service.createSentence(userId, unitId, dto);
  }

  @Patch('sentences/:sentenceId')
  async updateSentence(
    @Req() req: Request,
    @Param('sentenceId') sentenceId: string,
    @Body() dto: UpdateSentenceDto,
  ): Promise<SentenceDto> {
    const { userId } = req.userContext;
    return this.service.updateSentence(userId, sentenceId, dto);
  }

  @Delete('sentences/:sentenceId')
  async deleteSentence(
    @Req() req: Request,
    @Param('sentenceId') sentenceId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.service.deleteSentence(userId, sentenceId);
  }

  // ===== Bulk Import =====

  @Post('units/:unitId/import-words')
  async importWords(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() body: { items: WordImportItem[] },
  ): Promise<BatchImportResult> {
    const { userId } = req.userContext;
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items 必须为数组');
    }
    return this.service.importWords(userId, unitId, body.items);
  }

  @Post('units/:unitId/import-sentences')
  async importSentences(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() body: { items: SentenceImportItem[] },
  ): Promise<BatchImportResult> {
    const { userId } = req.userContext;
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items 必须为数组');
    }
    return this.service.importSentences(userId, unitId, body.items);
  }

  // ===== Share / Audit =====

  @Post(':id/share')
  async shareTextbook(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<UserTextbookDto> {
    const { userId } = req.userContext;
    return this.service.shareTextbook(userId, id);
  }

  @Post(':id/unshare')
  async unshareTextbook(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<UserTextbookDto> {
    const { userId } = req.userContext;
    return this.service.unshareTextbook(userId, id);
  }
}
