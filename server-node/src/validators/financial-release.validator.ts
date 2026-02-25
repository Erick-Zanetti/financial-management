import { z } from 'zod';
import { FinancialReleaseType, Person } from '../types/financial-release.types';

export const createFinancialReleaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  value: z.number().positive('Value must be positive'),
  type: z.nativeEnum(FinancialReleaseType, {
    errorMap: () => ({ message: 'Type must be R (Receipt) or E (Expense)' }),
  }),
  person: z.nativeEnum(Person, {
    errorMap: () => ({ message: 'Person must be ERICK or JULIA' }),
  }),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  settled: z.boolean().optional().default(false),
});

export const updateFinancialReleaseSchema =
  createFinancialReleaseSchema.partial();

export const filterByTypeSchema = z.object({
  type: z.nativeEnum(FinancialReleaseType),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type CreateFinancialReleaseDto = z.infer<
  typeof createFinancialReleaseSchema
>;
export type UpdateFinancialReleaseDto = z.infer<
  typeof updateFinancialReleaseSchema
>;
export type FilterByTypeDto = z.infer<typeof filterByTypeSchema>;
