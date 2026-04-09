import { z } from 'zod';

export const llmClassificationSchema = z.object({
  classifications: z.array(
    z.object({
      row_id: z.number().int().positive(),
      category: z.string().min(1),
    }),
  ),
});

export type LlmClassificationDto = z.infer<typeof llmClassificationSchema>;
