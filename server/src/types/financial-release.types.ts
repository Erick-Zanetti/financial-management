export const FinancialReleaseType = {
  R: 'R',
  E: 'E',
} as const;

export type FinancialReleaseTypeEnum = (typeof FinancialReleaseType)[keyof typeof FinancialReleaseType];

export const Person = {
  ERICK: 'ERICK',
  JULIA: 'JULIA',
} as const;

export type PersonEnum = (typeof Person)[keyof typeof Person];

export interface IFinancialRelease {
  id: string;
  name: string;
  value: number;
  type: FinancialReleaseTypeEnum;
  person: PersonEnum;
  year: number;
  month: number;
  day: number;
}

export interface IFinancialReleaseInput {
  name: string;
  value: number;
  type: FinancialReleaseTypeEnum;
  person: PersonEnum;
  year: number;
  month: number;
  day: number;
}
