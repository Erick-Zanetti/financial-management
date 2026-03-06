import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
