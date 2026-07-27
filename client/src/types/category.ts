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
  subcategoryMode?: 'multi' | 'single';
  allowAiIntegration?: boolean;
  description?: string;
  aiClassificationEnabled?: boolean;
  aiKeywords?: string[];
  aiPrompt?: string;
  dashboardSplitBySubcategories?: boolean;
  dashboardFallbackCategory?: string | null;
  parents?: string[];
  allowDirectEntry?: boolean;
}

export type CreateCategory = Omit<Category, 'id'>;
export type UpdateCategory = Partial<CreateCategory>;
