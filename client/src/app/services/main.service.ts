import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Expense } from "../models/Expense";
import { FinancialRelease } from '../models/FinancialRelease';
import { FinancialReleaseType } from '../models/FinancialReleaseType';
import { Receipt } from '../models/Receipt';

@Injectable({
    providedIn: 'root'
})
export class MainService {

    get url() {
        return environment.financialManagementApi;
    }

    constructor(private http: HttpClient) {

    }

    create(financialRelease: FinancialRelease) {
        return this.http.post(this.url, financialRelease);
    }

    findAll() {
        return this.http.get(this.url);
    }

    findOne(id: string) {
        return this.http.get(`${this.url}/${id}`);
    }

    update(id: string, financialRelease: FinancialRelease) {
        return this.http.patch(`${this.url}/${id}`, financialRelease);
    }

    remove(id: string) {
        return this.http.delete(`${this.url}/${id}`);
    }

    getExpenses(month: number, year: number): Observable<Expense[]> {
        return this.getByType(month, year, FinancialReleaseType.Expense);
    }

    getReceipts(month: number, year: number): Observable<Receipt[]> {
        return this.getByType(month, year, FinancialReleaseType.Receipt);
    }

    private getByType(month: number, year: number, type: FinancialReleaseType): Observable<FinancialRelease[]> {
        return this.http.get<FinancialRelease[]>(`${this.url}/by-type?type=${type}&month=${month}&year=${year}`);
    }
}
