import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { LearnerProfile, LearnerPreferences } from '@shared/api.interface';

export async function getMe(): Promise<LearnerProfile> {
  const res = await axiosForBackend.get('/api/learners/me');
  return res.data;
}

export async function updateMe(data: {
  nickname?: string;
  avatarUrl?: string;
  preferences?: LearnerPreferences;
}): Promise<LearnerProfile> {
  const res = await axiosForBackend.patch('/api/learners/me', data);
  return res.data;
}

export async function getStats(): Promise<{
  totalStudyMinutes: number;
  totalWords: number;
  continuousCheckInDays: number;
  totalCheckInDays: number;
  enrolledCourses: number;
}> {
  const res = await axiosForBackend.get('/api/learners/stats');
  return res.data;
}
