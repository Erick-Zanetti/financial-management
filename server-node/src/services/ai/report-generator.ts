import { AggregatedResult, CATEGORY_DISPLAY_NAMES, ExpenseCategory } from './types';

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

  // Excluded items (payments, fees, IOF, unmatched negatives)
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
    const rowLines = rows
      .sort((a, b) => b.effective_amount - a.effective_amount)
      .map((r) => {
        const label =
          r.iof_amount > 0
            ? `${r.row.merchant} (+ IOF ${formatBrl(r.iof_amount)})`
            : r.row.merchant;
        return `| ${label} | ${formatBrl(r.effective_amount)} |`;
      })
      .join('\n');

    sections.push(
      `## ${displayName} — ${formatBrl(catTotal)}\n| Transação | Valor |\n|---|---:|\n${rowLines}`,
    );
  }

  // Summary footer
  const paymentsTotal = preprocessed.payments.reduce(
    (s, p) => s + Math.abs(p.amount_brl),
    0,
  );
  const reversalsTotal = preprocessed.matched_reversals.reduce(
    (s, p) => s + p.positive_row.amount_brl,
    0,
  );
  const feesTotal =
    preprocessed.fees.reduce((s, f) => s + Math.abs(f.amount_brl), 0) +
    preprocessed.iof_entries.reduce((s, e) => s + e.iof_row.amount_brl, 0);

  sections.push(
    `---\n**Total categorizado:** R$ ${formatBrl(result.total)}\n**Pagamentos:** R$ ${formatBrl(paymentsTotal)}\n**Estornos:** R$ ${formatBrl(reversalsTotal)}\n**Taxas/IOF:** R$ ${formatBrl(feesTotal)}`,
  );

  return sections.join('\n\n');
}
