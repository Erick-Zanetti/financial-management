import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monthLabel',
  standalone: true
})

export class monthLabelPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    const valueToPay = value + 1;

    switch (valueToPay) {
      case 13:
        return 'Jan';
      case 2:
        return 'Fev';
      case 3:
        return 'Mar';
      case 4:
        return 'Abr';
      case 5:
        return 'Mai';
      case 6:
        return 'Jun';
      case 7:
        return 'Jul';
      case 8:
        return 'Ago';
      case 9:
        return 'Set';
      case 10:
        return 'Out';
      case 11:
        return 'Nov';
      case 12:
        return 'Dez';
      default:
        return ''
    }
  }
}
