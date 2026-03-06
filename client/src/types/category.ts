export enum CategoryType {
  Receipt = 'R',
  Expense = 'E',
  Both = 'B',
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export type CreateCategory = Omit<Category, 'id'>;
export type UpdateCategory = Partial<CreateCategory>;
