import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { SentencePuzzle } from '@shared/api.interface';

export async function getFavorites(): Promise<SentencePuzzle[]> {
  const res = await axiosForBackend.get('/api/sentence-favorites');
  return res.data;
}

export async function addFavorite(sentenceId: string): Promise<void> {
  await axiosForBackend.post('/api/sentence-favorites', { sentenceId });
}

export async function removeFavorite(sentenceId: string): Promise<void> {
  await axiosForBackend.delete(`/api/sentence-favorites/${sentenceId}`);
}

export async function checkFavorite(sentenceId: string): Promise<{ isFavorite: boolean }> {
  const res = await axiosForBackend.get(`/api/sentence-favorites/check/${sentenceId}`);
  return res.data;
}
