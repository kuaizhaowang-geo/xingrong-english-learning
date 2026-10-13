import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  DictationSession,
  DictationSessionWord,
  DictationWrongWord,
  DictationResult,
  CreateDictationSessionDto,
  SubmitDictationWordDto,
  SubmitDictationSessionDto,
  PagedResponse,
} from '@shared/api.interface';
import type {
  ChineseDictationSession,
  ChineseDictationSessionWord,
  ChineseDictationWrongWord,
  ChineseDictationResult,
  CreateChineseDictationSessionDto,
} from '@shared/api.interface';

function chineseToSessionWord(w: ChineseDictationSessionWord): DictationSessionWord {
  return {
    id: w.id,
    sessionId: w.sessionId,
    wordId: w.charId,
    word: w.character,
    pinyin: w.pinyin ?? '',
    wordOrder: w.wordOrder,
    userAnswer: w.userAnswer,
    isCorrect: w.isCorrect,
    answeredAt: w.answeredAt,
    radical: w.radical,
    strokes: w.strokes,
    meaning: w.meaning,
    example: w.examples,
  };
}

function chineseToSession(s: ChineseDictationSession): DictationSession {
  const words = (s.words ?? []).map(chineseToSessionWord);
  return {
    id: s.id,
    userId: s.userId,
    subject: s.subject,
    grade: s.grade,
    semester: s.semester,
    textbookId: s.textbookId,
    unitId: s.unitId,
    mode: s.mode,
    speechRate: s.speed,
    totalCount: s.totalCount,
    correctCount: s.correctCount ?? 0,
    currentIndex: 0,
    status: s.status,
    words,
    startTime: s.startedAt,
    endTime: s.submittedAt,
    durationSeconds: s.durationSeconds,
    score: s.score,
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
  };
}

function chineseToWrongWord(w: ChineseDictationWrongWord): DictationWrongWord {
  return {
    id: w.id,
    userId: w.userId,
    wordId: w.charId,
    word: w.character,
    pinyin: w.pinyin ?? '',
    radical: w.radical,
    strokes: w.strokes,
    meaning: w.meaning,
    example: w.examples,
    wrongCount: w.wrongCount,
    lastWrongAt: w.lastWrongAt,
    mastered: w.mastered,
    grade: undefined,
    semester: undefined,
  };
}

function chineseToResult(r: ChineseDictationResult): DictationResult {
  return {
    sessionId: r.session.id,
    totalCount: r.totalCount,
    correctCount: r.correctCount,
    wrongCount: r.wrongCount,
    accuracy: r.totalCount > 0 ? (r.correctCount / r.totalCount) * 100 : 0,
    score: r.score,
    durationSeconds: r.durationSeconds,
    wrongWords: r.words.filter((w) => !w.isCorrect).map(chineseToSessionWord),
  };
}

export async function createDictationSession(
  dto: CreateDictationSessionDto,
): Promise<DictationSession> {
  const body: CreateChineseDictationSessionDto = {
    grade: dto.grade ?? '',
    semester: dto.semester ?? 'upper',
    textbookId: dto.textbookId,
    unitId: dto.unitId,
    mode: dto.mode,
    speed: dto.speechRate,
    count: typeof dto.count === 'number' ? dto.count : undefined,
  };
  const res = await axiosForBackend.post<ChineseDictationSession>(
    '/api/textbooks/chinese/dictation',
    body,
  );
  return chineseToSession(res.data);
}

export async function getDictationSession(
  id: string,
): Promise<DictationSession> {
  const res = await axiosForBackend.get<ChineseDictationSession>(
    `/api/textbooks/chinese/dictation/${id}`,
  );
  return chineseToSession(res.data);
}

export async function answerDictationWord(
  dto: SubmitDictationWordDto,
): Promise<DictationSessionWord> {
  const res = await axiosForBackend.post<{
    isCorrect: boolean;
    correctAnswer: string;
    character?: string;
    pinyin?: string;
  }>(`/api/textbooks/chinese/dictation/${dto.sessionId}/answer`, {
    wordOrder: dto.wordOrder ?? 0,
    userAnswer: dto.userAnswer,
  });
  return {
    id: '',
    sessionId: dto.sessionId,
    wordId: dto.wordId ?? '',
    word: res.data.character ?? res.data.correctAnswer,
    pinyin: res.data.pinyin ?? '',
    wordOrder: dto.wordOrder ?? 0,
    userAnswer: dto.userAnswer,
    isCorrect: res.data.isCorrect,
  };
}

export async function submitDictationSession(
  dto: SubmitDictationSessionDto,
): Promise<DictationResult> {
  const res = await axiosForBackend.post<ChineseDictationResult>(
    `/api/textbooks/chinese/dictation/${dto.sessionId}/submit`,
    {
      answers: dto.answers ?? [],
      durationSeconds: dto.durationSeconds ?? 0,
    },
  );
  return chineseToResult(res.data);
}

export async function listDictationSessions(params?: {
  page?: number;
  pageSize?: number;
  subject?: string;
  grade?: string;
}): Promise<PagedResponse<DictationSession>> {
  const res = await axiosForBackend.get<PagedResponse<ChineseDictationSession>>(
    '/api/textbooks/chinese/dictation',
    { params },
  );
  return {
    ...res.data,
    items: res.data.items.map(chineseToSession),
  };
}

export async function listDictationWrongWords(params?: {
  page?: number;
  pageSize?: number;
  grade?: string;
  mastered?: boolean;
}): Promise<PagedResponse<DictationWrongWord>> {
  const res = await axiosForBackend.get<PagedResponse<ChineseDictationWrongWord>>(
    '/api/textbooks/chinese/wrong-words',
    { params },
  );
  return {
    ...res.data,
    items: res.data.items.map(chineseToWrongWord),
  };
}
