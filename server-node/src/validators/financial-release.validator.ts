import { z } from 'zod';
import { FinancialReleaseType } from '../types/financial-release.types';

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required').max(100),
  value: z.number().positive('Subcategory value must be positive'),
});

const baseFinancialReleaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  value: z.number().positive('Value must be positive'),
  type: z.nativeEnum(FinancialReleaseType, {
    errorMap: () => ({ message: 'Type must be R (Receipt) or E (Expense)' }),
  }),
  category: z.string().min(1, 'Category is required'),
  person: z.string().optional(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  settled: z.boolean().optional().default(false),
  subcategories: z.array(subcategorySchema).optional(),
});

export const createFinancialReleaseSchema = baseFinancialReleaseSchema.refine(
  (data) => {
    if (!data.subcategories || data.subcategories.length === 0) return true;
    const sum = data.subcategories.reduce((acc, s) => acc + s.value, 0);
    return Math.abs(sum - data.value) < 0.01;
  },
  {
    message: 'Subcategory values must sum to the release total',
    path: ['subcategories'],
  },
);

export const updateFinancialReleaseSchema =
  baseFinancialReleaseSchema.partial();

export const filterByTypeSchema = z.object({
  type: z.nativeEnum(FinancialReleaseType),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const dashboardFilterSchema = z.object({
  fromMonth: z.coerce.number().int().min(1).max(12),
  fromYear: z.coerce.number().int().min(2000).max(2100),
  toMonth: z.coerce.number().int().min(1).max(12),
  toYear: z.coerce.number().int().min(2000).max(2100),
});

export type DashboardFilterDto = z.infer<typeof dashboardFilterSchema>;

export type CreateFinancialReleaseDto = z.infer<
  typeof createFinancialReleaseSchema
>;
export type UpdateFinancialReleaseDto = z.infer<
  typeof updateFinancialReleaseSchema
>;
export type FilterByTypeDto = z.infer<typeof filterByTypeSchema>;
