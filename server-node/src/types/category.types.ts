export enum CategoryType {
  Receipt = 'R',
  Expense = 'E',
  Both = 'B',
}

export interface ICategory {
  id?: string;
  name: string;
  type: CategoryType;
  allowSubcategories?: boolean;
  subcategoryMode?: 'multi' | 'single';
  allowAiIntegration?: boolean;
  description?: string;
  aiClassificationEnabled?: boolean;
  aiKeywords?: string[];
  aiPrompt?: string;
  dashboardSplitBySubcategories?: boolean;
  dashboardFallbackCategory?: unknown;
  parents?: unknown[];
  allowDirectEntry?: boolean;
}
