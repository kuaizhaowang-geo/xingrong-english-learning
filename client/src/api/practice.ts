import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  SentencePuzzle,
  DictationItem,
  SubmitFeedbackDto,
  UpdateSentenceMasteryDto,
  PagedResponse,
} from '@shared/api.interface';

export async function getSentencePuzzles(params?: {
  courseId?: string;
  lessonId?: string;
  textbookId?: string;
  unitId?: string;
  limit?: number;
  preschoolCategory?: string;
  preschoolModule?: string;
}): Promise<SentencePuzzle[]> {
  const res = await axiosForBackend.get('/api/practice/sentences', { params });
  return res.data;
}

export async function getSentencePuzzle(id: string): Promise<SentencePuzzle> {
  const res = await axiosForBackend.get(`/api/practice/sentences/${id}`);
  return res.data;
}

export async function submitSentenceResult(data: {
  puzzleId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  practiceMode?: string;
  lessonId?: string;
  courseId?: string;
  textbookId?: string;
  unitId?: string;
  preschoolCategory?: string;
  preschoolModule?: string;
}): Promise<void> {
  await axiosForBackend.post('/api/practice/sentences/submit', data);
}

export async function getDictationItems(params?: {
  courseId?: string;
  lessonId?: string;
  textbookId?: string;
  unitId?: string;
  limit?: number;
}): Promise<DictationItem[]> {
  const res = await axiosForBackend.get('/api/practice/dictations', { params });
  return res.data;
}

export async function getDictationItem(id: string): Promise<DictationItem> {
  const res = await axiosForBackend.get(`/api/practice/dictations/${id}`);
  return res.data;
}

export async function submitDictationResult(data: {
  dictationId: string;
  userAnswer: string;
  isCorrect: boolean;
  lessonId?: string;
  courseId?: string;
}): Promise<void> {
  await axiosForBackend.post('/api/practice/dictations/submit', data);
}

export async function getSentenceHistory(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<any>> {
  const res = await axiosForBackend.get('/api/practice/history/sentences', { params });
  return res.data;
}

export async function getDictationHistory(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<any>> {
  const res = await axiosForBackend.get('/api/practice/history/dictations', { params });
  return res.data;
}

export async function submitFeedback(
  data: SubmitFeedbackDto,
): Promise<{ id: string; puzzleId: string; errorType: string; status: string }> {
  const res = await axiosForBackend.post('/api/practice/sentences/feedback', data);
  return res.data;
}

export async function updateSentenceMastery(
  data: UpdateSentenceMasteryDto,
): Promise<{ puzzleId: string; status: string }> {
  const res = await axiosForBackend.post('/api/practice/sentences/mastery', data);
  return res.data;
}
