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
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { JournalService } from './journal.service';
import type {
  StudyJournal,
  PagedResponse,
  UpdateJournalDto,
  JournalType,
  JournalCalendarResponse,
  AiSummarizeDto,
  AiSummarizeResponse,
  AiWrongQuestionDto,
  AiWrongQuestionResponse,
  AiKnowledgeOrganizeDto,
  AiKnowledgeOrganizeResponse,
} from '@shared/api.interface';

@Controller('api/journals')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @NeedLogin()
  @Get()
  async getList(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
  ): Promise<PagedResponse<StudyJournal>> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    const journalType = this.validateJournalType(type);
    return this.journalService.getList(userId, pageNum, pageSizeNum, journalType);
  }

  @NeedLogin()
  @Get('search')
  async search(
    @Req() req: Request,
    @Query('q') q?: string,
  ): Promise<StudyJournal[]> {
    const { userId } = req.userContext;
    return this.journalService.search(userId, q ?? '');
  }

  @NeedLogin()
  @Get('calendar')
  async getCalendar(
    @Req() req: Request,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<JournalCalendarResponse> {
    const { userId } = req.userContext;
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const monthNum = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    return this.journalService.getCalendar(userId, yearNum, monthNum);
  }

  @NeedLogin()
  @Post('ai/summarize')
  async summarize(
    @Body() dto: AiSummarizeDto,
  ): Promise<AiSummarizeResponse> {
    return this.journalService.summarize(dto.content);
  }

  @NeedLogin()
  @Post('ai/wrong-question-analysis')
  async wrongQuestionAnalysis(
    @Body() dto: AiWrongQuestionDto,
  ): Promise<AiWrongQuestionResponse> {
    return this.journalService.wrongQuestionAnalysis(dto);
  }

  @NeedLogin()
  @Post('ai/knowledge-organize')
  async knowledgeOrganize(
    @Body() dto: AiKnowledgeOrganizeDto,
  ): Promise<AiKnowledgeOrganizeResponse> {
    return this.journalService.knowledgeOrganize(dto.knowledge);
  }

  @NeedLogin()
  @Get(':date')
  async getByDate(
    @Req() req: Request,
    @Param('date') date: string,
  ): Promise<StudyJournal> {
    const { userId } = req.userContext;
    return this.journalService.getByDate(userId, date);
  }

  @NeedLogin()
  @Put()
  async upsert(
    @Req() req: Request,
    @Body() dto: UpdateJournalDto,
  ): Promise<StudyJournal> {
    const { userId } = req.userContext;
    return this.journalService.upsert(userId, dto);
  }

  @NeedLogin()
  @Delete(':date')
  async deleteByDate(
    @Req() req: Request,
    @Param('date') date: string,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.journalService.deleteByDate(userId, date);
    return { success: true };
  }

  private validateJournalType(value?: string): JournalType | undefined {
    const validTypes: JournalType[] = ['diary', 'wrong-note', 'knowledge', 'free'];
    if (value && validTypes.includes(value as JournalType)) {
      return value as JournalType;
    }
    return undefined;
  }
}
