import { logger } from '../../config/logger.config';
import { ensureCurrentSnapshot } from './month-snapshot.service';

export const SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000;

async function runOnce(): Promise<void> {
  try {
    const result = await ensureCurrentSnapshot();
    if (result === 'created') {
      logger.info('Month snapshot created for next month');
    }
  } catch (error) {
    logger.error('Month snapshot failed', error);
  }
}

/** Runs the idempotent day-1 capture now and every interval; failures are logged, never thrown. */
export function startSnapshotScheduler(intervalMs: number = SNAPSHOT_INTERVAL_MS): NodeJS.Timeout {
  void runOnce();
  const timer = setInterval(() => void runOnce(), intervalMs);
  timer.unref();
  return timer;
}
