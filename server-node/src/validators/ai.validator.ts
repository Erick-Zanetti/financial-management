import { z } from 'zod';

export const aiProcessedResultSchema = z.object({
  total: z.number().positive(),
  subcategories: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.number().positive(),
      }),
    )
    .min(1),
});

export type AiProcessedResultDto = z.infer<typeof aiProcessedResultSchema>;
