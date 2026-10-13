import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ChineseLesson,
  ChineseNewWord,
  ChineseDictationItem,
  ChinesePoetry,
  ChinesePracticeRecord,
  ChinesePracticeRecordDto,
} from '@shared/api.interface';

export async function getChineseLessons(params?: {
  textbookId?: string;
  unitId?: string;
  lessonType?: string;
}): Promise<ChineseLesson[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/lessons', {
    params,
  });
  return res.data;
}

export async function getChineseLessonDetail(id: string): Promise<ChineseLesson> {
  const res = await axiosForBackend.get(`/api/textbooks/chinese/lessons/${id}`);
  return res.data;
}

export async function getChineseCharacters(params?: {
  textbookId?: string;
  unitId?: string;
  lessonId?: string;
}): Promise<ChineseNewWord[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/characters', {
    params,
  });
  return res.data;
}

export async function getChineseDictation(params?: {
  count?: number;
  textbookId?: string;
}): Promise<ChineseDictationItem[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/dictation', {
    params,
  });
  return res.data;
}

export async function getChinesePoetry(params?: {
  textbookId?: string;
  grade?: string;
  unitId?: string;
}): Promise<ChinesePoetry[]> {
  const res = await axiosForBackend.get('/api/textbooks/chinese/poetry', {
    params,
  });
  return res.data;
}

export async function saveChinesePracticeRecord(
  dto: ChinesePracticeRecordDto,
): Promise<ChinesePracticeRecord> {
  const res = await axiosForBackend.post(
    '/api/textbooks/chinese/practice-records',
    dto,
  );
  return res.data;
}
