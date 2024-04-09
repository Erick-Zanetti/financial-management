import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxTimelineEvent, NgxTimelineItemPosition, NgxTimelineModule } from '@frxjs/ngx-timeline';
import { FinancialRelease } from '../../models/FinancialRelease';
import { Month } from '../../models/Month';
import { MainService } from '../../services/main.service';

@Component({
  selector: 'app-timeline',
  templateUrl: 'timeline.component.html',
  styleUrls: ['timeline.component.scss'],
  standalone: true,
  imports: [
    NgxTimelineModule,
    CommonModule
  ],
  providers: [
    CurrencyPipe
  ]
})

export class TimelineComponent implements OnInit {
  releases: FinancialRelease[] = [];

  events: NgxTimelineEvent[] = []

  private _month!: Month;
  @Input()
  set month(month: Month) {
    this._month = month;
    this.releases = [];
    this.searc();
  }

  constructor(
    private mainService: MainService,
    private currencyPipe: CurrencyPipe,
  ) { }

  ngOnInit() { }

  searc() {
    this.mainService.getReceipts(this._month.month, this._month.year).subscribe(res => {
      this.releases = this.releases.concat(res);
      this.mainService.getExpenses(this._month.month, this._month.year).subscribe(res => {
        this.releases = this.releases.concat(res);
        this.convertItens();
      });
    });
  }

  convertItens() {
    this.releases.forEach(item => {
      item.date = new Date(this._month.year, this._month.month, item.day);
    });
    this.releases.sort((a, b) => {
      if (a.date && b.date) {
        return a.date.getTime() - b.date.getTime()
      }
      return 0;
    });
    this.events = this.releases.map(item => {
      return {
        description: this.currencyPipe.transform(item.value, 'BRL', 'symbol', '1.2-2') + '',
        id: item.id,
        itemPosition: item.type === 'E' ? NgxTimelineItemPosition.ON_RIGHT : NgxTimelineItemPosition.ON_LEFT,
        title: item.name,
        timestamp: item.date,
      }
    });
  }

  getTotalUnitNow(item: NgxTimelineEvent) {
    let achou = false;
    const items = this.releases.filter(i => {
      if (i.id === item.id) {
        achou = true;
        return true;
      }
      return !achou;
    });

    return items.reduce((a, b) => {
      if (b.type === 'E') {
        return a - b.value;
      }
      return a + b.value;
    }, 0);
  }
}
