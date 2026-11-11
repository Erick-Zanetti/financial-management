export interface YearMonth {
  year: number;
  month: number;
}

export const SNAPSHOT_TIME_ZONE = 'America/Sao_Paulo';

export const FIRST_SCHEDULED_SNAPSHOT: YearMonth = { year: 2027, month: 1 };

const brtYearMonthFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: SNAPSHOT_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
});

/** The month after the current month in BRT — the month a day-1 snapshot freezes. */
export function snapshotTargetFor(now: Date): YearMonth {
  const parts = brtYearMonthFormat.formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function isBeforeFirstScheduled(target: YearMonth): boolean {
  return (
    target.year * 12 + target.month <
    FIRST_SCHEDULED_SNAPSHOT.year * 12 + FIRST_SCHEDULED_SNAPSHOT.month
  );
}
