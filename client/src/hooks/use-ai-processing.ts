import { useMutation } from '@tanstack/react-query';
import { aiApi, AiProcessedResult } from '@/lib/api/ai';

export function useProcessPdf() {
  return useMutation<AiProcessedResult, Error, File>({
    mutationFn: (file: File) => aiApi.processPdf(file),
  });
}
