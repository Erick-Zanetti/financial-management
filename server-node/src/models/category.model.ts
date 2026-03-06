import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from '../types/category.types';

export interface CategoryDocument extends Omit<ICategory, 'id'>, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
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
