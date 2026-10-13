import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  UserApiConfig,
  ApiConfigCategory,
  ApiProviderOption,
} from '@shared/api.interface';

export interface ApiConfigMasked {
  ttsProvider: string;
  ttsHasKey: boolean;
  ttsHasSecret: boolean;
  asrProvider: string;
  asrHasKey: boolean;
  asrHasSecret: boolean;
  aiProvider: string;
  aiHasKey: boolean;
  imageProvider: string;
  imageHasKey: boolean;
}

export interface ApiConfigSaveData extends Partial<UserApiConfig> {}

export interface TestResult {
  success: boolean;
  message: string;
}

export async function getConfig(): Promise<ApiConfigMasked> {
  const res = await axiosForBackend.get('/api/api-config');
  return res.data;
}

export async function saveConfig(
  data: ApiConfigSaveData,
): Promise<ApiConfigMasked> {
  const res = await axiosForBackend.put('/api/api-config', data);
  return res.data;
}

export async function testConfig(
  category: ApiConfigCategory,
): Promise<TestResult> {
  const res = await axiosForBackend.post(`/api/api-config/test/${category}`);
  return res.data;
}

export async function getProviderOptions(
  category: ApiConfigCategory,
): Promise<ApiProviderOption[]> {
  const res = await axiosForBackend.get(
    `/api/api-config/providers/${category}`,
  );
  return res.data;
}
