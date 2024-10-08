import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID, ViewChild } from "@angular/core";
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
  ],
})
export class BarChartComponent implements OnInit {
  isBrowser: boolean = false;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: false,
    plugins: {
      legend: {
        display: true,
      },
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [''],
    datasets: [
      { data: [], label: 'Receitas', backgroundColor: ['#4caf50'], hoverBackgroundColor: ['#43a047'], borderColor: ['#43a047'] },
      { data: [], label: 'Despesas', backgroundColor: ['#f44336'], hoverBackgroundColor: ['#e53935'], borderColor: ['#e53935'] }
    ]
  };

  @Input()
  set receipts(receipts: number) {
    this.barChartData.datasets[0].data[0] = receipts;
    this.chart?.update();
  }

  @Input()
  set expenses(expenses: number) {
    this.barChartData.datasets[1].data[0] = expenses;
    this.chart?.update();
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
}
