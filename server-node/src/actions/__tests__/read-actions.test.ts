import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/financial-release.service', () => ({
  financialReleaseService: {
    findByTypeAndMonthAndYear: vi.fn(),
    findById: vi.fn(),
    searchByName: vi.fn(),
    getDashboardSummarySegmented: vi.fn(),
  },
}));
vi.mock('../../services/category.service', () => ({
  categoryService: { findAll: vi.fn() },
}));

import { financialReleaseService } from '../../services/financial-release.service';
import { categoryService } from '../../services/category.service';
import listReleases from '../list-releases.action';
import getRelease from '../get-release.action';
import searchReleases from '../search-releases.action';
import listCategories from '../list-categories.action';
import getDashboardSummary from '../get-dashboard-summary.action';

const fakeRelease = {
  id: 'r1',
  name: 'Mercado',
  value: 500,
  type: 'E',
  year: 2026,
  month: 7,
  day: 26,
  settled: false,
  category: { name: 'Alimentação' },
  subcategories: [],
};

beforeEach(() => vi.clearAllMocks());

describe('read actions', () => {
  it('list_releases busca R e E quando type é omitido', async () => {
    vi.mocked(
      financialReleaseService.findByTypeAndMonthAndYear,
    ).mockResolvedValue([fakeRelease] as never);
    const result = (await listReleases.run({
      year: 2026,
      month: 7,
    })) as unknown[];
    expect(
      financialReleaseService.findByTypeAndMonthAndYear,
    ).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('list_releases serializa com nome da categoria e data ISO', async () => {
    vi.mocked(
      financialReleaseService.findByTypeAndMonthAndYear,
    ).mockResolvedValue([fakeRelease] as never);
    const result = (await listReleases.run({
      year: 2026,
      month: 7,
      type: 'E',
    })) as Array<{ category: string | null; date: string }>;
    expect(result[0]).toMatchObject({
      category: 'Alimentação',
      date: '2026-07-26',
    });
  });

  it('get_release retorna erro amigável quando não encontra', async () => {
    vi.mocked(financialReleaseService.findById).mockResolvedValue(null);
    await expect(
      getRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('search_releases repassa texto e ano', async () => {
    vi.mocked(financialReleaseService.searchByName).mockResolvedValue(
      [] as never,
    );
    await searchReleases.run({ text: 'mercado', year: 2026 });
    expect(financialReleaseService.searchByName).toHaveBeenCalledWith(
      'mercado',
      2026,
    );
  });

  it('list_categories serializa campos essenciais', async () => {
    vi.mocked(categoryService.findAll).mockResolvedValue([
      {
        id: 'c1',
        name: 'Cartões',
        type: 'E',
        allowSubcategories: true,
        allowDirectEntry: true,
      },
    ] as never);
    const result = (await listCategories.run({})) as Array<{
      id: string;
      name: string;
    }>;
    expect(result[0]).toMatchObject({ id: 'c1', name: 'Cartões' });
  });

  it('get_dashboard_summary delega para o service segmentado', async () => {
    vi.mocked(
      financialReleaseService.getDashboardSummarySegmented,
    ).mockResolvedValue([] as never);
    await getDashboardSummary.run({
      fromYear: 2026,
      fromMonth: 1,
      toYear: 2026,
      toMonth: 7,
    });
    expect(
      financialReleaseService.getDashboardSummarySegmented,
    ).toHaveBeenCalled();
  });
});
