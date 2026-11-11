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
    before.category?.id !== after.category?.id
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

export function noSnapshotMessage(year: number, month: number): string {
  if (year * 12 + month < FIRST_SNAPSHOT_MONTH.year * 12 + FIRST_SNAPSHOT_MONTH.month) {
    return `Snapshots começam em ${getMonthLabel(FIRST_SNAPSHOT_MONTH.month)}/${FIRST_SNAPSHOT_MONTH.year}.`;
  }
  const captureMonth = month === 1 ? 12 : month - 1;
  const captureYear = month === 1 ? year - 1 : year;
  return `Ainda não há snapshot para ${getMonthLabel(month)}/${year} — ele é tirado em 01/${pad2(captureMonth)}/${captureYear}.`;
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
