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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import moment from "moment";
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { monthLabelPipe } from '../../pipes/month-label/month-label.pipe';
import { FinancialRelease } from './../../models/FinancialRelease';
import { MainService } from './../../services/main.service';

class ModalReleaseModuleDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    return moment(date).format('DD MMM');
  }
}

@Component({
  selector: 'app-modal-release',
  templateUrl: 'modal-release.component.html',
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
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ModalReleaseModuleDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ]
})
export class ModalReleaseComponentDialog implements OnInit {

  form!: FormGroup

  constructor(
    public dialogRef: MatDialogRef<ModalReleaseComponentDialog>,
    private mainService: MainService,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.createForm();
    console.log(this.data)
    if (!this.data.new) {
      this.form.get('name')?.setValue(this.data.release?.name);
      this.form.get('value')?.setValue(this.data.release?.value);
      this.form.get('day')?.setValue(new Date(this.data.release?.year, this.data.release?.month, this.data.release?.day));
    } else {
      this.form.get('day')?.setValue(new Date(this.data.month?.year, this.data.month?.month, 1));
    }
  }

  createForm() {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      value: new FormControl(0, [Validators.required, Validators.min(0)]),
      day: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(31)]),
    });
  }

  save() {
    if (this.form.valid) {
      const form = this.form.getRawValue();
      const release: FinancialRelease = Object.assign((this.data.release || {}), form, { month: this.data.month.month, year: this.data.month.year }, { type: this.data.type });
      release.day = form.day.getDate();
      if (this.data.new) {
        this.create(release);
      } else {
        this.update(release);
      }
    } else {
      this.form.markAllAsTouched();
      this._snackBar.open('Campos invalidos!', 'X', {
        duration: 5000
      });
    }
  }

  private update(release: FinancialRelease) {
    if (!release.id) return console.error('Id não informado');
    this.mainService.update(release?.id, release).subscribe({
      complete: () => {
        this._snackBar.open('Lançamento atualizado com sucesso!', '', {
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
  }

  private create(release: FinancialRelease) {
    this.mainService.create(release).subscribe({
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
  }

  onNoClick(saved?: boolean): void {
    this.dialogRef.close(saved);
  }
}
