export enum FinancialReleaseType {
  Receipt = 'R',
  Expense = 'E'
}

export enum Person {
  ERICK = 'ERICK',
  JULIA = 'JULIA'
}

export interface FinancialRelease {
  id: string | null;
  name: string;
  value: number;
  type: FinancialReleaseType;
  person: Person;
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

export type CreateFinancialRelease = Omit<FinancialRelease, 'id'>;
export type UpdateFinancialRelease = Partial<CreateFinancialRelease>;
