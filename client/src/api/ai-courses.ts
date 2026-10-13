import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { AICourse, PagedResponse, CreateAICourseDto } from '@shared/api.interface';

export async function getAICourses(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<AICourse>> {
  const res = await axiosForBackend.get('/api/ai-courses', { params });
  return res.data;
}

export async function getAICourse(id: string): Promise<AICourse> {
  const res = await axiosForBackend.get(`/api/ai-courses/${id}`);
  return res.data;
}

export async function generateAICourse(data: CreateAICourseDto): Promise<AICourse> {
  const res = await axiosForBackend.post('/api/ai-courses/generate', data);
  return res.data;
}

export async function deleteAICourse(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/ai-courses/${id}`);
}
