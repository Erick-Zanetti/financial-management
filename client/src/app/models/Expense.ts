import { Month } from './Month';
import { FinancialRelease } from './FinancialRelease';
import { FinancialReleaseType } from './FinancialReleaseType';
import { Person } from './Person';

export class Expense extends FinancialRelease {

  constructor(month: Month, value: number, name: string) {
    super(
      null,
      name,
      value,
      FinancialReleaseType.Expense,
      Person.ERICK,
      month.year,
      month.month,
      null
    );
  }
}
