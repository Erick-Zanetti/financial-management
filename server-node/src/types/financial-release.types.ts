export enum FinancialReleaseType {
  Receipt = 'R',
  Expense = 'E',
}

export enum Person {
  ERICK = 'ERICK',
  JULIA = 'JULIA',
}

export interface IFinancialRelease {
  id?: string;
  name: string;
  value: number;
  type: FinancialReleaseType;
  person: Person;
  year: number;
  month: number;
  day: number;
}

export interface IFinancialReleaseFilter {
  type: FinancialReleaseType;
  month: number;
  year: number;
}
