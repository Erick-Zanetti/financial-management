import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FlexLayoutModule } from '@angular/flex-layout';
import { FlexLayoutServerModule } from '@angular/flex-layout/server';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule, NativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import moment from "moment";
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { FinancialRelease } from '../../models/FinancialRelease';
import { monthLabelPipe } from '../../pipes/month-label/month-label.pipe';
import { MainService } from '../../services/main.service';

class ModalReleaseModuleDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    return moment(date).format('DD MMM');
  }
}

@Component({
  selector: 'app-modal-releases-parcel',
  templateUrl: 'modal-releases-parcel.component.html',
  styles: [`
    ::ng-deep {
      .without-monthyear {
        .mat-calendar-controls {
          display: none;
        }
      }
    }
    `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    FlexLayoutServerModule,
    FlexLayoutModule,
    monthLabelPipe,
    FormsModule,
    ReactiveFormsModule,
    CurrencyMaskModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ModalReleaseModuleDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ]
})
export class ModalReleasesParcelComponent implements OnInit {

  form!: FormGroup
  types = [
    { value: 'R', label: 'Receita' },
    { value: 'E', label: 'Despesa' }
  ]

  constructor(
    public dialogRef: MatDialogRef<ModalReleasesParcelComponent>,
    private mainService: MainService,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      value: new FormControl(0, [Validators.required, Validators.min(0)]),
      day: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(31)]),
      type: new FormControl(null, [Validators.required]),
      installments: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(12)]),
    });
  }

  save() {
    if (this.form.valid) {
      const form = this.form.getRawValue();
      const release: FinancialRelease = {} as FinancialRelease;
      release.name = form.name;
      release.value = form.value;
      release.day = form.day.getDate();
      release.type = form.type;
      release.month = this.data.month.month;
      release.year = this.data.month.year;

      this.mainService.createByinstallments(release, form.installments).subscribe({
        complete: () => {
          this._snackBar.open('Lançamento salvo com sucesso!', '', {
            duration: 5000
          });
          this.onNoClick(true);
        },
        error: (error) => {
          this._snackBar.open('Falha ao salvar. Tente novamente', 'X', {
            duration: 5000
          });
        }
      });
    } else {
      this.form.markAllAsTouched();
      this._snackBar.open('Campos invalidos!', 'X', {
        duration: 5000
      });
    }
  }

  onNoClick(saved?: boolean): void {
    this.dialogRef.close(saved);
  }
}
