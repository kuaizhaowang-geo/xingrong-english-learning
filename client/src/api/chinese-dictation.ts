import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ChineseCharacter,
  ChineseDictationSession,
  ChineseWrongCharacter,
  ChineseDictationStats,
  SubmitDictationAnswerDto,
  SubmitDictationAnswerResponse,
  PagedResponse,
} from '@shared/api.interface';

export async function getCharacters(params: {
  page: number;
  pageSize: number;
  grade?: string;
  semester?: string;
  unitId?: string;
  difficulty?: string;
}): Promise<PagedResponse<ChineseCharacter>> {
  const res = await axiosForBackend.get('/api/chinese-dictation/characters', { params });
  return res.data;
}

export async function getRandomCharacters(params: {
  count: number;
  grade?: string;
  semester?: string;
  unitId?: string;
  difficulty?: string;
}): Promise<{ items: ChineseCharacter[] }> {
  const res = await axiosForBackend.get('/api/chinese-dictation/characters/random', { params });
  return res.data;
}

export async function getCharacterDetail(id: string): Promise<ChineseCharacter> {
  const res = await axiosForBackend.get(`/api/chinese-dictation/characters/${id}`);
  return res.data;
}

export async function startDictationSession(data: {
  grade?: string;
  semester?: string;
  unitId?: string;
  count: number;
  difficulty?: string;
  mode: string;
}): Promise<{ session: ChineseDictationSession; characters: ChineseCharacter[] }> {
  const res = await axiosForBackend.post('/api/chinese-dictation/sessions', data);
  return res.data;
}

export async function submitDictationAnswer(
  sessionId: string,
  data: SubmitDictationAnswerDto,
): Promise<SubmitDictationAnswerResponse> {
  const res = await axiosForBackend.post(
    `/api/chinese-dictation/sessions/${sessionId}/submit`,
    data,
  );
  return res.data;
}

export async function finishDictationSession(
  sessionId: string,
  data: { duration: number },
): Promise<ChineseDictationSession> {
  const res = await axiosForBackend.post(
    `/api/chinese-dictation/sessions/${sessionId}/finish`,
    data,
  );
  return res.data;
}

export async function getDictationSessions(params: {
  page: number;
  pageSize: number;
}): Promise<PagedResponse<ChineseDictationSession>> {
  const res = await axiosForBackend.get('/api/chinese-dictation/sessions', { params });
  return res.data;
}

export async function getWrongCharacters(params: {
  page: number;
  pageSize: number;
  status?: string;
}): Promise<PagedResponse<ChineseWrongCharacter>> {
  const res = await axiosForBackend.get('/api/chinese-dictation/wrong-characters', { params });
  return res.data;
}

export async function markWrongCharacterMastered(id: string): Promise<ChineseWrongCharacter> {
  const res = await axiosForBackend.post(
    `/api/chinese-dictation/wrong-characters/${id}/master`,
  );
  return res.data;
}

export async function getDictationStats(): Promise<ChineseDictationStats> {
  const res = await axiosForBackend.get('/api/chinese-dictation/stats');
  return res.data;
}
