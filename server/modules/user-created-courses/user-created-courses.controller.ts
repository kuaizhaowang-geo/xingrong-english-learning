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
  UserCreatedCoursesService,
  type CreateCourseDto,
  type UpdateCourseDto,
  type CreateUnitDto,
  type UpdateUnitDto,
  type CreateWordDto,
  type UpdateWordDto,
  type CreateSentenceDto,
  type UpdateSentenceDto,
  type WordImportItem,
  type SentenceImportItem,
  type BatchImportResult,
  type CourseListResponse,
  type CourseDetailDto,
  type UserCreatedCourseDto,
  type UnitDto,
  type WordDto,
   type SentenceDto,
   type BatchGenerateResult,
 } from './user-created-courses.service';

@NeedLogin()
@Controller('api/user-created-courses')
export class UserCreatedCoursesController {
  constructor(private readonly service: UserCreatedCoursesService) {}

  // ===== Course CRUD =====

  @Get()
  async getCourses(
    @Req() req: Request,
    @Query('subject') subject?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<CourseListResponse> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.service.getCourses(
      userId, subject, category, keyword, pageNum, pageSizeNum,
    );
  }

  @Get(':id')
  async getCourse(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<CourseDetailDto> {
    const { userId } = req.userContext;
    return this.service.getCourse(userId, id);
  }

  @Post()
  async createCourse(
    @Req() req: Request,
    @Body() dto: CreateCourseDto,
  ): Promise<UserCreatedCourseDto> {
    const { userId } = req.userContext;
    if (!dto.name?.trim()) throw new BadRequestException('课程名称不能为空');
    return this.service.createCourse(userId, dto);
  }

  @Patch(':id')
  async updateCourse(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<UserCreatedCourseDto> {
    const { userId } = req.userContext;
    return this.service.updateCourse(userId, id, dto);
  }

  @Delete(':id')
  async deleteCourse(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.service.deleteCourse(userId, id);
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
  async shareCourse(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<UserCreatedCourseDto> {
    const { userId } = req.userContext;
    return this.service.shareCourse(userId, id);
  }

  @Post(':id/unshare')
  async unshareCourse(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<UserCreatedCourseDto> {
    const { userId } = req.userContext;
    return this.service.unshareCourse(userId, id);
  }

  // ===== AI Word Generation =====

  @Post('units/:unitId/generate-word')
  async generateWord(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() body: { word: string },
  ): Promise<WordDto> {
    const { userId } = req.userContext;
    if (!body.word?.trim()) throw new BadRequestException('单词不能为空');
    return this.service.generateWord(userId, unitId, body.word);
  }

  @Post('units/:unitId/batch-generate-words')
  async batchGenerateWords(
    @Req() req: Request,
    @Param('unitId') unitId: string,
    @Body() body: { words: string[] },
  ): Promise<BatchGenerateResult> {
    const { userId } = req.userContext;
    if (!body.words || !Array.isArray(body.words)) {
      throw new BadRequestException('words 必须为数组');
    }
    return this.service.batchGenerateWords(userId, unitId, body.words);
  }
}
