import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  AdminLoginResponse,
  AdminUser,
  AdminWordItem,
  AdminSentenceItem,
  AdminChineseCharItem,
  AdminMathTopicItem,
  AdminMathPracticeItem,
  AdminUserItem,
  AdminUserDetail,
  AdminCourseItem,
  AuditLogItem,
  AdminUserManageItem,
  Textbook,
  TextbookUnit,
  TextbookTreeItem,
  CourseLesson,
  DictationItem,
  WordItem,
  PagedResponse,
  DashboardStats,
  DailyStudyTrend,
  SubjectDistribution,
  UserRegisterTrend,
  AdminRankItem,
  RecentActivity,
  UgcAuditItem,
  UgcAuditDetail,
  UgcAuditListResponse,
  UgcContentType,
  UgcAuditStatus,
} from '@shared/api.interface';

const ADMIN_TOKEN_KEY = 'admin_token';

function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (err) {
    logger.error('Failed to save admin token', { error: String(err) });
  }
}

function removeAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (err) {
    logger.error('Failed to remove admin token', { error: String(err) });
  }
}

/**
 * 管理端 axios 包装器：自动注入 x-admin-token header
 */
async function adminRequest<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['x-admin-token'] = token;
  }

  const config = {
    headers,
    params,
  };

  let res;
  switch (method) {
    case 'get':
      res = await axiosForBackend.get(url, config);
      break;
    case 'post':
      res = await axiosForBackend.post(url, data, config);
      break;
    case 'put':
      res = await axiosForBackend.put(url, data, config);
      break;
    case 'patch':
      res = await axiosForBackend.patch(url, data, config);
      break;
    case 'delete':
      res = await axiosForBackend.delete(url, config);
      break;
  }
  return res.data;
}

// ===== 认证接口 =====

export async function login(
  username: string,
  password: string,
): Promise<AdminLoginResponse> {
  const data = await adminRequest<AdminLoginResponse>('post', '/api/admin/login', {
    username,
    password,
  });
  if (data?.token) {
    setAdminToken(data.token);
  }
  return data;
}

export async function getMe(): Promise<AdminUser> {
  return adminRequest<AdminUser>('get', '/api/admin/me');
}

export async function logout(): Promise<void> {
  try {
    await adminRequest<void>('post', '/api/admin/logout');
  } finally {
    removeAdminToken();
  }
}

// ===== 仪表盘接口 =====

export async function getDashboardStats(): Promise<DashboardStats> {
  return adminRequest<DashboardStats>('get', '/api/admin/dashboard/stats');
}

export async function getStudyTrend(): Promise<DailyStudyTrend[]> {
  return adminRequest<DailyStudyTrend[]>('get', '/api/admin/dashboard/study-trend');
}

export async function getSubjectDistribution(): Promise<SubjectDistribution[]> {
  return adminRequest<SubjectDistribution[]>(
    'get',
    '/api/admin/dashboard/subject-distribution',
  );
}

export async function getRegisterTrend(): Promise<UserRegisterTrend[]> {
  return adminRequest<UserRegisterTrend[]>(
    'get',
    '/api/admin/dashboard/register-trend',
  );
}

export async function getRanking(): Promise<AdminRankItem[]> {
  return adminRequest<AdminRankItem[]>('get', '/api/admin/dashboard/ranking');
}

export async function getRecentActivities(): Promise<RecentActivity[]> {
  return adminRequest<RecentActivity[]>(
    'get',
    '/api/admin/dashboard/recent-activities',
  );
}

// ===== 单词管理 =====

interface GetWordsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
  level?: string;
}

interface PagedWords {
  items: AdminWordItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getWords(params: Record<string, unknown>): Promise<PagedWords> {
  return adminRequest<PagedWords>('get', '/api/admin/words', undefined, params);
}

export async function getWord(id: string): Promise<AdminWordItem> {
  return adminRequest<AdminWordItem>('get', `/api/admin/words/${id}`);
}

export async function createWord(data: Partial<AdminWordItem> & { word: string; meaning: string }): Promise<AdminWordItem> {
  return adminRequest<AdminWordItem>('post', '/api/admin/words', data);
}

export async function updateWord(id: string, data: Partial<AdminWordItem>): Promise<AdminWordItem> {
  return adminRequest<AdminWordItem>('patch', `/api/admin/words/${id}`, data);
}

export async function deleteWord(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/words/${id}`);
}

interface BatchCreateWordsDto {
  textbookId?: string;
  unitId?: string;
  words: Array<Partial<AdminWordItem> & { word: string; meaning: string }>;
}

export async function batchCreateWords(data: BatchCreateWordsDto): Promise<{ count: number }> {
  return adminRequest<{ count: number }>('post', '/api/admin/words/batch', data);
}

// ===== 句子管理 =====

interface GetSentencesParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
}

interface PagedSentences {
  items: AdminSentenceItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getSentences(params: Record<string, unknown>): Promise<PagedSentences> {
  return adminRequest<PagedSentences>('get', '/api/admin/sentences', undefined, params);
}

export async function getSentence(id: string): Promise<AdminSentenceItem> {
  return adminRequest<AdminSentenceItem>('get', `/api/admin/sentences/${id}`);
}

export async function createSentence(data: Partial<AdminSentenceItem> & { sentence: string; translation: string }): Promise<AdminSentenceItem> {
  return adminRequest<AdminSentenceItem>('post', '/api/admin/sentences', data);
}

export async function updateSentence(id: string, data: Partial<AdminSentenceItem>): Promise<AdminSentenceItem> {
  return adminRequest<AdminSentenceItem>('patch', `/api/admin/sentences/${id}`, data);
}

export async function deleteSentence(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/sentences/${id}`);
}

export async function batchCreateSentences(data: Record<string, unknown>): Promise<{
  success: number;
  failed: number;
  errors: Array<{ index: number; sentence?: string; error: string }>;
}> {
  return adminRequest('post', '/api/admin/sentences/batch', data);
}

// ===== 汉字管理 =====

interface GetChineseCharsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
}

interface PagedChineseChars {
  items: AdminChineseCharItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getChineseChars(params: GetChineseCharsParams): Promise<PagedChineseChars> {
  return adminRequest<PagedChineseChars>('get', '/api/admin/chinese-chars', undefined, params as unknown as Record<string, unknown>);
}

export async function getChineseChar(id: string): Promise<AdminChineseCharItem> {
  return adminRequest<AdminChineseCharItem>('get', `/api/admin/chinese-chars/${id}`);
}

export async function createChineseChar(data: Partial<AdminChineseCharItem> & { character: string; textbookId: string; unitId: string }): Promise<AdminChineseCharItem> {
  return adminRequest<AdminChineseCharItem>('post', '/api/admin/chinese-chars', data);
}

export async function updateChineseChar(id: string, data: Partial<AdminChineseCharItem>): Promise<AdminChineseCharItem> {
  return adminRequest<AdminChineseCharItem>('patch', `/api/admin/chinese-chars/${id}`, data);
}

export async function deleteChineseChar(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/chinese-chars/${id}`);
}

export async function batchCreateChineseChars(data: {
  textbookId?: string;
  unitId?: string;
  chars: Array<Partial<AdminChineseCharItem> & { character: string; textbookId: string; unitId: string }>;
}): Promise<{ count: number }> {
  return adminRequest<{ count: number }>('post', '/api/admin/chinese-chars/batch', data);
}

// ===== 数学知识点管理 =====

interface GetMathTopicsParams {
  page?: number;
  pageSize?: number;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
  domain?: string;
}

interface PagedMathTopics {
  items: AdminMathTopicItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getMathTopics(params: GetMathTopicsParams): Promise<PagedMathTopics> {
  return adminRequest<PagedMathTopics>('get', '/api/admin/math/topics', undefined, params as unknown as Record<string, unknown>);
}

export async function getMathTopic(id: string): Promise<AdminMathTopicItem> {
  return adminRequest<AdminMathTopicItem>('get', `/api/admin/math/topics/${id}`);
}

export async function createMathTopic(data: Partial<AdminMathTopicItem> & { title: string; textbookId: string; unitId: string; description: string; keyPoints: string }): Promise<AdminMathTopicItem> {
  return adminRequest<AdminMathTopicItem>('post', '/api/admin/math/topics', data);
}

export async function updateMathTopic(id: string, data: Partial<AdminMathTopicItem>): Promise<AdminMathTopicItem> {
  return adminRequest<AdminMathTopicItem>('patch', `/api/admin/math/topics/${id}`, data);
}

export async function deleteMathTopic(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/math/topics/${id}`);
}

export async function batchCreateMathTopics(data: {
  textbookId?: string;
  unitId?: string;
  topics: Array<Partial<AdminMathTopicItem> & { title: string; description: string; keyPoints: string }>;
}): Promise<{ count: number }> {
  return adminRequest<{ count: number }>('post', '/api/admin/math/topics/batch', data);
}

// ===== 数学习题管理 =====

interface GetMathPracticeItemsParams {
  page?: number;
  pageSize?: number;
  topicId?: string;
  textbookId?: string;
  unitId?: string;
  keyword?: string;
  difficulty?: number;
  itemType?: string;
}

interface PagedMathPracticeItems {
  items: AdminMathPracticeItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getMathPracticeItems(params: GetMathPracticeItemsParams): Promise<PagedMathPracticeItems> {
  return adminRequest<PagedMathPracticeItems>('get', '/api/admin/math/practice-items', undefined, params as unknown as Record<string, unknown>);
}

export async function getMathPracticeItem(id: string): Promise<AdminMathPracticeItem> {
  return adminRequest<AdminMathPracticeItem>('get', `/api/admin/math/practice-items/${id}`);
}

export async function createMathPracticeItem(data: Partial<AdminMathPracticeItem> & { question: string; correctAnswer: string; topicId: string; textbookId: string; unitId: string }): Promise<AdminMathPracticeItem> {
  return adminRequest<AdminMathPracticeItem>('post', '/api/admin/math/practice-items', data);
}

export async function updateMathPracticeItem(id: string, data: Partial<AdminMathPracticeItem>): Promise<AdminMathPracticeItem> {
  return adminRequest<AdminMathPracticeItem>('patch', `/api/admin/math/practice-items/${id}`, data);
}

export async function deleteMathPracticeItem(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/math/practice-items/${id}`);
}

export async function batchCreateMathPracticeItems(data: {
  topicId?: string;
  textbookId?: string;
  unitId?: string;
  items: Array<Partial<AdminMathPracticeItem> & { question: string; correctAnswer: string }>;
}): Promise<{ count: number }> {
  return adminRequest<{ count: number }>('post', '/api/admin/math/practice-items/batch', data);
}

// ===== 用户管理 =====

interface GetUsersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
}

interface PagedUsers {
  items: AdminUserItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getUsers(params: Record<string, unknown>): Promise<PagedUsers> {
  return adminRequest<PagedUsers>('get', '/api/admin/users', undefined, params);
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>('get', `/api/admin/users/${id}`);
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<void> {
  return adminRequest<void>('patch', `/api/admin/users/${id}/status`, { isActive });
}

// ===== 课程管理接口 =====

export async function getCourses(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  keyword?: string;
  subject?: string;
  status?: string;
  grade?: string;
}): Promise<PagedResponse<AdminCourseItem>> {
  return adminRequest<PagedResponse<AdminCourseItem>>(
    'get',
    '/api/admin/courses',
    undefined,
    params,
  );
}

export async function getCourse(id: string): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>('get', `/api/admin/courses/${id}`);
}

export async function createCourse(
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>('post', '/api/admin/courses', data);
}

export async function updateCourse(
  id: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>('patch', `/api/admin/courses/${id}`, data);
}

export async function deleteCourse(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/courses/${id}`);
}

export async function getCourseLessons(
  courseId: string,
): Promise<CourseLesson[]> {
  return adminRequest<CourseLesson[]>(
    'get',
    `/api/admin/courses/${courseId}/lessons`,
  );
}

export async function createLesson(
  courseId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>(
    'post',
    `/api/admin/courses/${courseId}/lessons`,
    data,
  );
}

export async function updateLesson(
  lessonId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>(
    'patch',
    `/api/admin/lessons/${lessonId}`,
    data,
  );
}

export async function deleteLesson(lessonId: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/lessons/${lessonId}`);
}

export async function getLessonSentences(
  lessonId: string,
): Promise<AdminSentenceItem[]> {
  return adminRequest<AdminSentenceItem[]>(
    'get',
    `/api/admin/courses/lessons/${lessonId}/sentences`,
  );
}

export async function createLessonSentence(
  lessonId: string,
  data: Record<string, unknown>,
): Promise<AdminSentenceItem> {
  return adminRequest<AdminSentenceItem>(
    'post',
    `/api/admin/courses/lessons/${lessonId}/sentences`,
    data,
  );
}

export async function updateLessonSentence(
  lessonId: string,
  sentenceId: string,
  data: Record<string, unknown>,
): Promise<AdminSentenceItem> {
  return adminRequest<AdminSentenceItem>(
    'patch',
    `/api/admin/courses/lessons/${lessonId}/sentences/${sentenceId}`,
    data,
  );
}

export async function deleteLessonSentence(
  lessonId: string,
  sentenceId: string,
): Promise<void> {
  return adminRequest<void>(
    'delete',
    `/api/admin/courses/lessons/${lessonId}/sentences/${sentenceId}`,
  );
}

export async function getLessonDictations(
  lessonId: string,
): Promise<DictationItem[]> {
  return adminRequest<DictationItem[]>(
    'get',
    `/api/admin/courses/lessons/${lessonId}/dictations`,
  );
}

export async function createLessonDictation(
  lessonId: string,
  data: Record<string, unknown>,
): Promise<DictationItem> {
  return adminRequest<DictationItem>(
    'post',
    `/api/admin/courses/lessons/${lessonId}/dictations`,
    data,
  );
}

export async function updateLessonDictation(
  lessonId: string,
  dictationId: string,
  data: Record<string, unknown>,
): Promise<DictationItem> {
  return adminRequest<DictationItem>(
    'patch',
    `/api/admin/courses/lessons/${lessonId}/dictations/${dictationId}`,
    data,
  );
}

export async function deleteLessonDictation(
  lessonId: string,
  dictationId: string,
): Promise<void> {
  return adminRequest<void>(
    'delete',
    `/api/admin/courses/lessons/${lessonId}/dictations/${dictationId}`,
  );
}

// ===== 课程单词管理 =====

export async function getCourseWords(
  courseId: string,
  keyword?: string,
): Promise<WordItem[]> {
  const params: Record<string, unknown> = {};
  if (keyword) params.keyword = keyword;
  return adminRequest<WordItem[]>(
    'get',
    `/api/admin/courses/${courseId}/words`,
    undefined,
    params,
  );
}

export async function createCourseWord(
  courseId: string,
  data: Record<string, unknown>,
): Promise<WordItem> {
  return adminRequest<WordItem>(
    'post',
    `/api/admin/courses/${courseId}/words`,
    data,
  );
}

export async function updateCourseWord(
  courseId: string,
  wordId: string,
  data: Record<string, unknown>,
): Promise<WordItem> {
  return adminRequest<WordItem>(
    'patch',
    `/api/admin/courses/${courseId}/words/${wordId}`,
    data,
  );
}

export async function deleteCourseWord(
  courseId: string,
  wordId: string,
): Promise<void> {
  return adminRequest<void>(
    'delete',
    `/api/admin/courses/${courseId}/words/${wordId}`,
  );
}

// ===== 教材管理接口 =====

export async function getTextbookTree(
  subject?: string,
): Promise<TextbookTreeItem[]> {
  const tree = await adminRequest<any[]>(
    'get',
    '/api/admin/textbooks/tree',
    undefined,
    subject ? { subject } : undefined,
  );
  const items: TextbookTreeItem[] = [];
  for (const subjectItem of tree) {
    const subjectCode = subjectItem.subject;
    for (const stage of subjectItem.stages ?? []) {
      for (const version of stage.versions ?? []) {
        for (const grade of version.grades ?? []) {
          for (const tb of grade.textbooks ?? []) {
            items.push({
              id: tb.id,
              subject: subjectCode,
              title: tb.title,
              publisher: version.publisher,
              grade: grade.grade,
              semester: tb.semester ?? 'upper',
              coverImage: tb.coverImage,
              description: tb.description,
              totalUnits: (tb.units ?? []).length,
              sortOrder: tb.sortOrder ?? 0,
              isPublished: tb.isPublished,
              units: tb.units ?? [],
            });
          }
        }
      }
    }
  }
  return items;
}

export async function getTextbooks(
  params: Record<string, unknown>,
): Promise<PagedResponse<Textbook>> {
  return adminRequest<PagedResponse<Textbook>>(
    'get',
    '/api/admin/textbooks',
    undefined,
    params,
  );
}

export async function getTextbook(id: string): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>('get', `/api/admin/textbooks/${id}`);
}

export async function createTextbook(
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>('post', '/api/admin/textbooks', data);
}

export async function updateTextbook(
  id: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>('patch', `/api/admin/textbooks/${id}`, data);
}

export async function deleteTextbook(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/textbooks/${id}`);
}

export async function getUnits(textbookId: string): Promise<TextbookUnit[]> {
  return adminRequest<TextbookUnit[]>(
    'get',
    `/api/admin/textbooks/${textbookId}/units`,
  );
}

export async function createUnit(
  textbookId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>(
    'post',
    `/api/admin/textbooks/${textbookId}/units`,
    data,
  );
}

export async function updateUnit(
  unitId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return adminRequest<Record<string, unknown>>(
    'patch',
    `/api/admin/units/${unitId}`,
    data,
  );
}

export async function deleteUnit(unitId: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/units/${unitId}`);
}

export async function submitCourseReview(id: string): Promise<AdminCourseItem> {
  return adminRequest<AdminCourseItem>('patch', `/api/admin/courses/${id}/submit-review`);
}

export async function approveCourseReview(id: string, comment?: string): Promise<AdminCourseItem> {
  return adminRequest<AdminCourseItem>('patch', `/api/admin/courses/${id}/approve-review`, { comment });
}

export async function rejectCourseReview(id: string, comment: string): Promise<AdminCourseItem> {
  return adminRequest<AdminCourseItem>('patch', `/api/admin/courses/${id}/reject-review`, { comment });
}

export async function publishCourse(id: string): Promise<AdminCourseItem> {
  return adminRequest<AdminCourseItem>('patch', `/api/admin/courses/${id}/publish`);
}

export async function offlineCourse(id: string): Promise<AdminCourseItem> {
  return adminRequest<AdminCourseItem>('patch', `/api/admin/courses/${id}/offline`);
}

export async function acquireCourseLock(id: string): Promise<{ acquired: boolean; lockOwner?: string }> {
  return adminRequest<{ acquired: boolean; lockOwner?: string }>('post', `/api/admin/courses/${id}/lock`);
}

export async function releaseCourseLock(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/courses/${id}/lock`);
}

interface GetAuditLogsParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
}

export async function getAuditLogs(params: GetAuditLogsParams): Promise<PagedResponse<AuditLogItem>> {
  return adminRequest<PagedResponse<AuditLogItem>>('get', '/api/admin/audit', undefined, params as Record<string, unknown>);
}

interface GetAdminAccountsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  subject?: string;
}

export async function getAdminAccounts(params: GetAdminAccountsParams): Promise<PagedResponse<AdminUserManageItem>> {
  return adminRequest<PagedResponse<AdminUserManageItem>>('get', '/api/admin/accounts', undefined, params as Record<string, unknown>);
}

export async function createAdminAccount(data: {
  username: string;
  password: string;
  name: string;
  role: string;
  subject?: string;
}): Promise<AdminUserManageItem> {
  return adminRequest<AdminUserManageItem>('post', '/api/admin/accounts', data);
}

export async function updateAdminAccount(id: string, data: Record<string, unknown>): Promise<AdminUserManageItem> {
  return adminRequest<AdminUserManageItem>('patch', `/api/admin/accounts/${id}`, data);
}

export async function deleteAdminAccount(id: string): Promise<void> {
  return adminRequest<void>('delete', `/api/admin/accounts/${id}`);
}

// ===== UGC 内容审核 =====

interface GetUgcPendingParams {
  type?: UgcContentType | 'all';
  status?: UgcAuditStatus;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export async function getUgcAuditList(
  params: GetUgcPendingParams,
): Promise<UgcAuditListResponse> {
  return adminRequest<UgcAuditListResponse>(
    'get',
    '/api/admin/ugc/pending',
    undefined,
    params as Record<string, unknown>,
  );
}

export async function getUgcAuditDetail(
  type: UgcContentType,
  id: string,
): Promise<UgcAuditDetail> {
  return adminRequest<UgcAuditDetail>(
    'get',
    `/api/admin/ugc/${type}/${id}`,
  );
}

export async function approveUgc(
  type: UgcContentType,
  id: string,
): Promise<UgcAuditItem> {
  return adminRequest<UgcAuditItem>(
    'post',
    `/api/admin/ugc/${type}/${id}/approve`,
  );
}

export async function rejectUgc(
  type: UgcContentType,
  id: string,
  reason: string,
): Promise<UgcAuditItem> {
  return adminRequest<UgcAuditItem>(
    'post',
    `/api/admin/ugc/${type}/${id}/reject`,
    { reason },
  );
}

export async function offlineUgc(
  type: UgcContentType,
  id: string,
): Promise<UgcAuditItem> {
  return adminRequest<UgcAuditItem>(
    'post',
    `/api/admin/ugc/${type}/${id}/offline`,
  );
}
