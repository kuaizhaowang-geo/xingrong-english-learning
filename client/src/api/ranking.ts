import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { RankingResponse, RankingType, RankingPeriod } from '@shared/api.interface';

export async function getRanking(params: {
  type: RankingType;
  period: RankingPeriod;
}): Promise<RankingResponse> {
  const res = await axiosForBackend.get('/api/ranking', { params });
  return res.data;
}
