import { Request, Response } from 'express';
import { systemConfigService } from '../services/system-config.service';
import { updateSystemConfigSchema } from '../validators/system-config.validator';

export class SystemConfigController {
  async get(_req: Request, res: Response): Promise<void> {
    const config = await systemConfigService.get();
    res.json(config);
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = updateSystemConfigSchema.parse(req.body);
    const config = await systemConfigService.update(data);
    res.json(config);
  }
}

export const systemConfigController = new SystemConfigController();
