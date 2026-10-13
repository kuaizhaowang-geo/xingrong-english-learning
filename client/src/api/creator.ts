import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CreatorStatsData,
  CreatorRankResponse,
  CreatorRankItem,
  WordbookShareSettings,
  SubmitShareDto,
  WordbookStatus,
  WordbookSubject,
  WordbookContentType,
  CreditLevel,
} from '@shared/api.interface';

export interface CreatorContentItem {
  id: string;
  name: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  description?: string;
  itemCount: number;
  status: WordbookStatus;
  auditNote?: string;
  learnCount: number;
  likeCount: number;
  favoriteCount: number;
  submittedAt?: string;
  createdAt: string;
}

export interface CreatorContentListResponse {
  items: CreatorContentItem[];
  total: number;
}

export interface CreatorShareSettingsResponse extends WordbookShareSettings {
  status: WordbookStatus;
  auditNote?: string;
  showCreatorInfo: boolean;
}

export interface CreatorProfileResponse {
  userId: string;
  userName: string;
  creatorLevel: number;
  creatorPoints: number;
  creditLevel: CreditLevel;
  contentCount: number;
  totalLearnCount: number;
  totalLikeCount: number;
  totalFavoriteCount: number;
  badges: { id: string; badgeCode: string; badgeName: string; createdAt: string }[];
  createdAt: string;
}

export interface MyContentParams {
  status?: WordbookStatus | 'all';
  page?: number;
  pageSize?: number;
}

export interface CreatorRankingParams {
  period?: 'all' | 'week' | 'month';
  page?: number;
  pageSize?: number;
}

const BASE = '/api/creator';

export const getCreatorStats = async (): Promise<CreatorStatsData> => {
  const res = await axiosForBackend.get(`${BASE}/stats`);
  return res.data;
};

export const getMyContent = async (
  params?: MyContentParams,
): Promise<CreatorContentListResponse> => {
  const res = await axiosForBackend.get(`${BASE}/my-content`, { params });
  return res.data;
};

export const getShareSettings = async (
  wordbookId: string,
): Promise<CreatorShareSettingsResponse> => {
  const res = await axiosForBackend.get(
    `${BASE}/wordbooks/${wordbookId}/share-settings`,
  );
  return res.data;
};

export const submitShare = async (
  wordbookId: string,
  data: SubmitShareDto & { showCreatorInfo?: boolean },
): Promise<{ success: boolean; status: WordbookStatus }> => {
  const res = await axiosForBackend.post(
    `${BASE}/wordbooks/${wordbookId}/submit-share`,
    data,
  );
  return res.data;
};

export const getCreatorRanking = async (
  params?: CreatorRankingParams,
): Promise<CreatorRankResponse> => {
  const res = await axiosForBackend.get(`${BASE}/ranking`, { params });
  return res.data;
};

export const getCreatorProfile = async (
  userId: string,
): Promise<CreatorProfileResponse> => {
  const res = await axiosForBackend.get(`${BASE}/${userId}/profile`);
  return res.data;
};

export const withdrawShare = async (
  wordbookId: string,
): Promise<{ success: boolean; status: WordbookStatus }> => {
  const res = await axiosForBackend.post(
    `${BASE}/wordbooks/${wordbookId}/withdraw`,
  );
  return res.data;
};
