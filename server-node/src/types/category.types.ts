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
  allowAiIntegration?: boolean;
  description?: string;
  aiClassificationEnabled?: boolean;
  aiKeywords?: string[];
  aiPrompt?: string;
  dashboardSplitBySubcategories?: boolean;
  dashboardFallbackCategory?: unknown;
}
