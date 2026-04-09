import { AggregatedResult, ClassifiedRow, CATEGORY_DISPLAY_NAMES, ExpenseCategory } from './types';
import { normalizeMerchant } from './preprocessor';

interface ConsolidatedReportRow {
  merchant: string;
  total: number;
  iof_total: number;
  count: number;
}

function consolidateForReport(rows: ClassifiedRow[]): ConsolidatedReportRow[] {
  const groups = new Map<string, ConsolidatedReportRow>();

  for (const r of rows) {
    const key = normalizeMerchant(r.row.merchant);
    const existing = groups.get(key);
    if (existing) {
      existing.total = Math.round((existing.total + r.effective_amount) * 100) / 100;
      existing.iof_total = Math.round((existing.iof_total + r.iof_amount) * 100) / 100;
      existing.count++;
    } else {
      groups.set(key, {
        merchant: r.row.merchant,
        total: r.effective_amount,
        iof_total: r.iof_amount,
        count: 1,
      });
    }
  }

  return [...groups.values()];
}

function formatBrl(value: number): string {
  return Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generateReport(result: AggregatedResult): string {
  const sections: string[] = [];
  const { preprocessed, category_details } = result;

  // Matched reversals
  if (preprocessed.matched_reversals.length > 0) {
    const rows = preprocessed.matched_reversals
      .map(
        (p) =>
          `| ${p.positive_row.merchant} | ${p.negative_row.merchant} | ${formatBrl(p.positive_row.amount_brl)} |`,
      )
      .join('\n');

    sections.push(
      `## Pares Removidos (Estornos)\n| Cobrança | Estorno | Valor |\n|---|---|---:|\n${rows}`,
    );
  }

  // Excluded items (payments, fees, IOF) — unmatched credits are now a category
  const excludedRows: string[] = [];

  for (const p of preprocessed.payments) {
    excludedRows.push(`| Pagamento | ${p.merchant} | ${formatBrl(p.amount_brl)} |`);
  }
  for (const entry of preprocessed.iof_entries) {
    excludedRows.push(
      `| IOF | ${entry.iof_row.merchant} (IOF) | ${formatBrl(entry.iof_row.amount_brl)} |`,
    );
  }
  for (const f of preprocessed.fees) {
    excludedRows.push(`| Taxa | ${f.merchant} | ${formatBrl(f.amount_brl)} |`);
  }

  if (excludedRows.length > 0) {
    sections.push(
      `## Excluídos\n| Tipo | Transação | Valor |\n|---|---|---:|\n${excludedRows.join('\n')}`,
    );
  }

  // Categories
  const sortedCategories = [...category_details.entries()].sort(
    (a, b) => {
      const sumA = a[1].reduce((s, r) => s + r.effective_amount, 0);
      const sumB = b[1].reduce((s, r) => s + r.effective_amount, 0);
      return sumB - sumA;
    },
  );

  for (const [category, rows] of sortedCategories) {
    const catTotal = rows.reduce((s, r) => s + r.effective_amount, 0);
    if (catTotal <= 0) continue;

    const displayName = CATEGORY_DISPLAY_NAMES[category as ExpenseCategory];
    const consolidated = consolidateForReport(rows);
    const rowLines = consolidated
      .sort((a, b) => b.total - a.total)
      .map((c) => {
        const countSuffix = c.count > 1 ? ` (x${c.count})` : '';
        const iofSuffix = c.iof_total > 0 ? ` (+ IOF ${formatBrl(c.iof_total)})` : '';
        return `| ${c.merchant}${countSuffix}${iofSuffix} | ${formatBrl(c.total)} |`;
      })
      .join('\n');

    sections.push(
      `## ${displayName} — ${formatBrl(catTotal)}\n| Transação | Valor |\n|---|---:|\n${rowLines}`,
    );
  }

  // Reembolsos/Créditos category (unmatched credits as negative category)
  if (preprocessed.unmatched_credits.length > 0) {
    const creditsTotal = preprocessed.unmatched_credits.reduce(
      (s, c) => s + c.amount_brl,
      0,
    );
    if (creditsTotal !== 0) {
      const creditLines = preprocessed.unmatched_credits
        .map((c) => `| ${c.merchant} | -${formatBrl(Math.abs(c.amount_brl))} |`)
        .join('\n');
      sections.push(
        `## Reembolsos/Créditos — -${formatBrl(Math.abs(creditsTotal))}\n| Transação | Valor |\n|---|---:|\n${creditLines}`,
      );
    }
  }

  // Summary footer
  const paymentsTotal = preprocessed.payments.reduce(
    (s, p) => s + Math.abs(p.amount_brl),
    0,
  );
  const matchedReversalsTotal = preprocessed.matched_reversals.reduce(
    (s, p) => s + p.positive_row.amount_brl,
    0,
  );
  const feesTotal =
    preprocessed.fees.reduce((s, f) => s + Math.abs(f.amount_brl), 0) +
    preprocessed.iof_entries.reduce((s, e) => s + e.iof_row.amount_brl, 0);

  sections.push(
    `---\n**Total categorizado:** R$ ${formatBrl(result.total)}\n**Pagamentos:** R$ ${formatBrl(paymentsTotal)}\n**Estornos pareados:** R$ ${formatBrl(matchedReversalsTotal)}\n**Taxas/IOF:** R$ ${formatBrl(feesTotal)}`,
  );

  return sections.join('\n\n');
}
