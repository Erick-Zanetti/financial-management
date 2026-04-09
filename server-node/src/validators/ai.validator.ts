import { z } from 'zod';

export const aiProcessedResultSchema = z.object({
  total: z.coerce.number().nonnegative(),
  subcategories: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
});

export type AiProcessedResultDto = z.infer<typeof aiProcessedResultSchema>;
