import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  WordItem,
  UserWordRecord,
  PagedResponse,
  WordAffix,
  WordAffixDetail,
  WordStats,
  WordNote,
   WordRelatedGroup,
   ReviewMode,
   WordStatsRange,
   WordLearningStats,
 } from '@shared/api.interface';

export async function getWords(params?: {
  level?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  sort?: 'order' | 'alpha_asc' | 'alpha_desc' | 'familiarity' | 'created';
  tags?: string;
}): Promise<PagedResponse<WordItem>> {
  const res = await axiosForBackend.get('/api/words', { params });
  return res.data;
}

export async function getWordDetail(id: string): Promise<WordItem> {
  const res = await axiosForBackend.get(`/api/words/${id}`);
  return res.data;
}

export async function getTodayReview(
  mode: ReviewMode = 'full',
  limit?: number,
): Promise<(UserWordRecord & { word: WordItem })[]> {
  const res = await axiosForBackend.get('/api/words/review/today', { params: { mode, limit } });
  return res.data;
}

export async function updateWordRecord(data: {
  wordId: string;
  isCorrect: boolean;
  practiceType?: string;
}): Promise<UserWordRecord> {
  const res = await axiosForBackend.post('/api/words/records', data);
  return res.data;
}

const BATCH_SIZE = 100;

export async function getWordsByList(words: string[]): Promise<WordItem[]> {
  if (words.length <= BATCH_SIZE) {
    const res = await axiosForBackend.post('/api/words/batch-detail', { words });
    return res.data;
  }
  const batches: string[][] = [];
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    batches.push(words.slice(i, i + BATCH_SIZE));
  }
  const results = await Promise.all(
    batches.map((batch: string[]) =>
      axiosForBackend.post('/api/words/batch-detail', { words: batch }).then((res) => res.data),
    ),
  );
  return results.flat();
}

export async function getWordStats(): Promise<WordStats> {
  const res = await axiosForBackend.get('/api/words/records/stats');
  return res.data;
}

export async function getAffixes(type?: string, search?: string): Promise<WordAffix[]> {
  const res = await axiosForBackend.get('/api/words/roots', { params: { type, search } });
  return res.data;
}

export async function getAffixDetail(id: string): Promise<WordAffixDetail> {
  const res = await axiosForBackend.get(`/api/words/roots/${id}`);
  return res.data;
}

export async function getFavorites(): Promise<WordItem[]> {
  const res = await axiosForBackend.get('/api/words/favorites');
  return res.data;
}

export async function addFavorite(wordId: string): Promise<void> {
  await axiosForBackend.post('/api/words/favorites', { wordId });
}

export async function removeFavorite(wordId: string): Promise<void> {
  await axiosForBackend.delete(`/api/words/favorites/${wordId}`);
}

export async function checkFavorite(wordId: string): Promise<{ isFavorite: boolean }> {
  const res = await axiosForBackend.get(`/api/words/favorites/check/${wordId}`);
  return res.data;
}

export async function getWrongWords(limit?: number): Promise<WordItem[]> {
  const res = await axiosForBackend.get('/api/words/wrong/list', { params: { limit } });
  return res.data;
}

export async function getMasteredWords(limit?: number): Promise<WordItem[]> {
  const res = await axiosForBackend.get('/api/words/mastered/list', { params: { limit } });
  return res.data;
}

export interface UserWordRecordLite {
  wordId: string;
  ebbinghausLevel: number;
  status: string;
  familiarity: number;
  wrongCount: number;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export async function getAllUserWordRecords(): Promise<UserWordRecordLite[]> {
  const res = await axiosForBackend.get('/api/words/user-records');
  return res.data;
}

export async function getUserRecords(): Promise<UserWordRecord[]> {
  const res = await axiosForBackend.get('/api/words/user-records');
  return res.data;
}

export interface WordSettings {
  dailyGoal: number;
  preferredModes: string[];
  reminderEnabled: boolean;
  reminderTime: string;
}

export async function getWordSettings(): Promise<WordSettings> {
  const res = await axiosForBackend.get('/api/words/settings');
  return res.data;
}

export async function updateWordSettings(data: Partial<WordSettings>): Promise<WordSettings> {
  const res = await axiosForBackend.put('/api/words/settings', data);
  return res.data;
}

export async function getChoiceDistractors(wordId: string, count = 3): Promise<WordItem[]> {
  const res = await axiosForBackend.get(`/api/words/choice/distractors/${wordId}`, { params: { count } });
  return res.data;
}

export async function getWordRelations(wordId: string): Promise<WordRelatedGroup[]> {
  const res = await axiosForBackend.get(`/api/words/${wordId}/relations`);
  return res.data;
}

export async function getLearningStats(range: WordStatsRange = 'week'): Promise<WordLearningStats> {
  const res = await axiosForBackend.get('/api/words/stats/learning', { params: { range } });
  return res.data;
}

// ===== Word Notes =====

export async function getWordNotes(wordId: string): Promise<WordNote[]> {
  const res = await axiosForBackend.get(`/api/words/notes/${wordId}`);
  return res.data;
}

export async function createWordNote(wordId: string, content: string): Promise<WordNote> {
  const res = await axiosForBackend.post('/api/words/notes', { wordId, content });
  return res.data;
}

export async function updateWordNote(noteId: string, content: string): Promise<WordNote> {
  const res = await axiosForBackend.put(`/api/words/notes/${noteId}`, { content });
  return res.data;
}

export async function deleteWordNote(noteId: string): Promise<void> {
  await axiosForBackend.delete(`/api/words/notes/${noteId}`);
}
