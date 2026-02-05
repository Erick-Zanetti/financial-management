import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FinancialRelease } from './../../models/FinancialRelease';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class ListComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  displayedColumns: string[] = ['day', 'name', 'person', 'value', 'action'];
  dataSource: MatTableDataSource<FinancialRelease>;

  private _list!: FinancialRelease[];

  @Input()
  set list(list: FinancialRelease[]) {
    this._list = list;
    this.dataSource = new MatTableDataSource(this._list);
    this.applyPersonFilter();
    this.dataSource.sort = this.sort;
  }

  @Input()
  title!: string;

  @Input()
  person: string = '';

  @Output()
  onAdd = new EventEmitter();

  @Output()
  onEdit = new EventEmitter();

  @Output()
  onRemove = new EventEmitter();

  constructor() {
    this.dataSource = new MatTableDataSource(this._list || []);
    this.dataSource.filterPredicate = this.filterByPerson;
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person'] && !changes['person'].firstChange) {
      this.applyPersonFilter();
    }
  }

  ngAfterViewInit() {
    this.sort.sort({ id: 'day', start: 'asc', disableClear: false });
    this.dataSource.sort = this.sort;
  }

  getTotalCost() {
    return this.dataSource.filteredData
      .map(t => t.value)
      .reduce((acc, value) => acc + value, 0);
  }

  add() {
    this.onAdd.emit();
  }

  edit(row: FinancialRelease) {
    this.onEdit.emit(row);
  }

  remove(row: FinancialRelease) {
    this.onRemove.emit(row.id);
  }

  private filterByPerson(data: FinancialRelease, filter: string): boolean {
    if (!filter) return true;
    return data.person.toLowerCase().includes(filter.toLowerCase());
  }

  private applyPersonFilter() {
    this.dataSource.filter = this.person || '';
  }
}
