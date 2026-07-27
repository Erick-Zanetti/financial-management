import { z } from 'zod';
import { CategoryType } from '../types/category.types';

const baseCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.nativeEnum(CategoryType),
  allowSubcategories: z.boolean().optional().default(false),
  allowAiIntegration: z.boolean().optional().default(false),
  description: z.string().max(200).trim().optional().default(''),
  aiClassificationEnabled: z.boolean().optional().default(false),
  aiKeywords: z.array(z.string().min(1).max(100)).max(100).optional().default([]),
  aiPrompt: z.string().max(2000).optional().default(''),
  dashboardSplitBySubcategories: z.boolean().optional().default(false),
  dashboardFallbackCategory: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
    .nullable()
    .optional()
    .default(null),
});

export const createCategorySchema = baseCategorySchema.superRefine(
  (data, ctx) => {
    if (data.dashboardSplitBySubcategories) {
      if (!data.allowSubcategories) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dashboardSplitBySubcategories'],
          message:
            'dashboardSplitBySubcategories requires allowSubcategories',
        });
      }
      if (!data.dashboardFallbackCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dashboardFallbackCategory'],
          message:
            'dashboardFallbackCategory is required when dashboardSplitBySubcategories is enabled',
        });
      }
    }
  },
);

export const updateCategorySchema = baseCategorySchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.dashboardSplitBySubcategories === true) {
      if (!data.dashboardFallbackCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dashboardFallbackCategory'],
          message:
            'dashboardFallbackCategory is required when dashboardSplitBySubcategories is enabled',
        });
      }
      if (data.allowSubcategories === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dashboardSplitBySubcategories'],
          message:
            'dashboardSplitBySubcategories requires allowSubcategories',
        });
      }
    }
  });

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
