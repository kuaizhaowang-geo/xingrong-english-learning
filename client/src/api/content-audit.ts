import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  SensitiveWord,
  ContentCheckResult,
  AiQuestionReview,
  UserContentReview,
  AuditStats,
} from '@shared/api.interface';

const ADMIN_TOKEN_KEY = 'admin_token';

function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function adminAxiosConfig(): { headers: Record<string, string> } {
  const token = getAdminToken();
  return { headers: token ? { 'x-admin-token': token } : {} };
}

export async function checkContent(text: string): Promise<ContentCheckResult> {
  const res = await axiosForBackend.post('/api/content/check', { text });
  return res.data;
}

export async function getSensitiveWords(params: {
  page: number;
  pageSize: number;
  category?: string;
  level?: string;
  keyword?: string;
}): Promise<{ items: SensitiveWord[]; total: number; page: number; pageSize: number }> {
  const res = await axiosForBackend.get('/api/admin/sensitive-words', {
    ...adminAxiosConfig(),
    params,
  });
  return res.data;
}

export async function createSensitiveWord(data: {
  word: string;
  category: string;
  level: string;
}): Promise<SensitiveWord> {
  const res = await axiosForBackend.post('/api/admin/sensitive-words', data, adminAxiosConfig());
  return res.data;
}

export async function updateSensitiveWord(
  id: string,
  data: { word?: string; category?: string; level?: string },
): Promise<SensitiveWord> {
  const res = await axiosForBackend.put(`/api/admin/sensitive-words/${id}`, data, adminAxiosConfig());
  return res.data;
}

export async function deleteSensitiveWord(id: string): Promise<{ success: boolean }> {
  const res = await axiosForBackend.delete(`/api/admin/sensitive-words/${id}`, adminAxiosConfig());
  return res.data;
}

export async function batchImportSensitiveWords(words: Array<{
  word: string;
  category: string;
  level: string;
}>): Promise<{ successCount: number; failCount: number }> {
  const res = await axiosForBackend.post(
    '/api/admin/sensitive-words/batch-import',
    { words },
    adminAxiosConfig(),
  );
  return res.data;
}

export async function getAiQuestionReviews(params: {
  page: number;
  pageSize: number;
  status?: string;
}): Promise<{ items: AiQuestionReview[]; total: number; page: number; pageSize: number }> {
  const res = await axiosForBackend.get('/api/admin/ai-question-reviews', {
    ...adminAxiosConfig(),
    params,
  });
  return res.data;
}

export async function approveAiQuestion(
  id: string,
  comment?: string,
): Promise<AiQuestionReview> {
  const res = await axiosForBackend.post(
    `/api/admin/ai-question-reviews/${id}/approve`,
    { comment },
    adminAxiosConfig(),
  );
  return res.data;
}

export async function rejectAiQuestion(
  id: string,
  comment?: string,
): Promise<AiQuestionReview> {
  const res = await axiosForBackend.post(
    `/api/admin/ai-question-reviews/${id}/reject`,
    { comment },
    adminAxiosConfig(),
  );
  return res.data;
}

export async function getUserContentReviews(params: {
  page: number;
  pageSize: number;
  status?: string;
  contentType?: string;
}): Promise<{ items: UserContentReview[]; total: number; page: number; pageSize: number }> {
  const res = await axiosForBackend.get('/api/admin/user-content-reviews', {
    ...adminAxiosConfig(),
    params,
  });
  return res.data;
}

export async function approveUserContent(
  id: string,
  comment?: string,
): Promise<UserContentReview> {
  const res = await axiosForBackend.post(
    `/api/admin/user-content-reviews/${id}/approve`,
    { comment },
    adminAxiosConfig(),
  );
  return res.data;
}

export async function rejectUserContent(
  id: string,
  comment?: string,
): Promise<UserContentReview> {
  const res = await axiosForBackend.post(
    `/api/admin/user-content-reviews/${id}/reject`,
    { comment },
    adminAxiosConfig(),
  );
  return res.data;
}

export async function getAuditStats(): Promise<AuditStats> {
  const res = await axiosForBackend.get('/api/admin/audit-stats', adminAxiosConfig());
  return res.data;
}
