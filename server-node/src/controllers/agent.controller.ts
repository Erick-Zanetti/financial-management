import { Request, Response } from 'express';
import { agentChatSchema } from '../validators/agent.validator';
import { agentService } from '../services/agent/agent.service';
import { AgentEvent } from '../services/agent/agent.types';
import { AppError } from '../middlewares/error-handler.middleware';
import { logger } from '../config/logger.config';

class AgentController {
  async chat(req: Request, res: Response): Promise<void> {
    const parsed = agentChatSchema.safeParse(req.body);
    if (!parsed.success) {
      // Só caminho+regra (sem conteúdo) para diagnosticar sem vazar dados.
      logger.warn('Agent chat request rejected by validator', {
        issues: parsed.error.issues.slice(0, 10).map((i) => ({
          path: i.path.join('.'),
          code: i.code,
          message: i.message,
        })),
        messageCount: Array.isArray(req.body?.messages)
          ? req.body.messages.length
          : 'not-array',
      });
      throw new AppError(400, 'Invalid agent chat request');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const abort = new AbortController();
    res.on('close', () => abort.abort());

    const emit = (event: AgentEvent): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    await agentService.chat(parsed.data, emit, abort.signal);
    res.end();
  }
}

export const agentController = new AgentController();
