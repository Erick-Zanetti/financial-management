import { z } from 'zod';
import { CategoryType } from '../types/category.types';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.nativeEnum(CategoryType),
  allowSubcategories: z.boolean().optional().default(false),
  allowAiIntegration: z.boolean().optional().default(false),
  description: z.string().max(200).trim().optional().default(''),
  aiClassificationEnabled: z.boolean().optional().default(false),
  aiKeywords: z.array(z.string().min(1).max(100)).max(100).optional().default([]),
  aiPrompt: z.string().max(2000).optional().default(''),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
