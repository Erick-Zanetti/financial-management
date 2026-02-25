'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { releasesApi } from '@/lib/api/releases';
import {
  CreateFinancialRelease,
  UpdateFinancialRelease
} from '@/types/financial-release';

export function useExpenses(month: number, year: number) {
  return useQuery({
    queryKey: ['expenses', month, year],
    queryFn: () => releasesApi.getExpenses(month, year),
  });
}

export function useReceipts(month: number, year: number) {
  return useQuery({
    queryKey: ['receipts', month, year],
    queryFn: () => releasesApi.getReceipts(month, year),
  });
}

export function useCreateRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFinancialRelease) => releasesApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenses', variables.month, variables.year]
      });
      queryClient.invalidateQueries({
        queryKey: ['receipts', variables.month, variables.year]
      });
    },
  });
}

export function useUpdateRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinancialRelease }) =>
      releasesApi.update(id, data),
    onSuccess: (_, variables) => {
      if (variables.data.month && variables.data.year) {
        queryClient.invalidateQueries({
          queryKey: ['expenses', variables.data.month, variables.data.year]
        });
        queryClient.invalidateQueries({
          queryKey: ['receipts', variables.data.month, variables.data.year]
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['receipts'] });
      }
    },
  });
}

export function useToggleSettled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, settled }: { id: string; settled: boolean; month: number; year: number }) =>
      releasesApi.update(id, { settled }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenses', variables.month, variables.year]
      });
      queryClient.invalidateQueries({
        queryKey: ['receipts', variables.month, variables.year]
      });
    },
  });
}

export function useDeleteRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; month: number; year: number }) =>
      releasesApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenses', variables.month, variables.year]
      });
      queryClient.invalidateQueries({
        queryKey: ['receipts', variables.month, variables.year]
      });
    },
  });
}
