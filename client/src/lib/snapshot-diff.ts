import { FinancialRelease, FinancialReleaseType, MonthSnapshot } from '@/types/financial-release';
import { getMonthLabel } from '@/lib/months';

export type RowMark = { kind: 'new' } | { kind: 'changed'; valueDelta: number } | { kind: 'removed' };

export interface ReleaseDiff {
  currentMarks: Map<string, RowMark>;
  snapshotMarks: Map<string, RowMark>;
  currentTotal: number;
  snapshotTotal: number;
  delta: number;
}

const FIRST_SNAPSHOT_MONTH = { year: 2026, month: 12 };

const round2 = (x: number): number => Math.round(x * 100) / 100;
const sum = (releases: FinancialRelease[]): number => round2(releases.reduce((acc, r) => acc + r.value, 0));
const pad2 = (n: number): string => String(n).padStart(2, '0');

export function snapshotToReleases(snapshot: MonthSnapshot, type: FinancialReleaseType): FinancialRelease[] {
  return snapshot.releases
    .filter((r) => r.type === type)
    .sort((a, b) => a.day - b.day)
    .map((r) => ({
      id: r.releaseId,
      name: r.name,
      value: r.value,
      type: r.type,
      year: snapshot.year,
      month: snapshot.month,
      day: r.day,
      settled: r.settled,
      person: r.person,
      observations: r.observations,
      category: { id: r.categoryId ?? '', name: r.categoryName },
      subcategories: r.subcategories.map((s) => ({
        category: s.categoryId ? { id: s.categoryId, name: s.categoryName } : null,
        value: s.value,
      })),
    }));
}

function isChanged(before: FinancialRelease, after: FinancialRelease): boolean {
  return (
    before.name !== after.name ||
    before.value !== after.value ||
    before.day !== after.day ||
    (before.category?.id || '') !== (after.category?.id || '')
  );
}

/** Line-by-line diff keyed by release id; settled/observations/subcategories are ignored. */
export function diffReleases(snapshot: FinancialRelease[], current: FinancialRelease[]): ReleaseDiff {
  const snapshotById = new Map(snapshot.map((r) => [String(r.id), r]));
  const currentIds = new Set(current.map((r) => String(r.id)));

  const currentMarks = new Map<string, RowMark>();
  for (const release of current) {
    const id = String(release.id);
    const before = snapshotById.get(id);
    if (!before) {
      currentMarks.set(id, { kind: 'new' });
    } else if (isChanged(before, release)) {
      currentMarks.set(id, { kind: 'changed', valueDelta: round2(release.value - before.value) });
    }
  }

  const snapshotMarks = new Map<string, RowMark>();
  for (const id of Array.from(snapshotById.keys())) {
    if (!currentIds.has(id)) {
      snapshotMarks.set(id, { kind: 'removed' });
    }
  }

  const currentTotal = sum(current);
  const snapshotTotal = sum(snapshot);
  return { currentMarks, snapshotMarks, currentTotal, snapshotTotal, delta: round2(currentTotal - snapshotTotal) };
}

export interface AlignedRows {
  snapshot: (FinancialRelease | null)[];
  current: (FinancialRelease | null)[];
}

/**
 * Puts each release on the same line index on both sides, with `null` where it doesn't exist
 * (new on the current side, removed on the snapshot side). Ordered by the current day, ties stable.
 */
export function alignRows(snapshot: FinancialRelease[], current: FinancialRelease[]): AlignedRows {
  const snapshotById = new Map(snapshot.map((r) => [String(r.id), r]));
  const currentIds = new Set(current.map((r) => String(r.id)));

  const pairs = [
    ...current.map((r) => ({ day: r.day, current: r, snapshot: snapshotById.get(String(r.id)) ?? null })),
    ...snapshot
      .filter((r) => !currentIds.has(String(r.id)))
      .map((r) => ({ day: r.day, current: null, snapshot: r })),
  ].sort((a, b) => a.day - b.day);

  return {
    snapshot: pairs.map((p) => p.snapshot),
    current: pairs.map((p) => p.current),
  };
}

/** Day-1 capture instant for a month: 00:00 BRT (UTC-3) on day 1 of the previous month. */
function captureInstant(year: number, month: number): { at: Date; label: string } {
  const captureMonth = month === 1 ? 12 : month - 1;
  const captureYear = month === 1 ? year - 1 : year;
  return {
    at: new Date(Date.UTC(captureYear, captureMonth - 1, 1, 3)),
    label: `01/${pad2(captureMonth)}/${captureYear}`,
  };
}

export function noSnapshotMessage(year: number, month: number, now: Date = new Date()): string {
  if (year * 12 + month < FIRST_SNAPSHOT_MONTH.year * 12 + FIRST_SNAPSHOT_MONTH.month) {
    return `Snapshots começam em ${getMonthLabel(FIRST_SNAPSHOT_MONTH.month)}/${FIRST_SNAPSHOT_MONTH.year}.`;
  }
  const monthLabel = `${getMonthLabel(month)}/${year}`;
  const capture = captureInstant(year, month);
  if (now.getTime() >= capture.at.getTime()) {
    return `Não há snapshot para ${monthLabel} — a captura de ${capture.label} não aconteceu.`;
  }
  return `Ainda não há snapshot para ${monthLabel} — ele é tirado em ${capture.label}.`;
}

const capturedAtFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** `dd/MM HH:mm` in BRT, regardless of the viewer's time zone. */
export function formatCapturedAt(iso: string): string {
  return capturedAtFormat.format(new Date(iso)).replace(',', '');
}
