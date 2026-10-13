import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { StudyJournal, PagedResponse, JournalCalendarResponse } from '@shared/api.interface';

export async function getJournals(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
}): Promise<PagedResponse<StudyJournal>> {
  const res = await axiosForBackend.get('/api/journals', { params });
  return res.data;
}

export async function getJournal(date: string): Promise<StudyJournal> {
  const res = await axiosForBackend.get(`/api/journals/${date}`);
  return res.data;
}

export async function saveJournal(data: {
  journalDate: string;
  content?: string;
  mood?: string;
  masteryScore?: number;
  highlights?: string[];
}): Promise<StudyJournal> {
  const res = await axiosForBackend.put('/api/journals', data);
  return res.data;
}

export async function deleteJournal(date: string): Promise<void> {
  await axiosForBackend.delete(`/api/journals/${date}`);
}

export async function searchJournals(q: string): Promise<StudyJournal[]> {
  const res = await axiosForBackend.get('/api/journals/search', { params: { q } });
  return res.data;
}

export async function getCalendar(year: number, month: number): Promise<JournalCalendarResponse> {
  const res = await axiosForBackend.get('/api/journals/calendar', { params: { year, month } });
  return res.data;
}

export async function aiSummarize(content: string): Promise<{ summary: string }> {
  const res = await axiosForBackend.post('/api/journals/ai/summarize', { content });
  return res.data;
}

export async function aiWrongQuestionAnalysis(data: {
  question: string;
  wrongAnswer?: string;
  correctAnswer?: string;
}): Promise<{ analysis: string; similarQuestions: string[] }> {
  const res = await axiosForBackend.post('/api/journals/ai/wrong-question-analysis', data);
  return res.data;
}

export async function aiKnowledgeOrganize(knowledge: string): Promise<{ structured: string }> {
  const res = await axiosForBackend.post('/api/journals/ai/knowledge-organize', { knowledge });
  return res.data;
}
