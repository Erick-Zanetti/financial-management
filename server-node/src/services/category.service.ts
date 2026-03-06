import { Category, CategoryDocument } from '../models/category.model';
import { FinancialRelease } from '../models/financial-release.model';
import { CreateCategoryDto, UpdateCategoryDto } from '../validators/category.validator';
import { AppError } from '../middlewares/error-handler.middleware';

class CategoryService {
  async findAll(): Promise<CategoryDocument[]> {
    return Category.find().sort({ name: 1 });
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return Category.findById(id);
  }

  async create(data: CreateCategoryDto): Promise<CategoryDocument> {
    return new Category(data).save();
  }

  async update(
    id: string,
    data: UpdateCategoryDto,
  ): Promise<CategoryDocument | null> {
    return Category.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<CategoryDocument | null> {
    const inUseCount = await FinancialRelease.countDocuments({ category: id });
    if (inUseCount > 0) {
      throw new AppError(409, 'Cannot delete category that is in use');
    }
    return Category.findByIdAndDelete(id);
  }
}

export const categoryService = new CategoryService();
