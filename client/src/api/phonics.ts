import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PhoneticItem,
  PhonicsProgressItem,
  PhonicsProgressSummary,
  PhonicsPracticeResult,
} from '@shared/api.interface';

export async function getPhonetics(category?: string): Promise<{ items: PhoneticItem[] }> {
  const res = await axiosForBackend.get('/api/phonics', { params: { category } });
  return res.data;
}

export async function getPhoneticDetail(id: string): Promise<{ item: PhoneticItem }> {
  const res = await axiosForBackend.get(`/api/phonics/${id}`);
  return res.data;
}

export async function getPhonicsProgressSummary(): Promise<PhonicsProgressSummary> {
  const res = await axiosForBackend.get('/api/phonics/progress/summary');
  return res.data;
}

export async function getPhonicsProgressList(): Promise<{ items: PhonicsProgressItem[] }> {
  const res = await axiosForBackend.get('/api/phonics/progress/list');
  return res.data;
}

export async function markPhoneticLearned(phoneticId: string): Promise<void> {
  await axiosForBackend.post(`/api/phonics/progress/${phoneticId}/learned`);
}

export async function recordPhonicsPractice(
  results: PhonicsPracticeResult[],
): Promise<void> {
  await axiosForBackend.post('/api/phonics/practice', { results });
}
