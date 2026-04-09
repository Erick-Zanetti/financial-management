import { z } from 'zod';
import { CategoryType } from '../types/category.types';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.nativeEnum(CategoryType),
  allowSubcategories: z.boolean().optional().default(false),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
