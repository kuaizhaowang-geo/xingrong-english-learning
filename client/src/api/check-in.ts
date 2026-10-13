import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { CheckInRecord } from '@shared/api.interface';

export async function checkIn(data?: {
  studyMinutes?: number;
  wordsLearned?: number;
  sentencesCompleted?: number;
}): Promise<CheckInRecord> {
  const res = await axiosForBackend.post('/api/check-in', data || {});
  return res.data;
}

export async function getTodayStatus(): Promise<{
  checkedIn: boolean;
  record?: CheckInRecord;
}> {
  const res = await axiosForBackend.get('/api/check-in/today');
  return res.data;
}

export async function getCheckInHistory(): Promise<CheckInRecord[]> {
  const res = await axiosForBackend.get('/api/check-in/history');
  return res.data;
}

export async function getCheckInStats(): Promise<{
  continuousDays: number;
  totalDays: number;
  monthDays: number;
}> {
  const res = await axiosForBackend.get('/api/check-in/stats');
  return res.data;
}
