import { axiosForBackend, logger } from '@client/src/api';
import type {
  StudyPlanItem,
  PlanRecordItem,
  PlanOverview,
  PlanStatsResponse,
  AiPlanRecommendation,
  CreatePlanDto,
  UpdateTaskProgressDto,
} from '@shared/api.interface';

export async function getOverview(): Promise<PlanOverview> {
  const res = await axiosForBackend.get('/api/study-plan/overview');
  return res.data;
}

export async function getPlans(): Promise<StudyPlanItem[]> {
  const res = await axiosForBackend.get('/api/study-plan/plans');
  return res.data.items ?? res.data ?? [];
}

export async function createPlan(dto: CreatePlanDto): Promise<StudyPlanItem> {
  const res = await axiosForBackend.post('/api/study-plan/plans', dto);
  return res.data;
}

export async function updatePlan(
  id: string,
  dto: Partial<CreatePlanDto>,
): Promise<StudyPlanItem> {
  const res = await axiosForBackend.patch(`/api/study-plan/plans/${id}`, dto);
  return res.data;
}

export async function deletePlan(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/study-plan/plans/${id}`);
}

export async function activatePlan(id: string): Promise<StudyPlanItem> {
  const res = await axiosForBackend.post(`/api/study-plan/plans/${id}/activate`);
  return res.data;
}

export async function getTodayRecord(): Promise<PlanRecordItem> {
  const res = await axiosForBackend.get('/api/study-plan/records/today');
  return res.data;
}

export async function getRecords(
  startDate: string,
  endDate: string,
): Promise<PlanRecordItem[]> {
  const res = await axiosForBackend.get('/api/study-plan/records', {
    params: { startDate, endDate },
  });
  return res.data;
}

export async function updateTaskProgress(
  dto: UpdateTaskProgressDto,
): Promise<PlanRecordItem> {
  const res = await axiosForBackend.post('/api/study-plan/task-progress', dto);
  return res.data;
}

export async function getStats(): Promise<PlanStatsResponse> {
  const res = await axiosForBackend.get('/api/study-plan/stats');
  return res.data;
}

export async function getAiRecommendation(): Promise<AiPlanRecommendation> {
  const res = await axiosForBackend.get('/api/study-plan/ai-recommendation');
  return res.data;
}

export async function acceptAiRecommendation(dto: CreatePlanDto): Promise<StudyPlanItem> {
  const res = await axiosForBackend.post('/api/study-plan/plans', dto);
  return res.data;
}

export { logger };
