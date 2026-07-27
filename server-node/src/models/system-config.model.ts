import mongoose, { Schema, Document } from 'mongoose';
import { ISystemConfig } from '../types/system-config.types';

export interface SystemConfigDocument
  extends Omit<ISystemConfig, 'id'>,
    Document {}

const systemConfigSchema = new Schema<SystemConfigDocument>(
  {
    aiIntegrationEnabled: { type: Boolean, default: false },
    openRouterToken: { type: String, default: '' },
    aiCustomPrompt: { type: String, default: '' },
    aiModel: { type: String, default: '' },
    aiOutputLanguage: { type: String, default: 'pt' },
  },
  {
    collection: 'system-config',
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

export const SystemConfig = mongoose.model<SystemConfigDocument>(
  'SystemConfig',
  systemConfigSchema,
);
