import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { PreschoolService } from './preschool.service';
import type { UpsertProgressDto } from './preschool.service';

@Controller('api/preschool')
export class PreschoolController {
  constructor(private readonly preschoolService: PreschoolService) {}

  @Get('letters')
  async getLetters() {
    return this.preschoolService.getLetters();
  }

  @Get('letters/:letter')
  async getLetter(@Param('letter') letter: string) {
    return this.preschoolService.getLetter(letter.toUpperCase());
  }

  @Get('words/categories')
  async getWordCategories() {
    return this.preschoolService.getWordCategories();
  }

  @Get('words')
  async getWords(@Query('category') category?: string) {
    return this.preschoolService.getWords(category);
  }

  @Get('phonics')
  async getPhonicsLessons() {
    return this.preschoolService.getPhonicsLessons();
  }

  @Get('phonics/:lessonNo')
  async getPhonicsLesson(@Param('lessonNo') lessonNo: string) {
    return this.preschoolService.getPhonicsLesson(parseInt(lessonNo, 10));
  }

  @Get('sentences/categories')
  async getSentenceCategories() {
    return this.preschoolService.getSentenceCategories();
  }

  @Get('sentences')
  async getSentences(@Query('category') category?: string) {
    return this.preschoolService.getSentences(category);
  }

  @Get('songs')
  async getSongs() {
    return this.preschoolService.getSongs();
  }

  @Get('songs/:id')
  async getSong(@Param('id') id: string) {
    return this.preschoolService.getSong(id);
  }

  @Get('modules')
  async getModules() {
    return this.preschoolService.getModules();
  }

  // ===== Progress =====

  @NeedLogin()
  @Get('progress/summary')
  async getProgressSummary(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.preschoolService.getProgressSummary(userId);
  }

  @NeedLogin()
  @Get('progress')
  async getProgress(
    @Req() req: Request,
    @Query('module') module?: string,
  ) {
    const { userId } = req.userContext;
    return this.preschoolService.getProgress(userId, module);
  }

  @NeedLogin()
  @Post('progress')
  async upsertProgress(
    @Req() req: Request,
    @Body() body: UpsertProgressDto,
  ) {
    const { userId } = req.userContext;
    return this.preschoolService.upsertProgress(userId, body);
  }

  @NeedLogin()
  @Post('progress/batch')
  async batchUpsertProgress(
    @Req() req: Request,
    @Body() body: { records: UpsertProgressDto[] },
  ) {
    const { userId } = req.userContext;
    return this.preschoolService.batchUpsertProgress(userId, body.records ?? []);
  }
}
