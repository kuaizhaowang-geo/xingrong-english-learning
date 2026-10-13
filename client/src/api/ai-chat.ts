import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  AiChatSession,
  AiChatSessionWithMessages,
  SendMessageResponse,
  CreateAiChatSessionDto,
  SendMessageDto,
} from '@shared/api.interface';

export async function getSessions(): Promise<AiChatSession[]> {
  const res = await axiosForBackend.get('/api/ai-chat/sessions');
  return res.data;
}

export async function createSession(
  data: CreateAiChatSessionDto,
): Promise<AiChatSession> {
  const res = await axiosForBackend.post('/api/ai-chat/sessions', data);
  return res.data;
}

export async function getSessionDetail(
  id: string,
): Promise<AiChatSessionWithMessages> {
  const res = await axiosForBackend.get(`/api/ai-chat/sessions/${id}`);
  return res.data;
}

export async function deleteSession(id: string): Promise<void> {
  await axiosForBackend.delete(`/api/ai-chat/sessions/${id}`);
}

export async function sendMessage(
  id: string,
  data: SendMessageDto,
): Promise<SendMessageResponse> {
  const res = await axiosForBackend.post(
    `/api/ai-chat/sessions/${id}/messages`,
    data,
  );
  return res.data;
}
