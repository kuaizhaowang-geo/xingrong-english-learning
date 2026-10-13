import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

import { LearnersService } from './learners.service';
import { LearnersStatsService } from './learners-stats.service';
import type {
  LearnerProfile,
  UpdateLearnerDto,
  LearnerStatsSummary,
  SubjectRadarData,
  ProgressDailyData,
  MistakeStats,
  Achievement,
} from '@shared/api.interface';

@Controller('api/learners')
export class LearnersController {
  constructor(
    private readonly learnersService: LearnersService,
    private readonly statsService: LearnersStatsService,
  ) {}

  @NeedLogin()
  @Get('me')
  async getMe(@Req() req: Request): Promise<LearnerProfile> {
    const { userId } = req.userContext;
    return this.learnersService.getOrCreateProfile(userId);
  }

  @NeedLogin()
  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateLearnerDto,
  ): Promise<LearnerProfile> {
    const { userId } = req.userContext;
    return this.learnersService.updateProfile(userId, dto);
  }

  @NeedLogin()
  @Get('stats')
  async getStats(@Req() req: Request): Promise<{
    totalStudyMinutes: number;
    totalWords: number;
    continuousCheckInDays: number;
    totalCheckInDays: number;
    enrolledCoursesCount: number;
  }> {
    const { userId } = req.userContext;
    return this.learnersService.getStats(userId);
  }

  // ===== 统计看板接口 =====

  @NeedLogin()
  @Get('stats/summary')
  async getStatsSummary(@Req() req: Request): Promise<LearnerStatsSummary> {
    const { userId } = req.userContext;
    return this.statsService.getSummary(userId);
  }

  @NeedLogin()
  @Get('stats/subject-radar')
  async getSubjectRadar(@Req() req: Request): Promise<SubjectRadarData> {
    const { userId } = req.userContext;
    return this.statsService.getSubjectRadar(userId);
  }

  @NeedLogin()
  @Get('stats/progress')
  async getProgress(
    @Req() req: Request,
    @Query('days') days?: string,
  ): Promise<{ dailyData: ProgressDailyData[] }> {
    const { userId } = req.userContext;
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.statsService.getProgress(userId, daysNum);
  }

  @NeedLogin()
  @Get('stats/mistakes')
  async getMistakes(@Req() req: Request): Promise<MistakeStats> {
    const { userId } = req.userContext;
    return this.statsService.getMistakes(userId);
  }

  @NeedLogin()
  @Get('stats/achievements')
  async getAchievements(@Req() req: Request): Promise<Achievement[]> {
    const { userId } = req.userContext;
    return this.statsService.getAchievements(userId);
  }
}
