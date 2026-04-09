import mongoose, { Schema, Document } from 'mongoose';
import { ICategory, CategoryType } from '../types/category.types';

export interface CategoryDocument extends Omit<ICategory, 'id'>, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: {
      type: String,
      enum: Object.values(CategoryType),
      required: true,
    },
    allowSubcategories: { type: Boolean, default: false },
    allowAiIntegration: { type: Boolean, default: false },
  },
  {
    collection: 'categories',
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

export const Category = mongoose.model<CategoryDocument>(
  'Category',
  categorySchema,
);
