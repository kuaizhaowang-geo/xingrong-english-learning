import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Question,
  PagedResponse,
  GenerateQuestionsDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  AIQuiz,
  AIQuizResult,
  AIWrongQuestion,
  CreateAIQuizDto,
  SubmitAIQuizAnswerDto,
  SubmitAIQuizDto,
} from '@shared/api.interface';

export async function listQuestions(params: {
  subject?: string;
  grade?: string;
  semester?: string;
  unitId?: string;
  knowledgePoint?: string;
  questionType?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<Question>> {
  const res = await axiosForBackend.get('/api/questions', { params });
  return res.data;
}

export async function getQuestion(id: string): Promise<Question> {
  const res = await axiosForBackend.get(`/api/questions/${id}`);
  return res.data;
}

export async function generateQuestions(
  data: GenerateQuestionsDto,
): Promise<Question[]> {
  const res = await axiosForBackend.post('/api/questions/generate', data);
  return res.data;
}

export async function createQuestion(data: CreateQuestionDto): Promise<Question> {
  const res = await axiosForBackend.post('/api/questions', data);
  return res.data;
}

export async function updateQuestion(
  id: string,
  data: UpdateQuestionDto,
): Promise<Question> {
  const res = await axiosForBackend.patch(`/api/questions/${id}`, data);
  return res.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/questions/${id}`);
}

// ===== AI 出题会话 =====

export async function createAIQuiz(
  data: CreateAIQuizDto,
): Promise<AIQuiz> {
  const res = await axiosForBackend.post('/api/questions/ai-quizzes', data);
  return res.data;
}

export async function getAIQuiz(id: string): Promise<AIQuiz> {
  const res = await axiosForBackend.get(`/api/questions/ai-quizzes/${id}`);
  return res.data;
}

export async function answerAIQuiz(
  id: string,
  data: SubmitAIQuizAnswerDto,
): Promise<{ isCorrect: boolean; correctAnswer: string; analysis?: string }> {
  const res = await axiosForBackend.post(
    `/api/questions/ai-quizzes/${id}/answer`,
    data,
  );
  return res.data;
}

export async function submitAIQuiz(
  id: string,
  data: SubmitAIQuizDto,
): Promise<AIQuizResult> {
  const res = await axiosForBackend.post(
    `/api/questions/ai-quizzes/${id}/submit`,
    data,
  );
  return res.data;
}

export async function listAIQuizzes(params: {
  subject?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<AIQuiz>> {
  const res = await axiosForBackend.get('/api/questions/ai-quizzes', { params });
  return res.data;
}

export async function listAIWrongQuestions(params: {
  subject?: string;
  mastered?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<AIWrongQuestion>> {
  const res = await axiosForBackend.get('/api/questions/ai-wrong-questions', {
    params,
  });
  return res.data;
}
