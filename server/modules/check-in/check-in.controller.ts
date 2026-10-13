import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { CheckInService } from './check-in.service';
import type { CheckInDto, CheckInRecord } from '@shared/api.interface';

interface CheckInStatsResponse {
  continuousDays: number;
  totalDays: number;
  monthDays: number;
}

@Controller('api/check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @NeedLogin()
  @Post()
  async checkIn(@Req() req: Request, @Body() dto: CheckInDto): Promise<CheckInRecord> {
    const { userId } = req.userContext;
    return this.checkInService.createOrUpdate(userId, dto);
  }

  @NeedLogin()
  @Get('today')
  async getTodayStatus(
    @Req() req: Request,
  ): Promise<{ checkedIn: boolean; record?: CheckInRecord }> {
    const { userId } = req.userContext;
    return this.checkInService.getTodayStatus(userId);
  }

  @NeedLogin()
  @Get('history')
  async getHistory(@Req() req: Request): Promise<CheckInRecord[]> {
    const { userId } = req.userContext;
    return this.checkInService.getHistory(userId);
  }

  @NeedLogin()
  @Get('stats')
  async getStats(@Req() req: Request): Promise<CheckInStatsResponse> {
    const { userId } = req.userContext;
    return this.checkInService.getStats(userId);
  }
}
