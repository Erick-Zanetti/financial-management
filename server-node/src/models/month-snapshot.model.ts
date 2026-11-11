import mongoose, { Schema, Document, Types } from 'mongoose';
import { FinancialReleaseType } from '../types/financial-release.types';

export type SnapshotSource = 'scheduled' | 'backup-import';

export interface SnapshotSubcategory {
  categoryId: Types.ObjectId | null;
  categoryName: string;
  value: number;
}

/** Frozen copy of a financial release at capture time; releaseId is the diff key. */
export interface SnapshotRelease {
  releaseId: Types.ObjectId;
  name: string;
  value: number;
  type: FinancialReleaseType;
  day: number;
  categoryId: Types.ObjectId | null;
  categoryName: string;
  person?: string;
  settled: boolean;
  observations?: string;
  subcategories: SnapshotSubcategory[];
}

export interface IMonthSnapshot {
  year: number;
  month: number;
  capturedAt: Date;
  source: SnapshotSource;
  releases: SnapshotRelease[];
}

export interface MonthSnapshotDocument extends IMonthSnapshot, Document {}

const snapshotReleaseSchema = new Schema<SnapshotRelease>(
  {
    releaseId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    type: { type: String, enum: Object.values(FinancialReleaseType), required: true },
    day: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, default: null },
    categoryName: { type: String, default: '' },
    person: { type: String },
    settled: { type: Boolean, default: false },
    observations: { type: String },
    subcategories: [
      {
        categoryId: { type: Schema.Types.ObjectId, default: null },
        categoryName: { type: String, default: '' },
        value: { type: Number, required: true },
        _id: false,
      },
    ],
  },
  { _id: false },
);

const monthSnapshotSchema = new Schema<MonthSnapshotDocument>(
  {
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    capturedAt: { type: Date, required: true },
    source: { type: String, enum: ['scheduled', 'backup-import'], required: true },
    releases: { type: [snapshotReleaseSchema], default: [] },
  },
  {
    collection: 'monthsnapshots',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

monthSnapshotSchema.index({ year: 1, month: 1 }, { unique: true });

export const MonthSnapshot = mongoose.model<MonthSnapshotDocument>(
  'MonthSnapshot',
  monthSnapshotSchema,
);
