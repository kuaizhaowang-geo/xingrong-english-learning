import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ContentMarketItem,
  ContentDetail,
  ContentMarketListResponse,
  ContentCommentListResponse,
  ContentComment,
  ReportContentDto,
  WordbookSubject,
  WordbookContentType,
  ContentRating,
  MarketTextbookItem,
  MarketCourseItem,
} from '@shared/api.interface';

export interface MarketListParams {
  subject?: WordbookSubject;
  contentType?: WordbookContentType;
  sort?: 'hot' | 'newest' | 'rating';
  search?: string;
  contentRating?: ContentRating;
  page?: number;
  pageSize?: number;
}

export interface CommentListParams {
  page?: number;
  pageSize?: number;
}

export async function getMarketList(
  params?: MarketListParams,
): Promise<ContentMarketListResponse> {
  const res = await axiosForBackend.get('/api/content-market', { params });
  return res.data;
}

export async function getMarketDetail(id: string): Promise<ContentDetail> {
  const res = await axiosForBackend.get(`/api/content-market/${id}`);
  return res.data;
}

export async function toggleLike(
  id: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await axiosForBackend.post(`/api/content-market/${id}/like`);
  return res.data;
}

export async function toggleFavorite(
  id: string,
): Promise<{ favorited: boolean; favoriteCount: number }> {
  const res = await axiosForBackend.post(`/api/content-market/${id}/favorite`);
  return res.data;
}

export async function getComments(
  id: string,
  params?: CommentListParams,
): Promise<ContentCommentListResponse> {
  const res = await axiosForBackend.get(
    `/api/content-market/${id}/comments`,
    { params },
  );
  return res.data;
}

export async function postComment(
  id: string,
  content: string,
  parentId?: string,
): Promise<ContentComment> {
  const res = await axiosForBackend.post(
    `/api/content-market/${id}/comments`,
    { content, parentId },
  );
  return res.data;
}

export async function likeComment(
  commentId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await axiosForBackend.post(
    `/api/content-market/comments/${commentId}/like`,
  );
  return res.data;
}

export async function reportContent(
  data: ReportContentDto,
): Promise<{ success: boolean }> {
  const res = await axiosForBackend.post('/api/content-market/report', data);
  return res.data;
}

export async function copyToMyWordbook(
  id: string,
  data: { wordbookId?: string; wordbookName?: string; subject?: WordbookSubject },
): Promise<{ success: boolean; wordbookId?: string; copiedCount?: number }> {
  const res = await axiosForBackend.post(
    `/api/content-market/${id}/copy-to-my-wordbook`,
    data,
  );
  return res.data;
}

export interface MarketTextbookListParams {
  subject?: WordbookSubject;
  search?: string;
  sort?: 'hot' | 'newest' | 'rating';
  page?: number;
  pageSize?: number;
}

export interface MarketCourseListParams {
  subject?: WordbookSubject;
  search?: string;
  sort?: 'hot' | 'newest' | 'rating';
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface MarketTextbookListResponse {
  items: MarketTextbookItem[];
  total: number;
}

export interface MarketCourseListResponse {
  items: MarketCourseItem[];
  total: number;
}

export async function getMarketTextbooks(
  params?: MarketTextbookListParams,
): Promise<MarketTextbookListResponse> {
  try {
    const res = await axiosForBackend.get('/api/market-textbooks', { params });
    return res.data;
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getMarketCourses(
  params?: MarketCourseListParams,
): Promise<MarketCourseListResponse> {
  try {
    const res = await axiosForBackend.get('/api/market-courses', { params });
    return res.data;
  } catch {
    return { items: [], total: 0 };
  }
}

// Keep unused type import from triggering warnings
export type { ContentMarketItem };
