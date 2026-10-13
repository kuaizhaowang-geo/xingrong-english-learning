import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  WrongWordItem,
  WrongSentenceItem,
  MasterStatus,
  BatchDeleteWordsDto,
  BatchDeleteSentencesDto,
  UpdateMasterStatusDto,
} from '@shared/api.interface';

// ===== 单词错题本 =====

export async function getWrongWords(status: MasterStatus): Promise<WrongWordItem[]> {
  const res = await axiosForBackend.get('/api/wrong-book/words', { params: { status } });
  return res.data;
}

export async function updateWordStatus(
  wordId: string,
  status: MasterStatus,
): Promise<WrongWordItem> {
  const res = await axiosForBackend.patch(`/api/wrong-book/words/${wordId}/status`, {
    status,
  } as UpdateMasterStatusDto);
  return res.data;
}

export async function batchDeleteWords(wordIds: string[]): Promise<void> {
  await axiosForBackend.delete('/api/wrong-book/words', { data: { wordIds } as BatchDeleteWordsDto });
}

export async function clearAllWords(status: MasterStatus): Promise<void> {
  await axiosForBackend.delete('/api/wrong-book/words/all', { params: { status } });
}

// ===== 句子错题本 =====

export async function getWrongSentences(status: MasterStatus): Promise<WrongSentenceItem[]> {
  const res = await axiosForBackend.get('/api/wrong-book/sentences', { params: { status } });
  return res.data;
}

export async function updateSentenceStatus(
  puzzleId: string,
  status: MasterStatus,
): Promise<WrongSentenceItem> {
  const res = await axiosForBackend.patch(`/api/wrong-book/sentences/${puzzleId}/status`, {
    status,
  } as UpdateMasterStatusDto);
  return res.data;
}

export async function batchDeleteSentences(puzzleIds: string[]): Promise<void> {
  await axiosForBackend.delete('/api/wrong-book/sentences', {
    data: { puzzleIds } as BatchDeleteSentencesDto,
  });
}

export async function clearAllSentences(status: MasterStatus): Promise<void> {
  await axiosForBackend.delete('/api/wrong-book/sentences/all', { params: { status } });
}
