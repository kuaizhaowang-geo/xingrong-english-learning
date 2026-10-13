import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  ParentChildBinding,
  AddChildDto,
  ChildOverview,
  ChildMistakesResponse,
  LearningActivityItem,
  AssignedTask,
  CreateAssignedTaskDto,
  ProgressCurveData,
} from '@shared/api.interface';

const BASE = '/api/parent';

export async function getChildren(): Promise<ParentChildBinding[]> {
  try {
    const res = await axiosForBackend.get(`${BASE}/children`);
    return res.data;
  } catch (error) {
    logger.error('获取孩子列表失败', error as Error);
    return [];
  }
}

export async function addChild(dto: AddChildDto): Promise<ParentChildBinding> {
  const res = await axiosForBackend.post(`${BASE}/children`, dto);
  return res.data;
}

export async function removeChild(id: string): Promise<{ success: boolean }> {
  const res = await axiosForBackend.delete(`${BASE}/children/${id}`);
  return res.data;
}

export async function getChildOverview(childId: string): Promise<ChildOverview> {
  const res = await axiosForBackend.get(`${BASE}/children/${childId}/overview`);
  return res.data;
}

export async function getChildMistakes(
  childId: string,
  params: { subject?: string; page?: number; pageSize?: number } = {},
): Promise<ChildMistakesResponse> {
  const res = await axiosForBackend.get(`${BASE}/children/${childId}/mistakes`, { params });
  return res.data;
}

export async function getChildActivity(
  childId: string,
  days = 7,
): Promise<LearningActivityItem[]> {
  const res = await axiosForBackend.get(`${BASE}/children/${childId}/activity`, {
    params: { days },
  });
  return res.data;
}

export async function getChildTasks(childId: string): Promise<AssignedTask[]> {
  const res = await axiosForBackend.get(`${BASE}/children/${childId}/tasks`);
  return res.data;
}

export async function assignTask(
  childId: string,
  dto: CreateAssignedTaskDto,
): Promise<AssignedTask> {
  const res = await axiosForBackend.post(`${BASE}/children/${childId}/tasks`, dto);
  return res.data;
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
): Promise<AssignedTask> {
  const res = await axiosForBackend.patch(`${BASE}/tasks/${taskId}`, { status });
  return res.data;
}

export async function getProgressCurve(
  childId: string,
  period = '7d',
): Promise<ProgressCurveData> {
  const res = await axiosForBackend.get(`${BASE}/children/${childId}/progress`, {
    params: { period },
  });
  return res.data;
}
