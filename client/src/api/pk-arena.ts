import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PKRoomListResponse,
  PKRoomDetail,
  PKCreateRoomDto,
  PKAnswerDto,
  PKAnswerResponse,
  PKResultResponse,
  PKStats,
  PKMatchHistoryResponse,
  PKQuestion,
  PKCourseType,
} from '@shared/api.interface';

export async function listRooms(params?: {
  status?: string;
  pageSize?: number;
}): Promise<PKRoomListResponse> {
  const res = await axiosForBackend.get('/api/pk-arena/rooms', { params });
  return res.data;
}

export async function createRoom(dto: PKCreateRoomDto): Promise<PKRoomDetail> {
  const res = await axiosForBackend.post('/api/pk-arena/rooms', dto);
  return res.data;
}

export async function getRoom(roomId: string): Promise<PKRoomDetail> {
  const res = await axiosForBackend.get(`/api/pk-arena/rooms/${roomId}`);
  return res.data;
}

export async function joinRoom(roomId: string): Promise<PKRoomDetail> {
  const res = await axiosForBackend.post(`/api/pk-arena/rooms/${roomId}/join`);
  return res.data;
}

export async function startRoom(roomId: string): Promise<{
  room: PKRoomDetail;
  questions: PKQuestion[];
}> {
  const res = await axiosForBackend.post(`/api/pk-arena/rooms/${roomId}/start`);
  return res.data;
}

export async function leaveRoom(roomId: string): Promise<{ success: boolean }> {
  const res = await axiosForBackend.post(`/api/pk-arena/rooms/${roomId}/leave`);
  return res.data;
}

export async function quickMatch(courseType?: PKCourseType): Promise<PKRoomDetail> {
  const res = await axiosForBackend.post('/api/pk-arena/quick-match', { courseType });
  return res.data;
}

export async function submitAnswer(
  roomId: string,
  dto: PKAnswerDto,
): Promise<PKAnswerResponse> {
  const res = await axiosForBackend.post(`/api/pk-arena/rooms/${roomId}/answer`, dto);
  return res.data;
}

export async function getResult(roomId: string): Promise<PKResultResponse> {
  const res = await axiosForBackend.get(`/api/pk-arena/rooms/${roomId}/result`);
  return res.data;
}

export async function getStats(): Promise<PKStats> {
  const res = await axiosForBackend.get('/api/pk-arena/stats');
  return res.data;
}

export async function getHistory(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PKMatchHistoryResponse> {
  const res = await axiosForBackend.get('/api/pk-arena/history', { params });
  return res.data;
}
