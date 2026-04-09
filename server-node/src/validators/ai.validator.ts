import { z } from 'zod';

export const aiRawResponseSchema = z.object({
  categorized_expense_total: z.coerce.number(),
  excluded_total: z.coerce.number(),
  excluded_breakdown: z.object({
    matched_reversals_total: z.coerce.number(),
    unmatched_credits_total: z.coerce.number(),
    payments_total: z.coerce.number(),
    fees_and_taxes_total: z.coerce.number(),
  }),
  subcategories: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
  report: z.string().optional().default(''),
});

export type AiRawResponseDto = z.infer<typeof aiRawResponseSchema>;

export interface AiProcessedResultDto {
  total: number;
  subcategories: Array<{ name: string; value: number }>;
  report: string;
}
