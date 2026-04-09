import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../services/ai/types';

export const llmClassificationSchema = z.object({
  classifications: z.array(
    z.object({
      row_id: z.number().int().positive(),
      category: z.enum(EXPENSE_CATEGORIES),
    }),
  ),
});

export type LlmClassificationDto = z.infer<typeof llmClassificationSchema>;
