import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';

const lean = vi.fn();
const populate2 = vi.fn(() => ({ lean }));
const populate1 = vi.fn(() => ({ populate: populate2 }));

vi.mock('../../../models/financial-release.model', () => ({
  FinancialRelease: { find: vi.fn(() => ({ populate: populate1 })) },
}));
vi.mock('../../../models/month-snapshot.model', () => ({
  MonthSnapshot: { exists: vi.fn(), create: vi.fn(), findOne: vi.fn() },
}));

import { FinancialRelease } from '../../../models/financial-release.model';
import { MonthSnapshot } from '../../../models/month-snapshot.model';
import { ensureCurrentSnapshot, toSnapshotRelease } from '../month-snapshot.service';

const releaseId = new Types.ObjectId();
const categoryId = new Types.ObjectId();
const subCategoryId = new Types.ObjectId();

const c6 = {
  _id: releaseId,
  name: 'C6',
  value: 1452.04,
  type: 'E',
  year: 2027,
  month: 1,
  day: 5,
  settled: false,
  person: 'Erick',
  observations: 'fatura',
  category: { _id: categoryId, name: 'Cartões' },
  subcategories: [{ category: { _id: subCategoryId, name: 'Mercado' }, value: 200 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(MonthSnapshot.exists).mockResolvedValue(null);
  vi.mocked(MonthSnapshot.create).mockResolvedValue({} as never);
  lean.mockResolvedValue([]);
});

describe('toSnapshotRelease', () => {
  it('copia os campos e denormaliza nomes de categoria', () => {
    expect(toSnapshotRelease(c6)).toEqual({
      releaseId,
      name: 'C6',
      value: 1452.04,
      type: 'E',
      day: 5,
      categoryId,
      categoryName: 'Cartões',
      person: 'Erick',
      settled: false,
      observations: 'fatura',
      subcategories: [{ categoryId: subCategoryId, categoryName: 'Mercado', value: 200 }],
    });
  });

  it('categoria apagada (null) vira categoryName vazio', () => {
    const r = toSnapshotRelease({ ...c6, category: null, subcategories: [{ category: null, value: 5 }] });
    expect(r.categoryId).toBeNull();
    expect(r.categoryName).toBe('');
    expect(r.subcategories).toEqual([{ categoryId: null, categoryName: '', value: 5 }]);
  });
});

describe('ensureCurrentSnapshot', () => {
  it('skipped antes de Jan/2027 e não cria nada', async () => {
    await expect(ensureCurrentSnapshot(new Date('2026-11-20T12:00:00Z'))).resolves.toBe('skipped');
    expect(MonthSnapshot.create).not.toHaveBeenCalled();
  });

  it('exists quando o snapshot já existe', async () => {
    vi.mocked(MonthSnapshot.exists).mockResolvedValue({ _id: new Types.ObjectId() } as never);
    await expect(ensureCurrentSnapshot(new Date('2026-12-01T03:00:00Z'))).resolves.toBe('exists');
    expect(MonthSnapshot.exists).toHaveBeenCalledWith({ year: 2027, month: 1 });
    expect(MonthSnapshot.create).not.toHaveBeenCalled();
  });

  it('created: congela os lançamentos do mês seguinte em BRT', async () => {
    const now = new Date('2026-12-01T03:00:00Z');
    lean.mockResolvedValue([c6, { ...c6, _id: new Types.ObjectId(), category: null }]);

    await expect(ensureCurrentSnapshot(now)).resolves.toBe('created');

    expect(FinancialRelease.find).toHaveBeenCalledWith({ year: 2027, month: 1 });
    const arg = vi.mocked(MonthSnapshot.create).mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(arg).toMatchObject({ year: 2027, month: 1, capturedAt: now, source: 'scheduled' });
    const releases = arg.releases as { categoryName: string }[];
    expect(releases.map((r) => r.categoryName)).toEqual(['Cartões', '']);
  });

  it('created com mês vazio grava releases []', async () => {
    await expect(ensureCurrentSnapshot(new Date('2027-02-01T03:00:00Z'))).resolves.toBe('created');
    expect(vi.mocked(MonthSnapshot.create).mock.calls[0][0]).toMatchObject({ year: 2027, month: 3, releases: [] });
  });

  it('chave duplicada (corrida) vira exists', async () => {
    vi.mocked(MonthSnapshot.create).mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));
    await expect(ensureCurrentSnapshot(new Date('2026-12-01T03:00:00Z'))).resolves.toBe('exists');
  });

  it('outros erros sobem', async () => {
    vi.mocked(MonthSnapshot.create).mockRejectedValue(new Error('boom'));
    await expect(ensureCurrentSnapshot(new Date('2026-12-01T03:00:00Z'))).rejects.toThrow('boom');
  });
});
