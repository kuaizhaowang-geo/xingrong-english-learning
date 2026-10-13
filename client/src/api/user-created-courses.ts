import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

// ===== Types =====

export interface UserCreatedCourse {
  id: string;
  name: string;
  coverImage?: string;
  subject: string;
  category?: string;
  description?: string;
  unitCount: number;
  visibility: string;
  status: string;
  auditNote?: string;
  learnCount: number;
  likeCount: number;
  favoriteCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListResponse {
  items: UserCreatedCourse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CourseUnit {
  id: string;
  courseId: string;
  title: string;
  unitOrder: number;
  description?: string;
  wordCount: number;
  sentenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitWord {
  id: string;
  unitId: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitSentence {
  id: string;
  unitId: string;
  sentence: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: { row: number; word?: string; sentence?: string; reason: string }[];
}

export interface BatchGenerateResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ word: string; reason: string }>;
}

export interface CreateCourseDto {
  name: string;
  subject?: string;
  category?: string;
  description?: string;
  coverImage?: string;
}

export interface UpdateCourseDto {
  name?: string;
  subject?: string;
  category?: string;
  description?: string;
  coverImage?: string;
}

export interface CreateUnitDto {
  title: string;
  unitOrder?: number;
  description?: string;
}

export interface UpdateUnitDto {
  title?: string;
  unitOrder?: number;
  description?: string;
}

export interface CreateWordDto {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface UpdateWordDto {
  word?: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning?: string;
  example?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface CreateSentenceDto {
  sentence: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

export interface UpdateSentenceDto {
  sentence?: string;
  translation?: string;
  grammarTag?: string;
  illustrationUrl?: string;
  sortOrder?: number;
}

// ===== Course CRUD =====

export async function getCourses(params?: {
  subject?: string;
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<CourseListResponse> {
  const res = await axiosForBackend.get('/api/user-created-courses', { params });
  return res.data;
}

export async function getCourse(id: string): Promise<UserCreatedCourse & {
  units: Array<{ id: string; title: string; unitOrder: number; wordCount: number; sentenceCount: number }>;
}> {
  const res = await axiosForBackend.get(`/api/user-created-courses/${id}`);
  return res.data;
}

export async function createCourse(dto: CreateCourseDto): Promise<UserCreatedCourse> {
  const res = await axiosForBackend.post('/api/user-created-courses', dto);
  return res.data;
}

export async function updateCourse(id: string, dto: UpdateCourseDto): Promise<UserCreatedCourse> {
  const res = await axiosForBackend.patch(`/api/user-created-courses/${id}`, dto);
  return res.data;
}

export async function deleteCourse(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/user-created-courses/${id}`);
}

// ===== Units =====

export async function getUnits(courseId: string): Promise<CourseUnit[]> {
  const res = await axiosForBackend.get(`/api/user-created-courses/${courseId}/units`);
  return res.data;
}

export async function createUnit(courseId: string, dto: CreateUnitDto): Promise<CourseUnit> {
  const res = await axiosForBackend.post(`/api/user-created-courses/${courseId}/units`, dto);
  return res.data;
}

export async function updateUnit(unitId: string, dto: UpdateUnitDto): Promise<CourseUnit> {
  const res = await axiosForBackend.patch(`/api/user-created-courses/units/${unitId}`, dto);
  return res.data;
}

export async function deleteUnit(unitId: string): Promise<void> {
  await axiosForBackend.delete(`/api/user-created-courses/units/${unitId}`);
}

// ===== Words =====

export async function getWords(unitId: string): Promise<UnitWord[]> {
  const res = await axiosForBackend.get(`/api/user-created-courses/units/${unitId}/words`);
  return res.data;
}

export async function createWord(unitId: string, dto: CreateWordDto): Promise<UnitWord> {
  const res = await axiosForBackend.post(`/api/user-created-courses/units/${unitId}/words`, dto);
  return res.data;
}

export async function updateWord(wordId: string, dto: UpdateWordDto): Promise<UnitWord> {
  const res = await axiosForBackend.patch(`/api/user-created-courses/words/${wordId}`, dto);
  return res.data;
}

export async function deleteWord(wordId: string): Promise<void> {
  await axiosForBackend.delete(`/api/user-created-courses/words/${wordId}`);
}

// ===== Sentences =====

export async function getSentences(unitId: string): Promise<UnitSentence[]> {
  const res = await axiosForBackend.get(`/api/user-created-courses/units/${unitId}/sentences`);
  return res.data;
}

export async function createSentence(unitId: string, dto: CreateSentenceDto): Promise<UnitSentence> {
  const res = await axiosForBackend.post(`/api/user-created-courses/units/${unitId}/sentences`, dto);
  return res.data;
}

export async function updateSentence(sentenceId: string, dto: UpdateSentenceDto): Promise<UnitSentence> {
  const res = await axiosForBackend.patch(`/api/user-created-courses/sentences/${sentenceId}`, dto);
  return res.data;
}

export async function deleteSentence(sentenceId: string): Promise<void> {
  await axiosForBackend.delete(`/api/user-created-courses/sentences/${sentenceId}`);
}

// ===== Bulk Import =====

export async function importWords(unitId: string, items: CreateWordDto[]): Promise<BatchImportResult> {
  const res = await axiosForBackend.post(`/api/user-created-courses/units/${unitId}/import-words`, { items });
  return res.data;
}

export async function importSentences(unitId: string, items: CreateSentenceDto[]): Promise<BatchImportResult> {
  const res = await axiosForBackend.post(`/api/user-created-courses/units/${unitId}/import-sentences`, { items });
  return res.data;
}

// ===== AI Generate =====

export async function generateWord(
  unitId: string,
  word: string,
): Promise<UnitWord> {
  const res = await axiosForBackend.post(
    `/api/user-created-courses/units/${unitId}/generate-word`,
    { word },
  );
  return res.data;
}

export async function batchGenerateWords(
  unitId: string,
  words: string[],
): Promise<BatchGenerateResult> {
  const res = await axiosForBackend.post(
    `/api/user-created-courses/units/${unitId}/batch-generate-words`,
    { words },
  );
  return res.data;
}

// ===== Share =====

export async function shareCourse(id: string): Promise<UserCreatedCourse> {
  const res = await axiosForBackend.post(`/api/user-created-courses/${id}/share`);
  return res.data;
}

export async function unshareCourse(id: string): Promise<UserCreatedCourse> {
  const res = await axiosForBackend.post(`/api/user-created-courses/${id}/unshare`);
  return res.data;
}
