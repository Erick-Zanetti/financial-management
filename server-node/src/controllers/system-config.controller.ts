import { Request, Response } from 'express';
import { systemConfigService } from '../services/system-config.service';
import {
  updateSystemConfigSchema,
  UpdateSystemConfigDto,
} from '../validators/system-config.validator';

function maskToken(token: string): string {
  if (!token || token.length < 10) return token ? '••••' : '';
  return token.slice(0, 10) + '...' + token.slice(-3);
}

export class SystemConfigController {
  async get(_req: Request, res: Response): Promise<void> {
    const config = await systemConfigService.get();
    const json = config.toJSON();
    json.openRouterToken = maskToken(json.openRouterToken);
    res.json(json);
  }

  async update(req: Request, res: Response): Promise<void> {
    const parsed = updateSystemConfigSchema.parse(req.body);
    const { openRouterToken, ...rest } = parsed;
    const data: Partial<UpdateSystemConfigDto> = { ...rest };
    if (openRouterToken && !openRouterToken.includes('...')) {
      data.openRouterToken = openRouterToken;
    }
    const config = await systemConfigService.update(data as UpdateSystemConfigDto);
    const json = config.toJSON();
    json.openRouterToken = maskToken(json.openRouterToken);
    res.json(json);
  }
}

export const systemConfigController = new SystemConfigController();
