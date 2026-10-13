import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  AiIllustration,
  AiIllustrationTask,
  IllustrationStats,
  IllustrationListResponse,
  IllustrationTaskListResponse,
  BatchGenerateRequest,
  BatchGeneratePreview,
} from '@shared/api.interface';

// 获取AI设置（只返回是否已配置，不返回key明文）
export async function getAiSettings(): Promise<{
  provider: string;
  hasKey: boolean;
  model?: string;
  defaultStyle?: string;
}> {
  const res = await axiosForBackend.get('/api/ai-illustration/settings');
  return res.data;
}

// 测试API连接
export async function testConnection(
  apiKey: string,
  provider = 'dashscope',
): Promise<{ success: boolean; message: string }> {
  const res = await axiosForBackend.post('/api/ai-illustration/test-connection', {
    apiKey,
    provider,
  });
  return res.data;
}

// 获取统计
export async function getStats(): Promise<IllustrationStats> {
  const res = await axiosForBackend.get('/api/ai-illustration/stats');
  return res.data;
}

// 获取插图列表
export async function getIllustrations(params: {
  page?: number;
  pageSize?: number;
  contentType?: string;
  status?: string;
  contentId?: string;
}): Promise<IllustrationListResponse> {
  const res = await axiosForBackend.get('/api/ai-illustration/illustrations', {
    params,
  });
  return res.data;
}

// 获取任务列表
export async function getTasks(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<IllustrationTaskListResponse> {
  const res = await axiosForBackend.get('/api/ai-illustration/tasks', { params });
  return res.data;
}

// 获取任务详情
export async function getTask(taskId: string): Promise<AiIllustrationTask> {
  const res = await axiosForBackend.get(`/api/ai-illustration/tasks/${taskId}`);
  return res.data;
}

// 批量生成预览
export async function getBatchPreview(
  dto: BatchGenerateRequest,
): Promise<BatchGeneratePreview> {
  const res = await axiosForBackend.post('/api/ai-illustration/batch-preview', dto);
  return res.data;
}

// 启动批量生成
export async function startBatchGenerate(
  dto: BatchGenerateRequest,
): Promise<{ taskId: string }> {
  const res = await axiosForBackend.post('/api/ai-illustration/batch-generate', dto);
  return res.data;
}

// 单张生成
export async function generateSingle(params: {
  contentType: 'word' | 'sentence';
  contentId: string;
  contentText: string;
  translation?: string;
  stylePreset?: string;
  customPrompt?: string;
}): Promise<AiIllustration> {
  const res = await axiosForBackend.post(
    '/api/ai-illustration/generate-single',
    params,
  );
  return res.data;
}

// 重新生成
export async function regenerateIllustration(
  id: string,
  customPrompt?: string,
): Promise<AiIllustration> {
  const res = await axiosForBackend.post(
    `/api/ai-illustration/illustrations/${id}/regenerate`,
    { customPrompt },
  );
  return res.data;
}

// 获取内容的已通过插图
export async function getContentIllustration(
  contentType: string,
  contentId: string,
): Promise<AiIllustration | null> {
  try {
    const res = await axiosForBackend.get(
      `/api/ai-illustration/content/${contentType}/${contentId}`,
    );
    return res.data;
  } catch (e) {
    return null;
  }
}
