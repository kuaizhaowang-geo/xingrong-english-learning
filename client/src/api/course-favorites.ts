import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { CourseItem } from '@shared/api.interface';

export async function getFavorites(): Promise<CourseItem[]> {
  const res = await axiosForBackend.get('/api/course-favorites');
  return res.data;
}

export async function addFavorite(courseId: string): Promise<void> {
  await axiosForBackend.post('/api/course-favorites', { courseId });
}

export async function removeFavorite(courseId: string): Promise<void> {
  await axiosForBackend.delete(`/api/course-favorites/${courseId}`);
}

export async function checkFavorite(courseId: string): Promise<{ isFavorite: boolean }> {
  const res = await axiosForBackend.get(`/api/course-favorites/check/${courseId}`);
  return res.data;
}
