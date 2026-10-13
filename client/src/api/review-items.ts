import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ReviewItem,
  ReviewListResponse,
  MarkUnfamiliarDto,
  ReviewStats,
} from '@shared/api.interface';

export const reviewItemsApi = {
  list(params: {
    subject?: string;
    itemType?: string;
    status?: string;
    dueOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ReviewListResponse> {
    return axiosForBackend
      .get<ReviewListResponse>('/api/review-items', { params })
      .then((res) => res.data);
  },

  markUnfamiliar(dto: MarkUnfamiliarDto): Promise<ReviewItem> {
    return axiosForBackend
      .post<ReviewItem>('/api/review-items', dto)
      .then((res) => res.data);
  },

  markMastered(id: string): Promise<void> {
    return axiosForBackend
      .patch(`/api/review-items/${id}/mastered`)
      .then(() => undefined);
  },

  recordReview(id: string, isCorrect: boolean): Promise<ReviewItem> {
    return axiosForBackend
      .post<ReviewItem>(`/api/review-items/${id}/review`, { isCorrect })
      .then((res) => res.data);
  },

  getStats(): Promise<ReviewStats> {
    return axiosForBackend
      .get<ReviewStats>('/api/review-items/stats')
      .then((res) => res.data);
  },

  delete(id: string): Promise<void> {
    return axiosForBackend
      .delete(`/api/review-items/${id}`)
      .then(() => undefined);
  },

  batchDelete(ids: string[]): Promise<void> {
    return axiosForBackend
      .delete('/api/review-items/batch', { data: { ids } })
      .then(() => undefined);
  },
};
