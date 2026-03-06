export enum FinancialReleaseType {
  Receipt = 'R',
  Expense = 'E'
}

export interface FinancialRelease {
  id: string | null;
  name: string;
  value: number;
  type: FinancialReleaseType;
  category: { id: string; name: string };
  person?: string;
  year: number;
  month: number;
  day: number;
  date?: Date;
  settled?: boolean;
}

export interface Month {
  year: number;
  month: number;
}

export interface DashboardSummaryItem {
  year: number;
  month: number;
  type: FinancialReleaseType;
  categoryId: string;
  categoryName: string;
  categoryType: string;
  total: number;
  count: number;
}

export type CreateFinancialRelease = Omit<FinancialRelease, 'id' | 'category'> & { category: string };
export type UpdateFinancialRelease = Partial<CreateFinancialRelease>;
