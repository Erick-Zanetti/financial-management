import { FinancialReleaseType } from './FinancialReleaseType';
import { Person } from './Person';

export class FinancialRelease {
  id: string | null
  name: string;
  value: number;
  type: FinancialReleaseType;
  person: Person;
  year: number;
  month: number;
  day: number;

  date?: Date;

  constructor(
    id: string | null,
    name: string,
    value: number,
    type: FinancialReleaseType,
    person: Person,
    year: number,
    month: number,
    day: number | null
  ) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.type = type;
    this.person = person;
    this.year = year;
    this.month = month;
    this.day = day || 1;
  }
}
