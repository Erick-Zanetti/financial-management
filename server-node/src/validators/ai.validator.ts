import { z } from 'zod';

export const aiProcessedResultSchema = z.object({
  total: z.coerce.number().positive(),
  subcategories: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.coerce.number().positive(),
      }),
    )
    .min(1),
  report: z.string().optional().default(''),
});

export type AiProcessedResultDto = z.infer<typeof aiProcessedResultSchema>;
