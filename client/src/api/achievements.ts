import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  AchievementOverview,
  UserPoints,
  BadgeItem,
  PointLogItem,
  EarnPointsResult,
  EarnPointsDto,
} from '@shared/api.interface';

export async function getOverview(): Promise<AchievementOverview> {
  const { data } = await axiosForBackend.get('/api/achievements/overview');
  return data;
}

export async function getUserPoints(): Promise<UserPoints> {
  const { data } = await axiosForBackend.get('/api/achievements/points');
  return data;
}

export async function getBadges(): Promise<BadgeItem[]> {
  const { data } = await axiosForBackend.get('/api/achievements/badges');
  return data;
}

export async function getPointLogs(limit?: number): Promise<PointLogItem[]> {
  const { data } = await axiosForBackend.get('/api/achievements/point-logs', {
    params: limit ? { limit } : undefined,
  });
  return data;
}

export async function earnPoints(dto: EarnPointsDto): Promise<EarnPointsResult> {
  const { data } = await axiosForBackend.post('/api/achievements/earn', dto);
  return data;
}

export async function recordLogin(): Promise<EarnPointsResult> {
  const { data } = await axiosForBackend.post('/api/achievements/login');
  return data;
}
