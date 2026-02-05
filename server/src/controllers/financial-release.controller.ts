import type { Request, Response } from 'express';
import { financialReleaseService } from '../services/financial-release.service.js';
import {
  financialReleaseSchema,
  financialReleaseUpdateSchema,
  queryByTypeSchema,
} from '../validators/financial-release.validator.js';
import { ZodError } from 'zod';

const formatZodError = (error: ZodError) => {
  return error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
};

export class FinancialReleaseController {
  async findAll(_req: Request, res: Response): Promise<void> {
    const releases = await financialReleaseService.findAll();
    res.json(releases);
  }

  async findById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const release = await financialReleaseService.findById(id);

    if (!release) {
      res.status(404).json({ error: 'Financial release not found' });
      return;
    }

    res.json(release);
  }

  async findByType(req: Request, res: Response): Promise<void> {
    const validation = queryByTypeSchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({ errors: formatZodError(validation.error) });
      return;
    }

    const { type, month, year } = validation.data;
    const releases = await financialReleaseService.findByTypeAndMonthAndYear(type, month, year);
    res.json(releases);
  }

  async create(req: Request, res: Response): Promise<void> {
    const validation = financialReleaseSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ errors: formatZodError(validation.error) });
      return;
    }

    const release = await financialReleaseService.create(validation.data);
    res.json(release);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const validation = financialReleaseUpdateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ errors: formatZodError(validation.error) });
      return;
    }

    const release = await financialReleaseService.update(id, validation.data);

    if (!release) {
      res.status(404).json({ error: 'Financial release not found' });
      return;
    }

    res.json(release);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await financialReleaseService.delete(id);
    res.status(200).send();
  }
}

export const financialReleaseController = new FinancialReleaseController();
