import { describe, it, expect } from 'vitest';
import {
  snapshotTargetFor,
  isBeforeFirstScheduled,
  FIRST_SCHEDULED_SNAPSHOT,
} from '../snapshot-target';

describe('snapshotTargetFor', () => {
  it('ainda é 30/11 em BRT às 02:59:59Z de 01/12', () =>
    expect(snapshotTargetFor(new Date('2026-12-01T02:59:59Z'))).toEqual({ year: 2026, month: 12 }));
  it('vira 01/12 em BRT às 03:00Z', () =>
    expect(snapshotTargetFor(new Date('2026-12-01T03:00:00Z'))).toEqual({ year: 2027, month: 1 }));
  it('vira o ano em dezembro', () =>
    expect(snapshotTargetFor(new Date('2027-12-15T12:00:00Z'))).toEqual({ year: 2028, month: 1 }));
  it('meio do mês aponta para o mês seguinte (catch-up)', () =>
    expect(snapshotTargetFor(new Date('2027-02-10T12:00:00Z'))).toEqual({ year: 2027, month: 3 }));
});

describe('isBeforeFirstScheduled', () => {
  it('Dez/2026 é antes', () => expect(isBeforeFirstScheduled({ year: 2026, month: 12 })).toBe(true));
  it('Jan/2027 não é', () => expect(isBeforeFirstScheduled({ year: 2027, month: 1 })).toBe(false));
  it('primeiro mês agendado é Jan/2027', () =>
    expect(FIRST_SCHEDULED_SNAPSHOT).toEqual({ year: 2027, month: 1 }));
});
