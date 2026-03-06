import { apiClient } from './client';
import {
  FinancialRelease,
  FinancialReleaseType,
  CreateFinancialRelease,
  UpdateFinancialRelease,
  DashboardSummaryItem
} from '@/types/financial-release';

export const releasesApi = {
  getAvailableMonths: () =>
    apiClient.get<{ year: number; month: number }[]>('/available-months'),

  getAll: () =>
    apiClient.get<FinancialRelease[]>(''),

  getById: (id: string) =>
    apiClient.get<FinancialRelease>(`/${id}`),

  getByType: (type: FinancialReleaseType, month: number, year: number) =>
    apiClient.get<FinancialRelease[]>('/by-type', { type, month, year }),

  getExpenses: (month: number, year: number) =>
    apiClient.get<FinancialRelease[]>('/by-type', {
      type: FinancialReleaseType.Expense,
      month,
      year
    }),

  getReceipts: (month: number, year: number) =>
    apiClient.get<FinancialRelease[]>('/by-type', {
      type: FinancialReleaseType.Receipt,
      month,
      year
    }),

  create: (data: CreateFinancialRelease) =>
    apiClient.post<FinancialRelease>('', data),

  update: (id: string, data: UpdateFinancialRelease) =>
    apiClient.patch<FinancialRelease>(`/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/${id}`),

  getDashboardSummary: (fromMonth: number, fromYear: number, toMonth: number, toYear: number) =>
    apiClient.get<DashboardSummaryItem[]>('/dashboard-summary', { fromMonth, fromYear, toMonth, toYear }),
};
