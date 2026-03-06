export interface Category {
  id: string;
  name: string;
}

export type CreateCategory = Omit<Category, 'id'>;
export type UpdateCategory = Partial<CreateCategory>;
