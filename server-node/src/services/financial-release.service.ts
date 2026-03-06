import {
  FinancialRelease,
  FinancialReleaseDocument,
} from '../models/financial-release.model';
import {
  CreateFinancialReleaseDto,
  UpdateFinancialReleaseDto,
  FilterByTypeDto,
} from '../validators/financial-release.validator';

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

  async delete(id: string): Promise<boolean> {
    const result = await FinancialRelease.findByIdAndDelete(id);
    return result !== null;
  }
}

export const financialReleaseService = new FinancialReleaseService();
