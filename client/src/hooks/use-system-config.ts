'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigApi } from '@/lib/api/system-config';
import { UpdateSystemConfig } from '@/types/system-config';

export function useSystemConfig() {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: () => systemConfigApi.get(),
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSystemConfig) => systemConfigApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
  });
}
