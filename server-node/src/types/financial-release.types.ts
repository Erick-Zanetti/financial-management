export enum FinancialReleaseType {
  Receipt = 'R',
  Expense = 'E',
}

export interface IFinancialRelease {
  id?: string;
  name: string;
  value: number;
  type: FinancialReleaseType;
  category: unknown;
  person?: string;
  year: number;
  month: number;
  day: number;
  settled?: boolean;
}

export interface IFinancialReleaseFilter {
  type: FinancialReleaseType;
  month: number;
  year: number;
}

export interface IDashboardSummaryItem {
  year: number;
  month: number;
  type: FinancialReleaseType;
  categoryId: string;
  categoryName: string;
  categoryType: string;
  total: number;
  count: number;
}
