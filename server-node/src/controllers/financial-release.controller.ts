import { Request, Response } from 'express';
import { financialReleaseService } from '../services/financial-release.service';
import {
  createFinancialReleaseSchema,
  updateFinancialReleaseSchema,
  filterByTypeSchema,
} from '../validators/financial-release.validator';

export class FinancialReleaseController {
  async findAll(_req: Request, res: Response): Promise<void> {
    const releases = await financialReleaseService.findAll();
    res.json(releases);
  }

  async findById(req: Request, res: Response): Promise<void> {
    const release = await financialReleaseService.findById(req.params.id);

    if (!release) {
      res.status(404).json({ message: 'Financial release not found' });
      return;
    }

    res.json(release);
  }

  async findByType(req: Request, res: Response): Promise<void> {
    const filter = filterByTypeSchema.parse(req.query);
    const releases =
      await financialReleaseService.findByTypeAndMonthAndYear(filter);
    res.json(releases);
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = createFinancialReleaseSchema.parse(req.body);
    const release = await financialReleaseService.create(data);
    res.json(release);
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = updateFinancialReleaseSchema.parse(req.body);
    const release = await financialReleaseService.update(req.params.id, data);

    if (!release) {
      res.status(404).json({ message: 'Financial release not found' });
      return;
    }

    res.json(release);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const deleted = await financialReleaseService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Financial release not found' });
      return;
    }

    res.status(200).send();
  }
}

export const financialReleaseController = new FinancialReleaseController();
