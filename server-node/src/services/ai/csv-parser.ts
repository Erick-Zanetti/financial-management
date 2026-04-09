import { AppError } from '../../middlewares/error-handler.middleware';
import { CsvRow } from './types';

function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 5).join('\n');
  const semicolons = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseBrlAmount(raw: string): number {
  let cleaned = raw.trim().replace(/[R$US\s]/g, '');
  if (!cleaned) return 0;

  const isNegative = cleaned.startsWith('-') || cleaned.startsWith('(');
  cleaned = cleaned.replace(/[()\\-]/g, '');

  // Brazilian format: 1.234,56 → dots are thousands, comma is decimal
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;

  return isNegative ? -Math.abs(value) : value;
}

function isHeaderRow(cells: string[]): boolean {
  const headerPatterns = /^(data|date|descri|merchant|valor|value|r\$|us\$|usd|brl|moeda|parcela)/i;
  const matches = cells.filter((c) => headerPatterns.test(c.trim())).length;
  return matches >= 2;
}

interface ColumnMap {
  date: number;
  merchant: number;
  amount_brl: number;
  amount_usd: number;
}

function detectColumns(headerCells: string[]): ColumnMap {
  const map: ColumnMap = { date: 0, merchant: 1, amount_brl: 2, amount_usd: -1 };

  for (let i = 0; i < headerCells.length; i++) {
    const h = headerCells[i].toLowerCase().trim();
    if (/^(data|date)$/.test(h)) map.date = i;
    else if (/descri|merchant|estabelecimento/.test(h)) map.merchant = i;
    else if (/valor.*r\$|r\$|valor(?!.*us)|amount.*brl/i.test(h)) map.amount_brl = i;
    else if (/valor.*us|us\$|usd|dolar|amount.*usd/i.test(h)) map.amount_usd = i;
  }

  return map;
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new AppError(422, 'CSV has fewer than 2 lines');
  }

  const delimiter = detectDelimiter(lines);
  let startIndex = 0;
  let colMap: ColumnMap = { date: 0, merchant: 1, amount_brl: 2, amount_usd: -1 };

  const firstCells = lines[0].split(delimiter).map((c) => c.trim());
  if (isHeaderRow(firstCells)) {
    colMap = detectColumns(firstCells);
    startIndex = 1;
  }

  const rows: CsvRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim());
    if (cells.length < 3) continue;

    const date = cells[colMap.date] || '';
    const merchant = cells[colMap.merchant] || '';
    const amount_brl = parseBrlAmount(cells[colMap.amount_brl] || '');
    const amount_usd =
      colMap.amount_usd >= 0 ? parseBrlAmount(cells[colMap.amount_usd] || '') : 0;

    if (!merchant) continue;

    rows.push({
      row_id: rows.length + 1,
      date,
      merchant,
      amount_brl,
      amount_usd,
    });
  }

  if (rows.length < 2) {
    throw new AppError(422, `CSV has fewer than 2 data rows (parsed ${rows.length})`);
  }

  return rows;
}
