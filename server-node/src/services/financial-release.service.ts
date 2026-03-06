import {
  FinancialRelease,
  FinancialReleaseDocument,
} from '../models/financial-release.model';
import {
  CreateFinancialReleaseDto,
  UpdateFinancialReleaseDto,
  FilterByTypeDto,
  DashboardFilterDto,
} from '../validators/financial-release.validator';
import { IDashboardSummaryItem } from '../types/financial-release.types';

export class FinancialReleaseService {
  async findAll(): Promise<FinancialReleaseDocument[]> {
    return FinancialRelease.find().populate('category', 'name').sort({ year: -1, month: -1, day: -1 });
  }

  async findById(id: string): Promise<FinancialReleaseDocument | null> {
    return FinancialRelease.findById(id).populate('category', 'name');
  }

  async findByTypeAndMonthAndYear(
    filter: FilterByTypeDto,
  ): Promise<FinancialReleaseDocument[]> {
    return FinancialRelease.find({
      type: filter.type,
      month: filter.month,
      year: filter.year,
    }).populate('category', 'name').sort({ day: 1 });
  }

  async create(
    data: CreateFinancialReleaseDto,
  ): Promise<FinancialReleaseDocument> {
    const release = await new FinancialRelease(data).save();
    return release.populate('category', 'name');
  }

  async update(
    id: string,
    data: UpdateFinancialReleaseDto,
  ): Promise<FinancialReleaseDocument | null> {
    return FinancialRelease.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('category', 'name');
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
          total: 1,
          count: 1,
        },
      },
    ]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await FinancialRelease.findByIdAndDelete(id);
    return result !== null;
  }
}

export const financialReleaseService = new FinancialReleaseService();
