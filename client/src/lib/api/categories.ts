import { createApiClient, API_BASE_URL } from './client';
import { Category, CreateCategory, UpdateCategory } from '@/types/category';

const api = createApiClient(`${API_BASE_URL}/category`);

export const categoriesApi = {
  getAll: () => api.get<Category[]>(''),

  getById: (id: string) => api.get<Category>(`/${id}`),

  create: (data: CreateCategory) => api.post<Category>('', data),

  update: (id: string, data: UpdateCategory) => api.patch<Category>(`/${id}`, data),

  delete: (id: string) => api.delete<void>(`/${id}`),
};
