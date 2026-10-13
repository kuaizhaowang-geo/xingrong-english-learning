import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { RankingService } from './ranking.service';
import type { RankingResponse, RankingType, RankingPeriod } from '@shared/api.interface';

const TYPE_MAP: Record<string, RankingType> = {
  studyTime: 'studyTime',
  study_time: 'studyTime',
  time: 'studyTime',
  wins: 'wins',
  win: 'wins',
  winRate: 'winRate',
  win_rate: 'winRate',
  typingWpm: 'typingWpm',
  typing_wpm: 'typingWpm',
  wpm: 'typingWpm',
  typingAccuracy: 'typingAccuracy',
  typing_accuracy: 'typingAccuracy',
  accuracy: 'typingAccuracy',
};

const PERIOD_MAP: Record<string, RankingPeriod> = {
  weekly: 'weekly',
  week: 'weekly',
  monthly: 'monthly',
  month: 'monthly',
  yearly: 'yearly',
  year: 'yearly',
};

function mapType(type?: string): RankingType {
  if (type && TYPE_MAP[type]) return TYPE_MAP[type];
  return 'studyTime';
}

function mapPeriod(period?: string): RankingPeriod {
  if (period && PERIOD_MAP[period]) return PERIOD_MAP[period];
  return 'weekly';
}

@Controller('api/ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @NeedLogin()
  @Get()
  async getRanking(
    @Req() req: Request,
    @Query('type') type?: string,
    @Query('period') period?: string,
  ): Promise<RankingResponse> {
    const rankingType = mapType(type);
    const rankingPeriod = mapPeriod(period);
    const { userId } = req.userContext;
    return this.rankingService.getRanking(rankingType, rankingPeriod, userId);
  }
}
