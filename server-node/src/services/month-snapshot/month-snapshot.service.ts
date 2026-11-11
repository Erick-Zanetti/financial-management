import { Types } from 'mongoose';
import { FinancialRelease } from '../../models/financial-release.model';
import {
  MonthSnapshot,
  MonthSnapshotDocument,
  SnapshotRelease,
} from '../../models/month-snapshot.model';
import { FinancialReleaseType } from '../../types/financial-release.types';
import { isBeforeFirstScheduled, snapshotTargetFor } from './snapshot-target';

export type EnsureSnapshotResult = 'created' | 'exists' | 'skipped';

interface PopulatedCategory {
  _id: Types.ObjectId;
  name: string;
}

/** Lean release with `category` and `subcategories.category` populated to `{_id, name}`. */
export interface PopulatedRelease {
  _id: Types.ObjectId;
  name: string;
  value: number;
  type: string;
  day: number;
  category: PopulatedCategory | null;
  person?: string;
  settled?: boolean;
  observations?: string;
  subcategories?: { category: PopulatedCategory | null; value: number }[];
}

const DUPLICATE_KEY = 11000;

export function toSnapshotRelease(doc: PopulatedRelease): SnapshotRelease {
  return {
    releaseId: doc._id,
    name: doc.name,
    value: doc.value,
    type: doc.type as FinancialReleaseType,
    day: doc.day,
    categoryId: doc.category?._id ?? null,
    categoryName: doc.category?.name ?? '',
    person: doc.person,
    settled: !!doc.settled,
    observations: doc.observations,
    subcategories: (doc.subcategories ?? []).map((s) => ({
      categoryId: s.category?._id ?? null,
      categoryName: s.category?.name ?? '',
      value: s.value,
    })),
  };
}

export async function ensureCurrentSnapshot(now: Date = new Date()): Promise<EnsureSnapshotResult> {
  const { year, month } = snapshotTargetFor(now);
  if (isBeforeFirstScheduled({ year, month })) {
    return 'skipped';
  }
  if (await MonthSnapshot.exists({ year, month })) {
    return 'exists';
  }

  const releases = (await FinancialRelease.find({ year, month })
    .populate('category', 'name')
    .populate('subcategories.category', 'name')
    .lean()) as unknown as PopulatedRelease[];

  try {
    await MonthSnapshot.create({
      year,
      month,
      capturedAt: now,
      source: 'scheduled',
      releases: releases.map(toSnapshotRelease),
    });
    return 'created';
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      return 'exists';
    }
    throw error;
  }
}

export async function findSnapshot(
  year: number,
  month: number,
): Promise<MonthSnapshotDocument | null> {
  return MonthSnapshot.findOne({ year, month });
}
