import mongoose, { Schema, Document } from 'mongoose';
import { FinancialReleaseType, Person, type FinancialReleaseTypeEnum, type PersonEnum } from '../types/financial-release.types.js';

export interface IFinancialReleaseDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  value: number;
  type: FinancialReleaseTypeEnum;
  person: PersonEnum;
  year: number;
  month: number;
  day: number;
}

const financialReleaseSchema = new Schema<IFinancialReleaseDocument>(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
    type: { type: String, enum: Object.values(FinancialReleaseType), required: true },
    person: { type: String, enum: Object.values(Person), required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
  },
  {
    collection: 'financialreleases',
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export const FinancialReleaseModel = mongoose.model<IFinancialReleaseDocument>(
  'FinancialRelease',
  financialReleaseSchema
);
