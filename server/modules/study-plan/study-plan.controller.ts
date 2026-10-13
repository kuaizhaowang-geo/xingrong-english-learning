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
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { StudyPlanService } from './study-plan.service';
import type {
  StudyPlanItem,
  PlanRecordItem,
  PlanReminderItem,
  PlanOverview,
  PlanStatsResponse,
  AiPlanRecommendation,
  CreatePlanDto,
  UpdateTaskProgressDto,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/study-plan')
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @Get('overview')
  async getOverview(@Req() req: any): Promise<PlanOverview> {
    const { userId } = req.userContext;
    return this.studyPlanService.getOverview(userId);
  }

  @Get('plans')
  async getPlans(@Req() req: any): Promise<{ items: StudyPlanItem[] }> {
    const { userId } = req.userContext;
    const items = await this.studyPlanService.getPlans(userId);
    return { items };
  }

  @Post('plans')
  async createPlan(
    @Req() req: any,
    @Body() dto: CreatePlanDto,
  ): Promise<StudyPlanItem> {
    const { userId } = req.userContext;
    return this.studyPlanService.createPlan(userId, dto);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreatePlanDto>,
  ): Promise<StudyPlanItem> {
    const { userId } = req.userContext;
    return this.studyPlanService.updatePlan(userId, id, dto);
  }

  @Delete('plans/:id')
  async deletePlan(@Req() req: any, @Param('id') id: string): Promise<void> {
    const { userId } = req.userContext;
    await this.studyPlanService.deletePlan(userId, id);
  }

  @Post('plans/:id/activate')
  async activatePlan(@Req() req: any, @Param('id') id: string): Promise<void> {
    const { userId } = req.userContext;
    await this.studyPlanService.activatePlan(userId, id);
  }

  @Get('records/today')
  async getTodayRecord(@Req() req: any): Promise<PlanRecordItem | null> {
    const { userId } = req.userContext;
    return this.studyPlanService.getTodayRecord(userId);
  }

  @Get('records')
  async getRecords(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ items: PlanRecordItem[] }> {
    const { userId } = req.userContext;
    const items = await this.studyPlanService.getRecords(userId, startDate, endDate);
    return { items };
  }

  @Post('task-progress')
  async updateTaskProgress(
    @Req() req: any,
    @Body() dto: UpdateTaskProgressDto,
  ): Promise<PlanRecordItem> {
    const { userId } = req.userContext;
    return this.studyPlanService.updateTaskProgress(userId, dto);
  }

  @Get('stats')
  async getStats(@Req() req: any): Promise<PlanStatsResponse> {
    const { userId } = req.userContext;
    return this.studyPlanService.getStats(userId);
  }

  @Get('ai-recommendation')
  async getAiRecommendation(@Req() req: any): Promise<AiPlanRecommendation> {
    const { userId } = req.userContext;
    return this.studyPlanService.getAiRecommendation(userId);
  }

  @Get('reminders')
  async getReminders(@Req() req: any): Promise<{ items: PlanReminderItem[] }> {
    const { userId } = req.userContext;
    const items = await this.studyPlanService.getReminders(userId);
    return { items };
  }

  @Patch('reminders/:id')
  async updateReminder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<Pick<PlanReminderItem, 'remindTime' | 'enabled' | 'reminderType' | 'planId'>>,
  ): Promise<PlanReminderItem> {
    const { userId } = req.userContext;
    return this.studyPlanService.updateReminder(userId, id, dto);
  }
}
