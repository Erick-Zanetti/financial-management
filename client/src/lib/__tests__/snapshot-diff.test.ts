import { describe, it, expect } from 'vitest';
import { FinancialRelease, FinancialReleaseType, MonthSnapshot, SnapshotRelease } from '@/types/financial-release';
import { diffReleases, formatCapturedAt, noSnapshotMessage, snapshotToReleases } from '@/lib/snapshot-diff';

const E = FinancialReleaseType.Expense;
const R = FinancialReleaseType.Receipt;

const rel = (id: string, name: string, value: number, day: number, extra: Partial<FinancialRelease> = {}): FinancialRelease => ({
  id, name, value, day, type: E, year: 2026, month: 12, settled: false,
  category: { id: 'cat-cartoes', name: 'Cartões' }, ...extra,
});

// Dezembro/2026 real: snapshot de 01/11 vs banco de 11/11
const snapshotExpenses = [
  rel('c6', 'C6', 1452.04, 5), rel('carro23', 'Carro - 23', 4790.56, 5), rel('empresa', 'Empresa', 3500, 5),
  rel('amper', 'Ampernet', 139, 7), rel('marcos', 'Marcos', 600, 7), rel('facul', 'Faculdade Julia', 906, 10),
  rel('ml', 'ML', 783.96, 13), rel('apto', 'Apartamento', 10000, 14), rel('carro6', 'Carro - 6', 6283.55, 22),
];
const currentExpenses = [
  rel('c6', 'C6', 5275.15, 5), rel('carro23', 'Carro - 23', 4790.56, 5), rel('empresa', 'Empresa', 3500, 5),
  rel('amper', 'Ampernet', 139, 7), rel('marcos', 'Marcos', 600, 7), rel('cresol', 'Cresol', 3618.52, 11),
  rel('ml', 'ML', 920.28, 13), rel('apto', 'Apartamento', 10000, 14), rel('carro6', 'Carro - 6', 6283.55, 22),
];

describe('diffReleases', () => {
  const diff = diffReleases(snapshotExpenses, currentExpenses);

  it('C6 alterado com delta exato em centavos', () =>
    expect(diff.currentMarks.get('c6')).toEqual({ kind: 'changed', valueDelta: 3823.11 }));
  it('Cresol é novo', () => expect(diff.currentMarks.get('cresol')).toEqual({ kind: 'new' }));
  it('Faculdade Julia é removida só do lado snapshot', () => {
    expect(diff.snapshotMarks.get('facul')).toEqual({ kind: 'removed' });
    expect(diff.currentMarks.has('facul')).toBe(false);
  });
  it('linha igual não ganha marca', () => expect(diff.currentMarks.has('apto')).toBe(false));
  it('totais de Dezembro', () => {
    expect(diff.snapshotTotal).toBe(28455.11);
    expect(diff.currentTotal).toBe(35127.06);
    expect(diff.delta).toBe(6671.95);
  });

  it('renomear com o mesmo id é alterado, não novo+removido', () => {
    const d = diffReleases([rel('vigil', 'Vigil (3663)', 21516.1, 5)], [rel('vigil', 'Vigil (3443)', 21455.74, 5)]);
    expect(d.currentMarks.get('vigil')).toEqual({ kind: 'changed', valueDelta: -60.36 });
    expect(d.snapshotMarks.size).toBe(0);
  });
  it('pagar não é mudança', () => {
    const d = diffReleases([rel('a', 'A', 10, 1)], [rel('a', 'A', 10, 1, { settled: true, observations: 'pago' })]);
    expect(d.currentMarks.size).toBe(0);
  });
  it('só o dia mudou: alterado com delta 0', () => {
    const d = diffReleases([rel('a', 'A', 10, 1)], [rel('a', 'A', 10, 3)]);
    expect(d.currentMarks.get('a')).toEqual({ kind: 'changed', valueDelta: 0 });
  });
  it('categoria mudou: alterado', () => {
    const d = diffReleases([rel('a', 'A', 10, 1)], [rel('a', 'A', 10, 1, { category: { id: 'x', name: 'X' } })]);
    expect(d.currentMarks.get('a')?.kind).toBe('changed');
  });
});

describe('snapshotToReleases', () => {
  const sr = (releaseId: string, type: FinancialReleaseType, day: number): SnapshotRelease => ({
    releaseId, name: releaseId, value: 1, type, day, categoryId: 'c', categoryName: 'Cat', settled: true,
    subcategories: [{ categoryId: 's', categoryName: 'Sub', value: 1 }],
  });
  const snap: MonthSnapshot = {
    id: 'snap', year: 2026, month: 12, capturedAt: '2026-11-01T05:09:47Z', source: 'backup-import',
    releases: [sr('e2', E, 20), sr('r1', R, 5), sr('e1', E, 3)],
  };

  it('filtra por tipo, ordena por dia e mapeia para FinancialRelease', () => {
    const out = snapshotToReleases(snap, E);
    expect(out.map((r) => r.id)).toEqual(['e1', 'e2']);
    expect(out[0]).toMatchObject({
      id: 'e1', year: 2026, month: 12, type: E, category: { id: 'c', name: 'Cat' },
      subcategories: [{ category: { id: 's', name: 'Sub' }, value: 1 }],
    });
  });
});

describe('noSnapshotMessage', () => {
  it('antes de Dez/2026', () => expect(noSnapshotMessage(2026, 11)).toBe('Snapshots começam em Dez/2026.'));
  it('Fev/2027 é tirado em 01/01/2027', () =>
    expect(noSnapshotMessage(2027, 2)).toBe('Ainda não há snapshot para Fev/2027 — ele é tirado em 01/01/2027.'));
  it('Jan/2027 é tirado em 01/12/2026', () => expect(noSnapshotMessage(2027, 1)).toContain('01/12/2026'));
});

describe('formatCapturedAt', () => {
  it('mostra dd/MM HH:mm em BRT', () => expect(formatCapturedAt('2026-11-01T05:09:47Z')).toBe('01/11 02:09'));
  it('virada de dia em BRT', () => expect(formatCapturedAt('2026-12-01T02:30:00Z')).toBe('30/11 23:30'));
});
