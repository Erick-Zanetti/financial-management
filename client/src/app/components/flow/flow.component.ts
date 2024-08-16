import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FlexLayoutServerModule } from '@angular/flex-layout/server';
import { MatButton } from "@angular/material/button";
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { ListComponent } from '../list/list.component';
import { ModalReleaseComponentDialog } from '../modal-release/modal-release.component';
import { ModalReleasesParcelComponent } from '../modal-releases-parcel/modal-releases-parcel.component';
import { PieChartComponent } from '../pie-chart/pie-chart.component';
import { Expense } from './../../models/Expense';
import { FinancialRelease } from './../../models/FinancialRelease';
import { FinancialReleaseType } from './../../models/FinancialReleaseType';
import { Month } from './../../models/Month';
import { Receipt } from './../../models/Receipt';
import { MainService } from './../../services/main.service';
import { ModalConfirmationComponentDialog } from './../modal-confirmation/modal-confirmation.component';

@Component({
  selector: 'app-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ListComponent,
    FlexLayoutModule,
    FlexLayoutServerModule,
    ModalReleaseComponentDialog,
    PieChartComponent,
    BarChartComponent,
    MatSnackBarModule,
    ModalConfirmationComponentDialog,
    MatButton
  ],
})
export class FlowComponent implements OnInit {

  expenses: Expense[] = [];
  receipts: Receipt[] = [];

  private _month!: Month;
  @Input()
  set month(month: Month) {
    this._month = month;
    this.searc();
  }

  constructor(
    private mainService: MainService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ) {

  }

  ngOnInit() {
  }

  searc() {
    this.mainService.getExpenses(this._month.month, this._month.year).subscribe(res => this.expenses = res || []);
    this.mainService.getReceipts(this._month.month, this._month.year).subscribe(res => this.receipts = res || []);
  }

  getBalance(): number {
    return this.sumList(this.receipts) - this.sumList(this.expenses);
  }

  private sumList(list: FinancialRelease[]): number {
    return list.map(t => t?.value).reduce((acc, value) => acc + value, 0);
  }

  newReceipt() {
    this.openModalReleaseComponentDialog(true, FinancialReleaseType.Receipt);
  }

  editReceipt(receipt: Receipt) {
    this.openModalReleaseComponentDialog(false, FinancialReleaseType.Receipt, receipt);
  }

  newExpense() {
    this.openModalReleaseComponentDialog(true, FinancialReleaseType.Expense);
  }

  editExpense(expense: Expense) {
    this.openModalReleaseComponentDialog(false, FinancialReleaseType.Expense, expense);
  }

  private openModalReleaseComponentDialog(isNew: boolean, type: FinancialReleaseType, release?: FinancialRelease) {
    const dialogRef = this.dialog.open(ModalReleaseComponentDialog, {
      width: '320px',
      data: {
        new: isNew,
        type: type,
        release: JSON.parse(JSON.stringify(release || {})),
        month: this._month,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.searc();
      }
    });
  }

  getTotalExpenses() {
    return this.expenses.map(t => t.value).reduce((acc, value) => acc + value, 0);
  }

  getTotalReceipts() {
    return this.receipts.map(t => t.value).reduce((acc, value) => acc + value, 0);
  }

  remove(id: string) {
    const dialogRef = this.dialog.open(ModalConfirmationComponentDialog, {
      width: '320px',
      data: {
        title: 'Deseja realmente remover esse lançamento ? '
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.mainService.remove(id).subscribe({
          complete: () => {
            this._snackBar.open('Lançamento removido com sucesso!', '', {
              duration: 5000
            });
            this.searc();
          },
          error: (error) => {
            this._snackBar.open('Falha ao remover. Tente novamente', 'X', {
              duration: 5000
            });
          }
        });
      }
    });
  }

  exportData() {
    this.mainService.exportData(this._month.month, this._month.year).subscribe({
      next: (res: any) => {
        this._snackBar.open('Gerando o arquivo, será enviado para seu email', 'X', {
          duration: 5000
        });
      },
      error: (error: any) => {
        this._snackBar.open('Falha ao exportar. Tente novamente', 'X', {
          duration: 5000
        });
      }
    });
  }

  addAll() {
    const dialogRef = this.dialog.open(ModalReleasesParcelComponent, {
      width: '320px',
      data: {
        month: this._month,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.searc();
      }
    });
  }
}
