import { Category, CategoryDocument } from '../models/category.model';
import { FinancialRelease } from '../models/financial-release.model';
import { CreateCategoryDto, UpdateCategoryDto } from '../validators/category.validator';
import { AppError } from '../middlewares/error-handler.middleware';
import { normalizeForMatch } from '../utils/slugify';

class CategoryService {
  async findAll(): Promise<CategoryDocument[]> {
    return Category.find().sort({ name: 1 });
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return Category.findById(id);
  }

  async findAiEnabled(): Promise<CategoryDocument[]> {
    return Category.find({ aiClassificationEnabled: true }).sort({ name: 1 });
  }

  async findByName(name: string): Promise<CategoryDocument | null> {
    const normalized = normalizeForMatch(name);
    const categories = await Category.find();
    return (
      categories.find((c) => normalizeForMatch(c.name) === normalized) ?? null
    );
  }

  private async validateHierarchy(
    parents: string[],
    selfId?: string,
  ): Promise<void> {
    if (parents.length === 0) return;

    if (selfId && parents.includes(selfId)) {
      throw new AppError(400, 'Category cannot be its own parent');
    }

    const parentDocs = await Category.find({ _id: { $in: parents } });
    if (parentDocs.length !== parents.length) {
      throw new AppError(400, 'One or more parent categories do not exist');
    }
    if (parentDocs.some((p) => (p.parents ?? []).length > 0)) {
      throw new AppError(400, 'A parent category cannot have its own parent');
    }

    if (selfId && (await Category.exists({ parents: selfId }))) {
      throw new AppError(400, 'A category with children cannot have a parent');
    }
  }

  async create(data: CreateCategoryDto): Promise<CategoryDocument> {
    if (data.parents?.length) {
      await this.validateHierarchy(data.parents);
    }
    return new Category(data).save();
  }

  async update(
    id: string,
    data: UpdateCategoryDto,
  ): Promise<CategoryDocument | null> {
    if (data.parents !== undefined && data.parents.length > 0) {
      await this.validateHierarchy(data.parents, id);
    }
    return Category.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<CategoryDocument | null> {
    const inUseCount = await FinancialRelease.countDocuments({
      $or: [{ category: id }, { 'subcategories.category': id }],
    });
    const fallbackUseCount = await Category.countDocuments({
      dashboardFallbackCategory: id,
    });
    if (inUseCount > 0 || fallbackUseCount > 0) {
      throw new AppError(409, 'Cannot delete category that is in use');
    }
    const deleted = await Category.findByIdAndDelete(id);
    if (deleted) {
      await Category.updateMany({ parents: id }, { $pull: { parents: id } });
    }
    return deleted;
  }
}

export const categoryService = new CategoryService();
