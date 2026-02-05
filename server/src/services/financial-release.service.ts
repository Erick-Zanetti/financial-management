import { FinancialReleaseModel, type IFinancialReleaseDocument } from '../models/financial-release.model.js';
import type { FinancialReleaseTypeEnum } from '../types/financial-release.types.js';
import type { FinancialReleaseInput, FinancialReleaseUpdateInput } from '../validators/financial-release.validator.js';

export class FinancialReleaseService {
  async findAll(): Promise<IFinancialReleaseDocument[]> {
    return FinancialReleaseModel.find().exec();
  }

  async findById(id: string): Promise<IFinancialReleaseDocument | null> {
    return FinancialReleaseModel.findById(id).exec();
  }

  async findByTypeAndMonthAndYear(
    type: FinancialReleaseTypeEnum,
    month: number,
    year: number
  ): Promise<IFinancialReleaseDocument[]> {
    return FinancialReleaseModel.find({ type, month, year }).exec();
  }

  async create(data: FinancialReleaseInput): Promise<IFinancialReleaseDocument> {
    const release = new FinancialReleaseModel(data);
    return release.save();
  }

  async update(id: string, data: FinancialReleaseUpdateInput): Promise<IFinancialReleaseDocument | null> {
    return FinancialReleaseModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await FinancialReleaseModel.findByIdAndDelete(id).exec();
  }
}

export const financialReleaseService = new FinancialReleaseService();
