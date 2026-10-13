import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TypingCourse,
  TypingCourseListResponse,
  TypingRecord,
  TypingStats,
  TypingSubmitDto,
  TypingLevel,
  TypingPracticeMode,
  PagedResponse,
} from '@shared/api.interface';

export interface TypingTrendPoint {
  date: string;
  wpm: number;
  accuracy: number;
}

export interface GetCoursesOptions {
  level?: TypingLevel;
  practiceMode?: TypingPracticeMode;
  category?: string;
}

export async function getCourses(
  options: GetCoursesOptions = {},
): Promise<TypingCourseListResponse> {
  const { level, practiceMode, category } = options;
  const params: Record<string, string> = {};
  if (level) params.level = level;
  if (practiceMode) params.practiceMode = practiceMode;
  if (category) params.category = category;
  const res = await axiosForBackend.get<TypingCourseListResponse>('/api/typing/courses', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return res.data;
}

export async function getCourse(id: string): Promise<TypingCourse> {
  const res = await axiosForBackend.get<TypingCourse>(`/api/typing/courses/${id}`);
  return res.data;
}

export async function submitRecord(data: TypingSubmitDto): Promise<TypingRecord> {
  const res = await axiosForBackend.post<TypingRecord>('/api/typing/records', data);
  return res.data;
}

export async function getRecords(params?: {
  page?: number;
  pageSize?: number;
  courseId?: string;
}): Promise<PagedResponse<TypingRecord>> {
  const res = await axiosForBackend.get<PagedResponse<TypingRecord>>('/api/typing/records', {
    params,
  });
  return res.data;
}

export async function getStats(): Promise<TypingStats> {
  const res = await axiosForBackend.get<TypingStats>('/api/typing/stats');
  return res.data;
}

export async function getTrend(): Promise<TypingTrendPoint[]> {
  const res = await axiosForBackend.get<TypingTrendPoint[]>('/api/typing/stats/trend');
  return res.data;
}
