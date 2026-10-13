import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AchievementsService } from './achievements.service';
import type {
  UserPoints,
  BadgeItem,
  PointLogItem,
  AchievementOverview,
  EarnPointsResult,
} from './achievements.service';

@Controller('api/achievements')
@NeedLogin()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('overview')
  async getOverview(@Req() req: any): Promise<AchievementOverview> {
    const { userId } = req.userContext;
    return this.achievementsService.getOverview(userId);
  }

  @Get('points')
  async getPoints(@Req() req: any): Promise<UserPoints> {
    const { userId } = req.userContext;
    return this.achievementsService.getUserPoints(userId);
  }

  @Get('badges')
  async getBadges(@Req() req: any): Promise<BadgeItem[]> {
    const { userId } = req.userContext;
    return this.achievementsService.getAllBadges(userId);
  }

  @Get('point-logs')
  async getPointLogs(
    @Req() req: any,
    @Query('limit') limit?: string,
  ): Promise<PointLogItem[]> {
    const { userId } = req.userContext;
    const limitNum: number | undefined = limit ? parseInt(limit, 10) : undefined;
    return this.achievementsService.getPointLogs(userId, limitNum);
  }

  @Post('earn')
  async earnPoints(
    @Req() req: any,
    @Body() body: { source: string; reason: string; points: number },
  ): Promise<EarnPointsResult> {
    const { userId } = req.userContext;
    return this.achievementsService.earnPoints(
      userId,
      body.source,
      body.reason,
      body.points,
    );
  }

  @Post('login')
  async recordLogin(@Req() req: any): Promise<EarnPointsResult> {
    const { userId } = req.userContext;
    return this.achievementsService.recordLogin(userId);
  }
}
