import {
  SystemConfig,
  SystemConfigDocument,
} from '../models/system-config.model';
import { UpdateSystemConfigDto } from '../validators/system-config.validator';

class SystemConfigService {
  async get(): Promise<SystemConfigDocument> {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await new SystemConfig({}).save();
    }
    return config;
  }

  async update(data: UpdateSystemConfigDto): Promise<SystemConfigDocument> {
    const config = await SystemConfig.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true },
    );
    return config!;
  }
}

export const systemConfigService = new SystemConfigService();
