import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  MentalArithmeticItem,
  MathShapeListResponse,
  MathPuzzleListItem,
  ShapePuzzleItem,
  MathWordProblemItem,
  MathPracticeItem,
  MathPracticeSession,
  MathWrongQuestion,
  MathKnowledgeMastery,
  SubmitMathAnswerResponse,
  MathPracticeStats,
  PagedResponse,
} from '@shared/api.interface';

export async function getMentalArithmetic(params: {
  count?: number;
  difficulty?: number;
  operations?: string[];
  textbookId?: string;
  unitId?: string;
}): Promise<MentalArithmeticItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/math/mental-arithmetic', {
    params: {
      count: params.count,
      difficulty: params.difficulty,
      operations: params.operations?.join(','),
      textbookId: params.textbookId,
      unitId: params.unitId,
    },
  });
  return res.data;
}

export async function getShapes(): Promise<MathShapeListResponse> {
  const res = await axiosForBackend.get('/api/textbooks/math/shapes');
  return res.data;
}

export async function getPuzzleList(params?: {
  textbookId?: string;
  unitId?: string;
  difficulty?: number;
}): Promise<MathPuzzleListItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/math/puzzles', { params });
  return res.data;
}

export async function getPuzzleDetail(id: string): Promise<ShapePuzzleItem> {
  const res = await axiosForBackend.get(`/api/textbooks/math/puzzles/${id}`);
  return res.data;
}

export async function getMathWordProblems(params?: {
  textbookId?: string;
  unitId?: string;
  difficulty?: number;
  limit?: number;
}): Promise<MathWordProblemItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/math/word-problems', { params });
  return res.data;
}

// ===== 练习会话 =====

export async function createMathPracticeSession(params: {
  count: number;
  mode: string;
  itemTypes?: string[];
  difficulty?: string;
  topicId?: string;
  unitId?: string;
}): Promise<{ session: MathPracticeSession; items: MathPracticeItem[] }> {
  const res = await axiosForBackend.post('/api/math-practice/sessions', params);
  return res.data;
}

export async function submitMathAnswer(
  sessionId: string,
  itemId: string,
  userAnswer: string,
  timeSpent?: number,
): Promise<SubmitMathAnswerResponse> {
  const res = await axiosForBackend.post(
    `/api/math-practice/sessions/${sessionId}/submit`,
    { itemId, userAnswer, timeSpent },
  );
  return res.data;
}

export async function finishMathSession(
  sessionId: string,
  duration: number,
): Promise<MathPracticeSession> {
  const res = await axiosForBackend.post(
    `/api/math-practice/sessions/${sessionId}/finish`,
    { duration },
  );
  return res.data;
}

// ===== 错题本 =====

export async function getMathWrongQuestions(params?: {
  page?: number;
  pageSize?: number;
  itemType?: string;
}): Promise<PagedResponse<MathWrongQuestion>> {
  const res = await axiosForBackend.get('/api/math-practice/wrong-questions', {
    params,
  });
  return res.data;
}

export async function markMathWrongMastered(id: string): Promise<MathWrongQuestion> {
  const res = await axiosForBackend.patch(
    `/api/math-practice/wrong-questions/${id}/mastered`,
  );
  return res.data;
}

// ===== 统计 =====

export async function getMathPracticeStats(): Promise<MathPracticeStats> {
  const res = await axiosForBackend.get('/api/math-practice/stats');
  return res.data;
}

export async function getMathKnowledgeMastery(): Promise<MathKnowledgeMastery[]> {
  const res = await axiosForBackend.get('/api/math-practice/knowledge-mastery');
  return res.data;
}
