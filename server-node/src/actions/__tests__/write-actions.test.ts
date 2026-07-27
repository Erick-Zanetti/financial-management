import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/financial-release.service', () => ({
  financialReleaseService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { financialReleaseService } from '../../services/financial-release.service';
import createRelease from '../create-release.action';
import updateRelease from '../update-release.action';
import deleteRelease from '../delete-release.action';
import { actionRegistry } from '../index';

const validCreate = {
  name: 'Mercado',
  value: 500,
  type: 'E',
  category: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  year: 2026,
  month: 7,
  day: 26,
};

beforeEach(() => vi.clearAllMocks());

describe('write actions', () => {
  it('create_release tem mode write e delega para o service', async () => {
    expect(createRelease.mode).toBe('write');
    vi.mocked(financialReleaseService.create).mockResolvedValue({
      id: 'r1',
      ...validCreate,
      settled: false,
      subcategories: [],
    } as never);
    await actionRegistry.execute('create_release', validCreate);
    expect(financialReleaseService.create).toHaveBeenCalled();
  });

  it('create_release rejeita payload inválido via registry', async () => {
    await expect(
      actionRegistry.execute('create_release', { ...validCreate, value: -5 }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(financialReleaseService.create).not.toHaveBeenCalled();
  });

  it('update_release separa id do resto do payload', async () => {
    expect(updateRelease.mode).toBe('write');
    vi.mocked(financialReleaseService.update).mockResolvedValue({
      id: 'r1',
      ...validCreate,
    } as never);
    await updateRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', value: 600 });
    expect(financialReleaseService.update).toHaveBeenCalledWith(
      'aaaaaaaaaaaaaaaaaaaaaaaa',
      { value: 600 },
    );
  });

  it('update_release lança 404 quando o release não existe', async () => {
    vi.mocked(financialReleaseService.update).mockResolvedValue(null);
    await expect(
      updateRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', value: 600 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('delete_release delega para o service e lança 404 se não achou', async () => {
    expect(deleteRelease.mode).toBe('write');
    vi.mocked(financialReleaseService.delete).mockResolvedValue(true);
    await expect(
      deleteRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }),
    ).resolves.toMatchObject({ deleted: true });
    vi.mocked(financialReleaseService.delete).mockResolvedValue(false);
    await expect(
      deleteRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('registry contém as 8 actions', () => {
    expect(actionRegistry.list().map((a) => a.name).sort()).toEqual([
      'create_release',
      'delete_release',
      'get_dashboard_summary',
      'get_release',
      'list_categories',
      'list_releases',
      'search_releases',
      'update_release',
    ]);
  });
});
