import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  LearnerStatsSummary,
  SubjectRadarData,
  ProgressDailyData,
  MistakeStats,
  Achievement,
} from '@shared/api.interface';

export async function getStatsSummary(): Promise<LearnerStatsSummary> {
  const res = await axiosForBackend.get('/api/learners/stats/summary');
  return res.data;
}

export async function getSubjectRadar(): Promise<SubjectRadarData> {
  const res = await axiosForBackend.get('/api/learners/stats/subject-radar');
  return res.data;
}

export async function getProgress(days: number = 7): Promise<{
  dailyData: ProgressDailyData[];
}> {
  const res = await axiosForBackend.get('/api/learners/stats/progress', {
    params: { days },
  });
  return res.data;
}

export async function getMistakes(): Promise<MistakeStats> {
  const res = await axiosForBackend.get('/api/learners/stats/mistakes');
  return res.data;
}

export async function getAchievements(): Promise<Achievement[]> {
  const res = await axiosForBackend.get('/api/learners/stats/achievements');
  return res.data;
}
