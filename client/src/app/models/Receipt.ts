import { Month } from './Month';
import { FinancialRelease } from './FinancialRelease';
import { FinancialReleaseType } from './FinancialReleaseType';
import { Person } from './Person';

export class Receipt extends FinancialRelease {

    constructor(month: Month, value: number, name: string) {
        super(
          null,
            name,
            value,
            FinancialReleaseType.Receipt,
          Person.ERICK,
            month.year,
            month.month,
            null
        );
    }
}
