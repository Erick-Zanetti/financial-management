export enum CategoryType {
  Receipt = 'R',
  Expense = 'E',
  Both = 'B',
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  allowSubcategories?: boolean;
  allowAiIntegration?: boolean;
  description?: string;
  aiClassificationEnabled?: boolean;
  aiKeywords?: string[];
  aiPrompt?: string;
  dashboardSplitBySubcategories?: boolean;
  dashboardFallbackCategory?: string | null;
}

export type CreateCategory = Omit<Category, 'id'>;
export type UpdateCategory = Partial<CreateCategory>;
