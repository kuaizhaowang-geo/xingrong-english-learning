import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Textbook,
  TextbookUnit,
  TextbookTreeItem,
  UnitLessonsResponse,
  ChineseLesson,
  ChineseNewWord,
  ChinesePoetry,
  MathTopic,
  MathPracticeItem,
  MentalArithmeticItem,
  MathWordProblemItem,
  ChineseDictationSession,
  ChineseDictationWrongWord,
  ChineseDictationResult,
  CreateChineseDictationSessionDto,
  SubmitChineseDictationWordDto,
  SubmitChineseDictationSessionDto,
  PagedResponse,
} from '@shared/api.interface';

export async function getTextbooks(params?: {
  grade?: string;
  subject?: string;
  semester?: string;
  publisher?: string;
}): Promise<Textbook[]> {
  const res = await axiosForBackend.get('/api/textbooks', { params });
  return res.data;
}

export async function getTextbookDetail(id: string): Promise<{
  textbook: Textbook;
  units: TextbookUnit[];
}> {
  const res = await axiosForBackend.get(`/api/textbooks/${id}`);
  return res.data;
}

export async function getTextbookUnit(id: string, unitId: string): Promise<TextbookUnit> {
  const res = await axiosForBackend.get(`/api/textbooks/${id}/units/${unitId}`);
  return res.data;
}

export async function getTextbookTree(subject?: string): Promise<TextbookTreeItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/tree', {
    params: subject ? { subject } : undefined,
  });
  return res.data;
}

export async function getUnitLessons(
  textbookId: string,
  unitId: string,
): Promise<UnitLessonsResponse> {
  const res = await axiosForBackend.get(
    `/api/textbooks/${textbookId}/units/${unitId}/lessons`,
  );
  return res.data;
}

export async function getChineseLesson(lessonId: string): Promise<ChineseLesson> {
  const res = await axiosForBackend.get(`/api/textbooks/chinese/lessons/${lessonId}`);
  return res.data;
}

export async function getChineseCharacters(params: {
  textbookId?: string;
  unitId?: string;
  lessonId?: string;
}): Promise<ChineseNewWord[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/characters', { params });
  return res.data;
}

export async function getChinesePoetry(params: {
  textbookId?: string;
  grade?: string;
  unitId?: string;
  limit?: number;
}): Promise<ChinesePoetry[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/poetry', { params });
  return res.data;
}

export async function getChineseLessons(params: {
  textbookId?: string;
  unitId?: string;
  lessonType?: string;
}): Promise<ChineseLesson[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/lessons', { params });
  return res.data;
}

export async function getMathTopic(topicId: string): Promise<MathTopic & { practiceItems: MathPracticeItem[]; shapePuzzles: unknown[] }> {
  const res = await axiosForBackend.get(`/api/textbooks/math/topics/${topicId}`);
  return res.data;
}

export async function getMentalArithmetic(params: {
  count?: number;
  difficulty?: number;
  operations?: string[];
  textbookId?: string;
  unitId?: string;
}): Promise<MentalArithmeticItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/math/mental-arithmetic', {
    params: {
      ...params,
      operations: params.operations?.join(','),
    },
  });
  return res.data;
}

export async function getMathWordProblems(params: {
  textbookId?: string;
  unitId?: string;
  difficulty?: number;
  limit?: number;
}): Promise<MathWordProblemItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/math/word-problems', { params });
  return res.data;
}

// ===== 生字听写 =====

export async function createDictationSession(
  data: CreateChineseDictationSessionDto,
): Promise<ChineseDictationSession> {
  const res = await axiosForBackend.post('/api/textbooks/chinese/dictation', data);
  return res.data;
}

export async function getDictationSession(id: string): Promise<ChineseDictationSession> {
  const res = await axiosForBackend.get(`/api/textbooks/chinese/dictation/${id}`);
  return res.data;
}

export async function answerDictationWord(
  id: string,
  data: SubmitChineseDictationWordDto,
): Promise<{ isCorrect: boolean; correctAnswer: string; character?: string; pinyin?: string }> {
  const res = await axiosForBackend.post(
    `/api/textbooks/chinese/dictation/${id}/answer`,
    data,
  );
  return res.data;
}

export async function submitDictationSession(
  id: string,
  data: SubmitChineseDictationSessionDto,
): Promise<ChineseDictationResult> {
  const res = await axiosForBackend.post(
    `/api/textbooks/chinese/dictation/${id}/submit`,
    data,
  );
  return res.data;
}

export async function listDictationSessions(params: {
  grade?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<ChineseDictationSession>> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/dictation', { params });
  return res.data;
}

export async function listDictationWrongWords(params: {
  grade?: string;
  mastered?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<ChineseDictationWrongWord>> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/wrong-words', { params });
  return res.data;
}
