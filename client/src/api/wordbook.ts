import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  UserWordbook,
  UserWordbookItem,
  CreateWordbookDto,
  UpdateWordbookDto,
  AddWordbookItemDto,
  WordbookSubject,
  WordbookContentType,
  WordbookListResponse,
  WordbookItemListResponse,
  BatchImportResult,
  TextExtractResult,
  StudySessionResult,
  StudyRecordDto,
} from '@shared/api.interface';

interface WordbookListParams {
  subject?: WordbookSubject;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface WordbookItemListParams {
  search?: string;
  isStarred?: boolean;
  page?: number;
  pageSize?: number;
}

interface StudyItemsParams {
  mode?: string;
  limit?: number;
  includeStarred?: boolean;
}

interface OverviewStats {
  totalWordbooks: number;
  totalItems: number;
  studiedItems: number;
}

export async function getWordbooks(
  params?: WordbookListParams,
): Promise<WordbookListResponse> {
  const res = await axiosForBackend.get('/api/wordbooks', { params });
  return res.data;
}

export async function getWordbook(id: string): Promise<UserWordbook> {
  const res = await axiosForBackend.get(`/api/wordbooks/${id}`);
  return res.data;
}

export async function createWordbook(
  data: CreateWordbookDto,
): Promise<UserWordbook> {
  const res = await axiosForBackend.post('/api/wordbooks', data);
  return res.data;
}

export async function updateWordbook(
  id: string,
  data: UpdateWordbookDto,
): Promise<UserWordbook> {
  const res = await axiosForBackend.patch(`/api/wordbooks/${id}`, data);
  return res.data;
}

export async function deleteWordbook(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/wordbooks/${id}`);
}

export async function getWordbookItems(
  id: string,
  params?: WordbookItemListParams,
): Promise<WordbookItemListResponse> {
  const res = await axiosForBackend.get(`/api/wordbooks/${id}/items`, { params });
  return res.data;
}

export async function addWordbookItem(
  id: string,
  data: AddWordbookItemDto,
): Promise<UserWordbookItem> {
  const res = await axiosForBackend.post(`/api/wordbooks/${id}/items`, data);
  return res.data;
}

export async function addItemsBatch(
  id: string,
  items: AddWordbookItemDto[],
): Promise<BatchImportResult> {
  const res = await axiosForBackend.post(
    `/api/wordbooks/${id}/items/batch`,
    { items },
  );
  return res.data;
}

export async function updateWordbookItem(
  id: string,
  itemId: string,
  data: Partial<AddWordbookItemDto>,
): Promise<UserWordbookItem> {
  const res = await axiosForBackend.patch(
    `/api/wordbooks/${id}/items/${itemId}`,
    data,
  );
  return res.data;
}

export async function deleteWordbookItem(
  id: string,
  itemId: string,
): Promise<void> {
  await axiosForBackend.delete(`/api/wordbooks/${id}/items/${itemId}`);
}

export async function toggleStar(
  id: string,
  itemId: string,
): Promise<{ isStarred: boolean }> {
  const res = await axiosForBackend.post(
    `/api/wordbooks/${id}/items/${itemId}/star`,
  );
  return res.data;
}

interface AddFromSourceDto {
  source: 'textbook';
  sourceType: 'word' | 'sentence' | 'dictation';
  sourceIds: string[];
  sourceInfo?: { textbookName?: string; grade?: string; unit?: string };
}

export async function addFromSource(
  id: string,
  data: AddFromSourceDto,
): Promise<BatchImportResult> {
  const res = await axiosForBackend.post(
    `/api/wordbooks/${id}/add-from-source`,
    data,
  );
  return res.data;
}

interface ExtractTextDto {
  text: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
}

export async function extractText(
  data: ExtractTextDto,
): Promise<TextExtractResult> {
  const res = await axiosForBackend.post('/api/wordbooks/extract-text', data);
  return res.data;
}

export async function getStudyItems(
  id: string,
  params?: StudyItemsParams,
): Promise<{ items: UserWordbookItem[] }> {
  const res = await axiosForBackend.get(`/api/wordbooks/${id}/study-items`, {
    params,
  });
  return res.data;
}

export async function submitStudyRecord(
  data: StudyRecordDto[],
): Promise<void> {
  await axiosForBackend.post('/api/wordbooks/study-record', { records: data });
}

interface CompleteSessionDto {
  mode: string;
  total: number;
  correct: number;
  wrong: number;
  durationSeconds: number;
}

export async function completeStudySession(
  id: string,
  data: CompleteSessionDto,
): Promise<StudySessionResult> {
  const res = await axiosForBackend.post(
    `/api/wordbooks/${id}/study-complete`,
    data,
  );
  return res.data;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const res = await axiosForBackend.get('/api/wordbooks/overview/stats');
  return res.data;
}
