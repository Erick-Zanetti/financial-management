import { FinancialReleaseType } from './FinancialReleaseType';

export class FinancialRelease {
  id: string | null
  name: string;
  value: number;
  type: FinancialReleaseType;
  year: number;
  month: number;
  day: number;

  date?: Date;

  constructor(
    id: string | null,
    name: string,
    value: number,
    type: FinancialReleaseType,
    year: number,
    month: number,
    day: number | null
  ) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.type = type;
    this.year = year;
    this.month = month;
    this.day = day || 1;
  }
}
