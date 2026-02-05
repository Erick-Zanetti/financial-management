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
    return FinancialRelease.find().sort({ year: -1, month: -1, day: -1 });
  }

  async findById(id: string): Promise<FinancialReleaseDocument | null> {
    return FinancialRelease.findById(id);
  }

  async findByTypeAndMonthAndYear(
    filter: FilterByTypeDto,
  ): Promise<FinancialReleaseDocument[]> {
    return FinancialRelease.find({
      type: filter.type,
      month: filter.month,
      year: filter.year,
    }).sort({ day: 1 });
  }

  async create(
    data: CreateFinancialReleaseDto,
  ): Promise<FinancialReleaseDocument> {
    return new FinancialRelease(data).save();
  }

  async update(
    id: string,
    data: UpdateFinancialReleaseDto,
  ): Promise<FinancialReleaseDocument | null> {
    return FinancialRelease.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await FinancialRelease.findByIdAndDelete(id);
    return result !== null;
  }
}

export const financialReleaseService = new FinancialReleaseService();
