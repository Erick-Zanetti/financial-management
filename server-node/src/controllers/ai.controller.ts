import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { systemConfigService } from '../services/system-config.service';
import { AppError } from '../middlewares/error-handler.middleware';

class AiController {
  async processPdf(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new AppError(400, 'PDF file is required');
    }

    const config = await systemConfigService.get();

    if (!config.aiIntegrationEnabled) {
      throw new AppError(403, 'AI integration is not enabled');
    }
    if (!config.openRouterToken) {
      throw new AppError(400, 'OpenRouter token is not configured');
    }
    if (!config.aiModel) {
      throw new AppError(400, 'AI model is not configured');
    }

    const result = await aiService.processFile(req.file.buffer, req.file.mimetype, {
      openRouterToken: config.openRouterToken,
      aiModel: config.aiModel,
      aiOutputLanguage: config.aiOutputLanguage || 'pt',
      aiCustomPrompt: config.aiCustomPrompt || '',
    });

    res.json(result);
  }
}

export const aiController = new AiController();
