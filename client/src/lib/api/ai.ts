import { API_BASE_URL } from './client';

export interface AiProcessedResult {
  total: number;
  subcategories: Array<{ name: string; value: number }>;
  report: string;
}

export const aiApi = {
  processPdf: async (file: File): Promise<AiProcessedResult> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE_URL}/ai/process-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `AI processing failed: ${response.status}`);
    }

    return response.json();
  },
};
