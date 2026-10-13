import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { CourseItem, CourseLesson, PagedResponse } from '@shared/api.interface';

export async function getCourses(params?: {
  category?: string;
  level?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}): Promise<PagedResponse<CourseItem>> {
  const res = await axiosForBackend.get('/api/courses', { params });
  return res.data;
}

export async function getCourseDetail(id: string): Promise<{
  course: CourseItem;
  lessons: CourseLesson[];
}> {
  const res = await axiosForBackend.get(`/api/courses/${id}`);
  return res.data;
}

export async function createCourse(data: Partial<CourseItem>): Promise<CourseItem> {
  const res = await axiosForBackend.post('/api/courses', data);
  return res.data;
}

export async function updateCourse(id: string, data: Partial<CourseItem>): Promise<CourseItem> {
  const res = await axiosForBackend.patch(`/api/courses/${id}`, data);
  return res.data;
}

export async function deleteCourse(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/courses/${id}`);
}
