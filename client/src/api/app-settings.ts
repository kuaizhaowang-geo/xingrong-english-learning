import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { AppSetting } from '@shared/api.interface';

export async function getSetting(key: string): Promise<AppSetting | null> {
  try {
    const res = await axiosForBackend.get(`/api/app-settings/${key}`);
    return res.data;
  } catch (e) {
    return null;
  }
}

export async function saveSetting(
  key: string,
  value: string,
  description?: string,
): Promise<AppSetting> {
  const res = await axiosForBackend.put('/api/app-settings', {
    key,
    value,
    description,
  });
  return res.data;
}
