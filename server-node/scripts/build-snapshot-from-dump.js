// mongosh script — run ONLY against a throwaway Mongo restored from a backup dump.
// Prints (EJSON, canonical) a `monthsnapshots` document for SNAP_YEAR/SNAP_MONTH,
// with the same field mapping as toSnapshotRelease() in
// src/services/month-snapshot/month-snapshot.service.ts.
//
// docker exec -e SNAP_YEAR=2026 -e SNAP_MONTH=12 -e SNAP_CAPTURED_AT=2026-11-01T05:09:47Z \
//   <tmp-container> mongosh --quiet financial-management /s/build-snapshot-from-dump.js
const year = Number(process.env.SNAP_YEAR);
const month = Number(process.env.SNAP_MONTH);
const capturedAt = new Date(process.env.SNAP_CAPTURED_AT);
if (!Number.isInteger(year) || !(month >= 1 && month <= 12) || isNaN(capturedAt.getTime())) {
  throw new Error('Set SNAP_YEAR, SNAP_MONTH (1-12) and SNAP_CAPTURED_AT (ISO date)');
}

const categoryNames = new Map(db.categories.find({}, { name: 1 }).toArray().map((c) => [String(c._id), c.name]));
const nameOf = (id) => (id ? categoryNames.get(String(id)) ?? '' : '');

const releases = db.financialreleases
  .find({ year, month })
  .sort({ type: -1, day: 1 })
  .toArray()
  .map((r) => ({
    releaseId: r._id,
    name: r.name,
    value: r.value,
    type: r.type,
    day: r.day,
    categoryId: r.category ?? null,
    categoryName: nameOf(r.category),
    person: r.person,
    settled: !!r.settled,
    observations: r.observations,
    subcategories: (r.subcategories ?? []).map((s) => ({
      categoryId: s.category ?? null,
      categoryName: nameOf(s.category),
      value: s.value,
    })),
  }));

const doc = { year, month, capturedAt, source: 'backup-import', releases };
print(EJSON.stringify(doc, null, 0, { relaxed: false }));
