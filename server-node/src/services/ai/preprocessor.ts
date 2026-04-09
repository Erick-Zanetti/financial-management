import { CsvRow, IofEntry, ReversalPair, PreprocessedData } from './types';

export function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*parcela\s+\d+\/\d+/i, '')
    .replace(/\s+\d+\/\d+$/, '')
    .replace(/\s*-\s*$/, '');
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function detectIof(rows: CsvRow[]): { iof_entries: IofEntry[]; remaining: CsvRow[] } {
  const iofIds = new Set<number>();
  const iof_entries: IofEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const curr = rows[i];
    const prev = rows[i - 1];

    if (
      curr.amount_brl > 0 &&
      curr.amount_brl < 20 &&
      prev.amount_usd > 0 &&
      normalizeMerchant(curr.merchant) === normalizeMerchant(prev.merchant)
    ) {
      iof_entries.push({ iof_row: curr, parent_row_id: prev.row_id });
      iofIds.add(curr.row_id);
    }
  }

  return {
    iof_entries,
    remaining: rows.filter((r) => !iofIds.has(r.row_id)),
  };
}

function detectMatchedReversals(rows: CsvRow[]): {
  matched_reversals: ReversalPair[];
  remaining: CsvRow[];
} {
  const negatives = rows.filter((r) => r.amount_brl < 0);
  const positives = rows.filter((r) => r.amount_brl >= 0);

  const usedPositiveIds = new Set<number>();
  const usedNegativeIds = new Set<number>();
  const matched_reversals: ReversalPair[] = [];

  for (const neg of negatives) {
    const negNorm = normalizeMerchant(neg.merchant);
    const absAmount = round2(Math.abs(neg.amount_brl));

    const match = positives.find(
      (pos) =>
        !usedPositiveIds.has(pos.row_id) &&
        round2(pos.amount_brl) === absAmount &&
        normalizeMerchant(pos.merchant) === negNorm,
    );

    if (match) {
      matched_reversals.push({ positive_row: match, negative_row: neg });
      usedPositiveIds.add(match.row_id);
      usedNegativeIds.add(neg.row_id);
    }
  }

  const excludedIds = new Set([...usedPositiveIds, ...usedNegativeIds]);
  return {
    matched_reversals,
    remaining: rows.filter((r) => !excludedIds.has(r.row_id)),
  };
}

const PAYMENT_PATTERNS = [
  'pagamento',
  'inclusao de pagamento',
  'inclusão de pagamento',
  'antecipa',
  'antecipação',
];

function detectPayments(rows: CsvRow[]): { payments: CsvRow[]; remaining: CsvRow[] } {
  const payments: CsvRow[] = [];
  const remaining: CsvRow[] = [];

  for (const row of rows) {
    const norm = normalizeMerchant(row.merchant);
    if (PAYMENT_PATTERNS.some((p) => norm.includes(p))) {
      payments.push(row);
    } else {
      remaining.push(row);
    }
  }

  return { payments, remaining };
}

const FEE_PATTERNS = ['anuidade', 'juros', 'multa', 'tarifa de', 'encargo'];

function detectFees(rows: CsvRow[]): { fees: CsvRow[]; remaining: CsvRow[] } {
  const fees: CsvRow[] = [];
  const remaining: CsvRow[] = [];

  for (const row of rows) {
    const norm = normalizeMerchant(row.merchant);
    if (FEE_PATTERNS.some((p) => norm.includes(p))) {
      fees.push(row);
    } else {
      remaining.push(row);
    }
  }

  return { fees, remaining };
}

export function preprocess(rows: CsvRow[]): PreprocessedData {
  const step1 = detectIof(rows);
  const step2 = detectMatchedReversals(step1.remaining);
  const step3 = detectPayments(step2.remaining);
  const step4 = detectFees(step3.remaining);

  // Discard any remaining negative rows (unmatched credits)
  const expense_rows = step4.remaining.filter((r) => r.amount_brl > 0);
  const unmatched_negatives = step4.remaining.filter((r) => r.amount_brl <= 0);

  return {
    expense_rows,
    iof_entries: step1.iof_entries,
    matched_reversals: step2.matched_reversals,
    payments: [...step3.payments, ...unmatched_negatives],
    fees: step4.fees,
  };
}
