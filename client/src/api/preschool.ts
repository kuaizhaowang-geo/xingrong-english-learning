import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

export type LearningMode = 'typing' | 'dictation' | 'follow' | 'lookSpeak';

export interface PreschoolProgress {
  id: string;
  userId: string;
  module: string;
  contentId: string;
  mode: LearningMode;
  status: 'not_started' | 'learning' | 'completed';
  stars: number;
  score: number;
  correctCount: number;
  totalCount: number;
  attempts: number;
  completedAt?: string;
}

export interface PreschoolProgressSummary {
  totalStars: number;
  modules: Record<string, {
    totalItems: number;
    completedItems: number;
    stars: number;
    progressPercent: number;
  }>;
}

export interface PreschoolModule {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export interface PreschoolLetter {
  id: string;
  letter: string;
  uppercase: string;
  lowercase: string;
  phonetic: string;
  exampleWords: { word: string; meaning: string; emoji: string }[];
  color: string;
  sortOrder: number;
}

export interface PreschoolWord {
  id: string;
  category: string;
  word: string;
  phonetic: string;
  meaning: string;
  imageEmoji: string;
  exampleSentence: string;
  sortOrder: number;
}

export interface PreschoolPhonics {
  id: string;
  lessonNo: number;
  title: string;
  titleCn: string;
  soundPattern: string;
  description: string;
  words: { word: string; meaning: string; emoji: string }[];
  color: string;
  sortOrder: number;
}

export interface PreschoolSentence {
  id: string;
  category: string;
  sentence: string;
  translation: string;
  keywords: string[];
  dialogue: { speaker: string; text: string; translation: string }[];
  sortOrder: number;
}

export interface PreschoolSong {
  id: string;
  title: string;
  titleCn: string;
  keyWords: string[];
  sortOrder: number;
  audioUrl?: string;
}

export interface PreschoolSongDetail extends PreschoolSong {
  lyrics: { en: string; cn: string; highlight?: string[]; timestamp?: number }[];
  actions: string[];
}

export async function getModules(): Promise<PreschoolModule[]> {
  const res = await axiosForBackend.get('/api/preschool/modules');
  return res.data;
}

export async function getLetters(): Promise<PreschoolLetter[]> {
  const res = await axiosForBackend.get('/api/preschool/letters');
  return res.data;
}

export async function getLetter(letter: string): Promise<PreschoolLetter> {
  const res = await axiosForBackend.get(`/api/preschool/letters/${letter}`);
  return res.data;
}

export async function getWordCategories(): Promise<{ value: string; label: string; emoji: string; color: string }[]> {
  const res = await axiosForBackend.get('/api/preschool/words/categories');
  return res.data;
}

export async function getWords(category?: string): Promise<PreschoolWord[]> {
  const params = category ? { category } : {};
  const res = await axiosForBackend.get('/api/preschool/words', { params });
  return res.data;
}

export async function getPhonicsLessons(): Promise<PreschoolPhonics[]> {
  const res = await axiosForBackend.get('/api/preschool/phonics');
  return res.data;
}

export async function getPhonicsLesson(lessonNo: number): Promise<PreschoolPhonics> {
  const res = await axiosForBackend.get(`/api/preschool/phonics/${lessonNo}`);
  return res.data;
}

export async function getSentenceCategories(): Promise<{ value: string; label: string; emoji: string; color: string }[]> {
  const res = await axiosForBackend.get('/api/preschool/sentences/categories');
  return res.data;
}

export async function getSentences(category?: string): Promise<PreschoolSentence[]> {
  const params = category ? { category } : {};
  const res = await axiosForBackend.get('/api/preschool/sentences', { params });
  return res.data;
}

export async function getSongs(): Promise<PreschoolSong[]> {
  const res = await axiosForBackend.get('/api/preschool/songs');
  return res.data;
}

export async function getSong(id: string): Promise<PreschoolSongDetail> {
  const res = await axiosForBackend.get(`/api/preschool/songs/${id}`);
  return res.data;
}

export async function getProgress(module?: string): Promise<PreschoolProgress[]> {
  const params = module ? { module } : {};
  const res = await axiosForBackend.get('/api/preschool/progress', { params });
  return res.data;
}

export async function getProgressSummary(): Promise<PreschoolProgressSummary> {
  const res = await axiosForBackend.get('/api/preschool/progress/summary');
  return res.data;
}

export async function updateProgress(data: {
  module: string;
  contentId: string;
  mode: LearningMode;
  status?: string;
  stars?: number;
  score?: number;
  correctCount?: number;
  totalCount?: number;
  completed?: boolean;
}): Promise<PreschoolProgress> {
  const res = await axiosForBackend.patch('/api/preschool/progress', data);
  return res.data;
}

export async function batchUpdateProgress(records: unknown[]): Promise<{ updated: number }> {
  const res = await axiosForBackend.post('/api/preschool/progress/batch', { records });
  return res.data;
}