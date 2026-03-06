import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validator';

export class CategoryController {
  async findAll(_req: Request, res: Response): Promise<void> {
    const categories = await categoryService.findAll();
    res.json(categories);
  }

  async findById(req: Request, res: Response): Promise<void> {
    const category = await categoryService.findById(req.params.id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json(category);
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = createCategorySchema.parse(req.body);
    const category = await categoryService.create(data);
    res.json(category);
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(req.params.id, data);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json(category);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const deleted = await categoryService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.status(200).send();
  }
}

export const categoryController = new CategoryController();
