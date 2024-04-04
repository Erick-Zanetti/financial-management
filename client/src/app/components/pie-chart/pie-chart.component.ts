import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID, ViewChild } from "@angular/core";
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from './../../../../node_modules/chart.js/dist/types/index.d';
import { FinancialRelease } from './../../models/FinancialRelease';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective
  ],
})
export class PieChartComponent implements OnInit {
  isBrowser: boolean = false;

  private colors = [
    '#7986cb',
    '#4fc3f7',
    '#e57373',
    '#4db6ac',
    '#ba68c8',
    '#f06292',
    '#9575cd',
    '#4dd0e1',
    '#81c784',
    '#dce775',
    '#aed581',
    '#fff176',
    '#ffb74d',
    '#ffd54f',
    '#64b5f6',
    '#ff8a65'
  ];

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  public pieChartType: ChartType = 'pie';
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'left',
      },
    }
  };

  public pieChartData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.colors,
      hoverBackgroundColor: this.colors,
      hoverBorderColor: this.colors,
    }]
  };

  @Input()
  set list(list: FinancialRelease[]) {
    this.pieChartData.labels = list.map(i => i.name);
    this.pieChartData.datasets[0].data = list.map(i => i.value);
    this.chart?.update();
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
}
