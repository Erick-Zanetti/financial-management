import { createApiClient, API_BASE_URL } from './client';
import { SystemConfig, UpdateSystemConfig } from '@/types/system-config';

const api = createApiClient(`${API_BASE_URL}/system-config`);

export const systemConfigApi = {
  get: () => api.get<SystemConfig>(''),

  update: (data: UpdateSystemConfig) => api.patch<SystemConfig>('', data),
};
