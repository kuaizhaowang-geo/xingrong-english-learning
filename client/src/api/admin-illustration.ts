import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  IllustrationListResponse,
  IllustrationReviewRequest,
  IllustrationStats,
  AppSetting,
  AppSettingSaveRequest,
  AiIllustration,
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

// 获取AI设置
export async function getAiSettings(): Promise<AppSetting[]> {
  const res = await axiosForBackend.get('/api/admin/illustrations/settings', adminAxiosConfig());
  return res.data;
}

// 保存AI设置
export async function saveAiSetting(
  dto: AppSettingSaveRequest,
): Promise<AppSetting> {
  const res = await axiosForBackend.put(
    '/api/admin/illustrations/settings',
    dto,
    adminAxiosConfig(),
  );
  return res.data;
}

// 测试API连接
export async function testApiConnection(
  provider: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const res = await axiosForBackend.post(
    '/api/admin/illustrations/settings/test',
    { provider, apiKey },
    adminAxiosConfig(),
  );
  return res.data;
}

// 获取插图列表
export async function getIllustrations(params: {
  page?: number;
  pageSize?: number;
  contentType?: string;
  status?: string;
  keyword?: string;
}): Promise<IllustrationListResponse> {
  const res = await axiosForBackend.get('/api/admin/illustrations', {
    ...adminAxiosConfig(),
    params,
  });
  return res.data;
}

// 获取插图详情
export async function getIllustration(id: string): Promise<AiIllustration> {
  const res = await axiosForBackend.get(`/api/admin/illustrations/${id}`, adminAxiosConfig());
  return res.data;
}

// 批量审核
export async function batchReview(
  dto: IllustrationReviewRequest,
): Promise<{ updatedCount: number }> {
  const res = await axiosForBackend.put(
    '/api/admin/illustrations/batch-review',
    dto,
    adminAxiosConfig(),
  );
  return res.data;
}

// 单张通过
export async function approveIllustration(id: string): Promise<void> {
  await axiosForBackend.put(`/api/admin/illustrations/${id}/approve`, undefined, adminAxiosConfig());
}

// 单张拒绝
export async function rejectIllustration(
  id: string,
  note?: string,
): Promise<void> {
  await axiosForBackend.put(`/api/admin/illustrations/${id}/reject`, { note }, adminAxiosConfig());
}

// 删除插图
export async function deleteIllustration(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/illustrations/${id}`, adminAxiosConfig());
}

// 获取统计
export async function getStats(): Promise<IllustrationStats> {
  const res = await axiosForBackend.get('/api/admin/illustrations/stats', adminAxiosConfig());
  return res.data;
}
