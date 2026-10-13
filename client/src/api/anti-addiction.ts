import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  AntiAddictionStatus,
  ParentControls,
  UsageReport,
} from '@shared/api.interface';

export async function getStatus(): Promise<AntiAddictionStatus> {
  const res = await axiosForBackend.get('/api/anti-addiction/status');
  return res.data;
}

export async function startSession(moduleName?: string): Promise<{
  sessionId: string;
  startTime: string;
}> {
  const res = await axiosForBackend.post('/api/anti-addiction/session/start', {
    module: moduleName,
  });
  return res.data;
}

export async function endSession(sessionId: string): Promise<{ duration: number }> {
  const res = await axiosForBackend.post('/api/anti-addiction/session/end', {
    sessionId,
  });
  return res.data;
}

export async function heartbeat(sessionId: string): Promise<{
  ok: boolean;
  remainingMinutes: number;
}> {
  const res = await axiosForBackend.post('/api/anti-addiction/session/heartbeat', {
    sessionId,
  });
  return res.data;
}

export async function getParentControls(): Promise<ParentControls> {
  const res = await axiosForBackend.get('/api/anti-addiction/parent-controls');
  return res.data;
}

export async function upsertParentControls(data: Record<string, unknown>): Promise<ParentControls> {
  const res = await axiosForBackend.post('/api/anti-addiction/parent-controls', data);
  return res.data;
}

export async function verifyParentPassword(password: string): Promise<{ valid: boolean }> {
  const res = await axiosForBackend.post('/api/anti-addiction/parent-controls/verify', {
    password,
  });
  return res.data;
}

export async function extendUsage(
  password: string,
  extendMinutes: number,
): Promise<{ ok: boolean; extendedMinutes: number }> {
  const res = await axiosForBackend.post('/api/anti-addiction/parent-controls/extend', {
    password,
    extendMinutes,
  });
  return res.data;
}

export async function getReport(type: 'weekly' | 'monthly'): Promise<UsageReport> {
  const res = await axiosForBackend.get(`/api/anti-addiction/reports/${type}`);
  return res.data;
}

export async function getLogs(
  startDate: string,
  endDate: string,
): Promise<{ items: Array<{ date: string; durationMinutes: number; module?: string }> }> {
  const res = await axiosForBackend.get('/api/anti-addiction/logs', {
    params: { startDate, endDate },
  });
  return res.data;
}
