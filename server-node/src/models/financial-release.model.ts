import mongoose, { Schema, Document } from 'mongoose';
import {
  IFinancialRelease,
  FinancialReleaseType,
  Person,
} from '../types/financial-release.types';

/**
 * @swagger
 * components:
 *   schemas:
 *     FinancialRelease:
 *       type: object
 *       required:
 *         - name
 *         - value
 *         - type
 *         - person
 *         - year
 *         - month
 *         - day
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         value:
 *           type: number
 *           format: float
 *         type:
 *           type: string
 *           enum: [R, E]
 *         person:
 *           type: string
 *           enum: [ERICK, JULIA]
 *         year:
 *           type: integer
 *         month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         day:
 *           type: integer
 *           minimum: 1
 *           maximum: 31
 *         settled:
 *           type: boolean
 *           default: false
 */

export interface FinancialReleaseDocument
  extends Omit<IFinancialRelease, 'id'>,
    Document {}

const financialReleaseSchema = new Schema<FinancialReleaseDocument>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(FinancialReleaseType),
      required: true,
    },
    person: {
      type: String,
      enum: Object.values(Person),
      required: true,
    },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    settled: { type: Boolean, default: false },
  },
  {
    collection: 'financialreleases',
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

financialReleaseSchema.index({ type: 1, month: 1, year: 1 });

export const FinancialRelease = mongoose.model<FinancialReleaseDocument>(
  'FinancialRelease',
  financialReleaseSchema,
);
