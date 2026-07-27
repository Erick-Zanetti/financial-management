import { Types } from 'mongoose';
import {
  FinancialRelease,
  FinancialReleaseDocument,
} from '../models/financial-release.model';
import { Category } from '../models/category.model';
import {
  CreateFinancialReleaseDto,
  UpdateFinancialReleaseDto,
  FilterByTypeDto,
  DashboardFilterDto,
} from '../validators/financial-release.validator';
import { IDashboardSummaryItem } from '../types/financial-release.types';
import { logger } from '../config/logger.config';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface LeanCategoryInfo {
  _id: Types.ObjectId;
  name: string;
  type?: string;
  allowSubcategories?: boolean;
  dashboardSplitBySubcategories?: boolean;
  dashboardFallbackCategory?: Types.ObjectId | null;
  parents?: Types.ObjectId[];
}

interface LeanReleaseForSummary {
  year: number;
  month: number;
  type: string;
  value: number;
  category?: Types.ObjectId | null;
  subcategories?: Array<{ category?: Types.ObjectId | null; value: number }>;
}

export class FinancialReleaseService {
  async findAll(): Promise<FinancialReleaseDocument[]> {
    return FinancialRelease.find().populate([
      { path: 'category', select: 'name allowSubcategories allowAiIntegration' },
      { path: 'subcategories.category', select: 'name' },
    ]).sort({ year: -1, month: -1, day: -1 });
  }

  async findById(id: string): Promise<FinancialReleaseDocument | null> {
    return FinancialRelease.findById(id).populate([
      { path: 'category', select: 'name allowSubcategories allowAiIntegration' },
      { path: 'subcategories.category', select: 'name' },
    ]);
  }

  async findByTypeAndMonthAndYear(
    filter: FilterByTypeDto,
  ): Promise<FinancialReleaseDocument[]> {
    return FinancialRelease.find({
      type: filter.type,
      month: filter.month,
      year: filter.year,
    }).populate([
      { path: 'category', select: 'name allowSubcategories allowAiIntegration' },
      { path: 'subcategories.category', select: 'name' },
    ]).sort({ day: 1 });
  }

  private async linkSubcategoryParents(
    categoryId: string,
    subcategories: Array<{ category?: unknown }> | undefined,
  ): Promise<void> {
    try {
      if (!categoryId) return;
      const subIds = [
        ...new Set(
          (subcategories ?? [])
            .map((s) => (s.category ? String(s.category) : ''))
            .filter((id) => id && id !== categoryId),
        ),
      ];
      if (subIds.length === 0) return;

      const docs = await Category.find({ _id: { $in: [categoryId, ...subIds] } })
        .select('parents name')
        .lean<LeanCategoryInfo[]>();
      const byId = new Map(docs.map((d) => [String(d._id), d]));

      const releaseCategory = byId.get(categoryId);
      if ((releaseCategory?.parents ?? []).length > 0) {
        logger.warn(
          `Cannot auto-link subcategories: category "${releaseCategory?.name}" is itself a child`,
        );
        return;
      }

      const subsThatAreParents = new Set(
        (
          await Category.find({ parents: { $in: subIds } })
            .select('parents')
            .lean<Array<{ parents?: unknown[] }>>()
        )
          .flatMap((c) => (c.parents ?? []).map(String))
          .filter((p) => subIds.includes(p)),
      );

      for (const subId of subIds) {
        const sub = byId.get(subId);
        if (!sub) continue;
        if ((sub.parents ?? []).some((p) => String(p) === categoryId)) continue;
        if (subsThatAreParents.has(subId)) {
          logger.warn(
            `Cannot auto-link "${sub.name}" under "${releaseCategory?.name}": it has children of its own`,
          );
          continue;
        }
        await Category.updateOne(
          { _id: subId },
          { $addToSet: { parents: categoryId } },
        );
        logger.info(
          `Auto-linked category "${sub.name}" as child of "${releaseCategory?.name}"`,
        );
      }
    } catch (error) {
      logger.warn(`Failed to auto-link subcategory parents: ${String(error)}`);
    }
  }

  async create(
    data: CreateFinancialReleaseDto,
  ): Promise<FinancialReleaseDocument> {
    const release = await new FinancialRelease(data).save();
    await this.linkSubcategoryParents(data.category, data.subcategories);
    return release.populate([
      { path: 'category', select: 'name allowSubcategories allowAiIntegration' },
      { path: 'subcategories.category', select: 'name' },
    ]);
  }

  async update(
    id: string,
    data: UpdateFinancialReleaseDto,
  ): Promise<FinancialReleaseDocument | null> {
    const updated = await FinancialRelease.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate([
      { path: 'category', select: 'name allowSubcategories allowAiIntegration' },
      { path: 'subcategories.category', select: 'name' },
    ]);
    if (updated && data.subcategories?.length) {
      // updated.category is populated at this point; fall back to its _id.
      const populated = updated.category as { _id?: unknown } | null;
      const categoryId =
        data.category ?? (populated?._id ? String(populated._id) : '');
      await this.linkSubcategoryParents(categoryId, data.subcategories);
    }
    return updated;
  }

  async findAvailableMonths(): Promise<{ year: number; month: number }[]> {
    return FinancialRelease.aggregate([
      { $group: { _id: { year: '$year', month: '$month' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month' } },
    ]);
  }

  async getDashboardSummary(filter: DashboardFilterDto): Promise<IDashboardSummaryItem[]> {
    const fromYM = filter.fromYear * 100 + filter.fromMonth;
    const toYM = filter.toYear * 100 + filter.toMonth;

    return FinancialRelease.aggregate([
      {
        $addFields: {
          yearMonth: { $add: [{ $multiply: ['$year', 100] }, '$month'] },
        },
      },
      {
        $match: {
          yearMonth: { $gte: fromYM, $lte: toYM },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            type: '$type',
            categoryId: '$category',
            categoryName: { $ifNull: ['$categoryInfo.name', 'Sem categoria'] },
            categoryType: { $ifNull: ['$categoryInfo.type', 'B'] },
          },
          total: { $sum: '$value' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.type': 1, '_id.categoryName': 1 },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          type: '$_id.type',
          categoryId: { $toString: '$_id.categoryId' },
          categoryName: '$_id.categoryName',
          categoryType: '$_id.categoryType',
          total: 1,
          count: 1,
        },
      },
    ]);
  }

  async getDashboardSummarySegmented(
    filter: DashboardFilterDto,
  ): Promise<IDashboardSummaryItem[]> {
    const fromYM = filter.fromYear * 100 + filter.fromMonth;
    const toYM = filter.toYear * 100 + filter.toMonth;

    const releases: LeanReleaseForSummary[] = await FinancialRelease.aggregate([
      {
        $addFields: {
          yearMonth: { $add: [{ $multiply: ['$year', 100] }, '$month'] },
        },
      },
      {
        $match: {
          yearMonth: { $gte: fromYM, $lte: toYM },
        },
      },
    ]);

    const categories = await Category.find().lean<LeanCategoryInfo[]>();
    const categoryById = new Map(categories.map((c) => [String(c._id), c]));

    const buckets = new Map<string, { total: number; count: number }>();
    const warnedCategories = new Set<string>();

    const addTo = (
      year: number,
      month: number,
      type: string,
      categoryId: string,
      value: number,
    ) => {
      const key = `${year}|${month}|${type}|${categoryId}`;
      const bucket = buckets.get(key) ?? { total: 0, count: 0 };
      bucket.total = round2(bucket.total + value);
      bucket.count += 1;
      buckets.set(key, bucket);
    };

    for (const release of releases) {
      const categoryId = release.category ? String(release.category) : '';
      const category = categoryById.get(categoryId);

      const splitEnabled =
        category?.dashboardSplitBySubcategories === true &&
        category?.allowSubcategories === true;

      if (!splitEnabled) {
        addTo(release.year, release.month, release.type, categoryId, release.value);
        continue;
      }

      const fallbackId = category?.dashboardFallbackCategory
        ? String(category.dashboardFallbackCategory)
        : '';
      let effectiveFallbackId = fallbackId;
      if (!fallbackId || !categoryById.has(fallbackId)) {
        effectiveFallbackId = categoryId;
        if (!warnedCategories.has(categoryId)) {
          warnedCategories.add(categoryId);
          logger.warn(
            `Category "${category?.name}" has dashboard segmentation enabled but no valid fallback category; using the category itself`,
          );
        }
      }

      const subs = release.subcategories ?? [];
      let subsSum = 0;
      for (const sub of subs) {
        const subCategoryId = sub.category ? String(sub.category) : effectiveFallbackId;
        subsSum = round2(subsSum + sub.value);
        addTo(release.year, release.month, release.type, subCategoryId, sub.value);
      }

      const remainder = round2(release.value - subsSum);
      if (Math.abs(remainder) >= 0.01) {
        addTo(release.year, release.month, release.type, effectiveFallbackId, remainder);
      }
    }

    const items: IDashboardSummaryItem[] = [];
    for (const [key, bucket] of buckets.entries()) {
      const [year, month, type, categoryId] = key.split('|');
      const category = categoryById.get(categoryId);
      items.push({
        year: Number(year),
        month: Number(month),
        type: type as IDashboardSummaryItem['type'],
        categoryId,
        categoryName: category?.name ?? 'Sem categoria',
        categoryType: category?.type ?? 'B',
        total: bucket.total,
        count: bucket.count,
      });
    }

    items.sort(
      (a, b) =>
        a.year - b.year ||
        a.month - b.month ||
        a.type.localeCompare(b.type) ||
        a.categoryName.localeCompare(b.categoryName),
    );

    return items;
  }

  async delete(id: string): Promise<boolean> {
    const result = await FinancialRelease.findByIdAndDelete(id);
    return result !== null;
  }
}

export const financialReleaseService = new FinancialReleaseService();
