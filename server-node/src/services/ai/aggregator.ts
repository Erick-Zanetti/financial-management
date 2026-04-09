import { AppError } from '../../middlewares/error-handler.middleware';
import {
  PreprocessedData,
  LlmClassification,
  ClassifiedRow,
  AggregatedResult,
  CategoryConfig,
} from './types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function aggregate(
  preprocessed: PreprocessedData,
  classifications: LlmClassification[],
  categories: CategoryConfig[],
): AggregatedResult {
  const displayNames = new Map<string, string>();
  for (const cat of categories) {
    displayNames.set(cat.slug, cat.displayName);
  }

  const classMap = new Map<number, string>();
  for (const c of classifications) {
    classMap.set(c.row_id, c.category);
  }

  const iofByParent = new Map<number, number>();
  for (const entry of preprocessed.iof_entries) {
    const current = iofByParent.get(entry.parent_row_id) || 0;
    iofByParent.set(entry.parent_row_id, round2(current + entry.iof_row.amount_brl));
  }

  const fallbackSlug = categories.find((c) => c.slug === 'outros')?.slug
    ?? categories[categories.length - 1].slug;

  const category_details = new Map<string, ClassifiedRow[]>();
  let sumPositives = 0;

  for (const row of preprocessed.expense_rows) {
    const category = classMap.get(row.row_id) || fallbackSlug;
    const iof_amount = iofByParent.get(row.row_id) || 0;
    const effective_amount = round2(row.amount_brl + iof_amount);

    sumPositives = round2(sumPositives + effective_amount);

    const list = category_details.get(category) || [];
    list.push({ row, iof_amount, effective_amount });
    category_details.set(category, list);
  }

  const subcategories: Array<{ name: string; value: number }> = [];
  let categorized_total = 0;

  for (const [category, rows] of category_details.entries()) {
    const value = round2(rows.reduce((sum, r) => sum + r.effective_amount, 0));
    if (value <= 0) continue;

    subcategories.push({
      name: displayNames.get(category) || category,
      value,
    });
    categorized_total = round2(categorized_total + value);
  }

  const unmatchedCreditsTotal = round2(
    preprocessed.unmatched_credits.reduce((s, r) => s + r.amount_brl, 0),
  );

  if (unmatchedCreditsTotal !== 0) {
    subcategories.push({
      name: 'Reembolsos/Créditos',
      value: unmatchedCreditsTotal,
    });
    categorized_total = round2(categorized_total + unmatchedCreditsTotal);
  }

  subcategories.sort((a, b) => {
    if (a.value < 0 && b.value >= 0) return 1;
    if (a.value >= 0 && b.value < 0) return -1;
    return b.value - a.value;
  });

  const expected_total = round2(sumPositives + unmatchedCreditsTotal);
  const matches = Math.abs(expected_total - categorized_total) <= 0.01;

  if (!matches) {
    const breakdown = subcategories
      .map((s) => `  ${s.name}: ${s.value}`)
      .join('\n');
    throw new AppError(
      500,
      `Categorization total mismatch: expected=${expected_total}, categorized=${categorized_total}, diff=${round2(categorized_total - expected_total)}\n${breakdown}`,
    );
  }

  return {
    total: categorized_total,
    subcategories,
    validation: { expected_total, categorized_total, matches },
    category_details,
    preprocessed,
  };
}
