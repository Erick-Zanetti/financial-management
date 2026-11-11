import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../month-snapshot.service', () => ({ ensureCurrentSnapshot: vi.fn() }));
vi.mock('../../../config/logger.config', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { ensureCurrentSnapshot } from '../month-snapshot.service';
import { logger } from '../../../config/logger.config';
import { startSnapshotScheduler } from '../snapshot-scheduler';

const FIFTEEN_MIN = 15 * 60 * 1000;

describe('startSnapshotScheduler', () => {
  let timer: NodeJS.Timeout | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    clearInterval(timer);
    vi.useRealTimers();
  });

  it('roda na hora e de novo a cada 15 min', async () => {
    vi.mocked(ensureCurrentSnapshot).mockResolvedValue('skipped');
    timer = startSnapshotScheduler();
    await vi.advanceTimersByTimeAsync(0);
    expect(ensureCurrentSnapshot).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(FIFTEEN_MIN);
    expect(ensureCurrentSnapshot).toHaveBeenCalledTimes(2);
  });

  it('loga created', async () => {
    vi.mocked(ensureCurrentSnapshot).mockResolvedValue('created');
    timer = startSnapshotScheduler();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Month snapshot created'));
  });

  it('erro é logado e o próximo ciclo roda de novo', async () => {
    vi.mocked(ensureCurrentSnapshot).mockRejectedValueOnce(new Error('db down')).mockResolvedValue('created');
    timer = startSnapshotScheduler();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.error).toHaveBeenCalledWith('Month snapshot failed', expect.any(Error));
    await vi.advanceTimersByTimeAsync(FIFTEEN_MIN);
    expect(ensureCurrentSnapshot).toHaveBeenCalledTimes(2);
  });
});
