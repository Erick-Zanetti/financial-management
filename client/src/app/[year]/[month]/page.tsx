'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { PersonFilter } from '@/components/dashboard/person-filter';
import { ReleaseList } from '@/components/releases/release-list';
import { PieChart } from '@/components/charts/pie-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { FinancialReleaseType, Person } from '@/types/financial-release';

export default function DashboardPage() {
  const params = useParams();
  const year = Number(params.year);
  const month = Number(params.month);

  const [person, setPerson] = useState<Person | ''>('');

  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);

  const filteredExpenses = person
    ? expenses.filter((e) => e.person === person)
    : expenses;
  const filteredReceipts = person
    ? receipts.filter((r) => r.person === person)
    : receipts;

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.value, 0);
  const totalReceipts = filteredReceipts.reduce((sum, r) => sum + r.value, 0);
  const balance = totalReceipts - totalExpenses;

  const isLoading = loadingExpenses || loadingReceipts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BalanceCard balance={balance} isLoading={isLoading} />
        <PersonFilter value={person} onChange={setPerson} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ReleaseList
            title="Receitas"
            type={FinancialReleaseType.Receipt}
            releases={filteredReceipts}
            month={month}
            year={year}
            isLoading={loadingReceipts}
            variant="receipt"
          />
          <PieChart data={filteredReceipts} />
        </div>

        <div className="space-y-4">
          <ReleaseList
            title="Despesas"
            type={FinancialReleaseType.Expense}
            releases={filteredExpenses}
            month={month}
            year={year}
            isLoading={loadingExpenses}
            variant="expense"
          />
          <PieChart data={filteredExpenses} />
        </div>
      </div>

      <BarChart receipts={totalReceipts} expenses={totalExpenses} />
    </div>
  );
}
