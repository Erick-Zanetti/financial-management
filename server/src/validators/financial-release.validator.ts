import { z } from 'zod';
import { FinancialReleaseType, Person } from '../types/financial-release.types.js';

export const financialReleaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  value: z.number({ required_error: 'Value is required' }),
  type: z.enum([FinancialReleaseType.R, FinancialReleaseType.E], {
    required_error: 'Type is required',
    invalid_type_error: 'Type must be R or E',
  }),
  person: z.enum([Person.ERICK, Person.JULIA], {
    required_error: 'Person is required',
    invalid_type_error: 'Person must be ERICK or JULIA',
  }),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});

export const financialReleaseUpdateSchema = financialReleaseSchema.partial();

export const queryByTypeSchema = z.object({
  type: z.enum([FinancialReleaseType.R, FinancialReleaseType.E]),
  month: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(12)),
  year: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(2000).max(2100)),
});

export type FinancialReleaseInput = z.infer<typeof financialReleaseSchema>;
export type FinancialReleaseUpdateInput = z.infer<typeof financialReleaseUpdateSchema>;
export type QueryByType = z.infer<typeof queryByTypeSchema>;
