import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  LearningPlan,
  CreateLearningPlanDto,
  UpdateLearningProgressDto,
} from '@shared/api.interface';

export async function getLearningPlans(planType: 'sentence' | 'word'): Promise<LearningPlan[]> {
  const res = await axiosForBackend.get('/api/learning-plans', { params: { planType } });
  return res.data;
}

export async function addLearningPlan(data: CreateLearningPlanDto): Promise<LearningPlan> {
  const res = await axiosForBackend.post('/api/learning-plans', data);
  return res.data;
}

export async function removeLearningPlan(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/learning-plans/${id}`);
}

export async function updateLearningProgress(
  id: string,
  data: UpdateLearningProgressDto,
): Promise<LearningPlan> {
  const res = await axiosForBackend.patch(`/api/learning-plans/${id}/progress`, data);
  return res.data;
}
