import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { FlowComponent } from './components/flow/flow.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { Month } from './models/Month';
import { monthLabelPipe } from './pipes/month-label/month-label.pipe';
import { SubTabService } from './services/subtab.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatTabsModule,
    MatToolbarModule,
    monthLabelPipe,
    FlowComponent,
    TimelineComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  months: Month[] = [];

  constructor(
    public subTabService: SubTabService,
  ) { }

  ngOnInit() {
    this.genearetaMonths();
  }

  genearetaMonths() {
    let today = new Date();
    const months = [];
    today.setMonth(today.getMonth() - 1);
    for (let counter = 0; counter <= 13; counter++) {
      months.push({
        year: today.getFullYear(),
        month: today.getMonth() + 1
      });
      today = new Date(today.getFullYear(), today.getMonth() + 1);
    }
    this.months = months;
  }
}
