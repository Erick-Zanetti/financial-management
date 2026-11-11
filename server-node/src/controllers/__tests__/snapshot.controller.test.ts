import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../services/month-snapshot/month-snapshot.service', () => ({ findSnapshot: vi.fn() }));
vi.mock('../../services/financial-release.service', () => ({ financialReleaseService: {} }));

import { findSnapshot } from '../../services/month-snapshot/month-snapshot.service';
import { financialReleaseController } from '../financial-release.controller';

function fakeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}
const req = (year: string, month: string) => ({ params: { year, month } }) as unknown as Request;

beforeEach(() => vi.clearAllMocks());

describe('findSnapshot controller', () => {
  it('200 com o snapshot', async () => {
    const snap = { year: 2026, month: 12, releases: [] };
    vi.mocked(findSnapshot).mockResolvedValue(snap as never);
    const res = fakeRes();
    await financialReleaseController.findSnapshot(req('2026', '12'), res as unknown as Response);
    expect(findSnapshot).toHaveBeenCalledWith(2026, 12);
    expect(res.json).toHaveBeenCalledWith(snap);
  });

  it('404 quando não existe', async () => {
    vi.mocked(findSnapshot).mockResolvedValue(null);
    const res = fakeRes();
    await financialReleaseController.findSnapshot(req('2027', '1'), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Snapshot not found' });
  });

  it.each([['abc', '1'], ['2027', '13'], ['2027', '0'], ['2027', '1.5']])('400 para %s/%s', async (y, m) => {
    const res = fakeRes();
    await financialReleaseController.findSnapshot(req(y, m), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(findSnapshot).not.toHaveBeenCalled();
  });
});
