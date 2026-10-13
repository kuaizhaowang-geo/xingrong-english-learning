import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type {
  DashboardStats,
  DailyStudyTrend,
  SubjectDistribution,
  UserRegisterTrend,
  AdminRankItem,
  RecentActivity,
} from '@shared/api.interface';

@UseGuards(AdminAuthGuard)
@Controller('api/admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    return this.adminDashboardService.getStats();
  }

  @Get('study-trend')
  async getStudyTrend(
    @Query('days') days?: string,
  ): Promise<DailyStudyTrend[]> {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.adminDashboardService.getStudyTrend(
      Number.isFinite(daysNum) && daysNum > 0 ? daysNum : 7,
    );
  }

  @Get('subject-distribution')
  async getSubjectDistribution(): Promise<SubjectDistribution[]> {
    return this.adminDashboardService.getSubjectDistribution();
  }

  @Get('register-trend')
  async getRegisterTrend(
    @Query('days') days?: string,
  ): Promise<UserRegisterTrend[]> {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.adminDashboardService.getRegisterTrend(
      Number.isFinite(daysNum) && daysNum > 0 ? daysNum : 7,
    );
  }

  @Get('ranking')
  async getRanking(
    @Query('limit') limit?: string,
  ): Promise<AdminRankItem[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminDashboardService.getStudyRanking(
      Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10,
    );
  }

  @Get('recent-activities')
  async getRecentActivities(
    @Query('limit') limit?: string,
  ): Promise<RecentActivity[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminDashboardService.getRecentActivities(
      Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 20,
    );
  }
}
