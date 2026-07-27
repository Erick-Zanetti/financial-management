import { Request, Response } from 'express';
import { agentChatSchema } from '../validators/agent.validator';
import { agentService } from '../services/agent/agent.service';
import { AgentEvent } from '../services/agent/agent.types';
import { AppError } from '../middlewares/error-handler.middleware';

class AgentController {
  async chat(req: Request, res: Response): Promise<void> {
    const parsed = agentChatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid agent chat request');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const emit = (event: AgentEvent): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    await agentService.chat(parsed.data, emit);
    res.end();
  }
}

export const agentController = new AgentController();
