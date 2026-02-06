'use client';

import { useParams } from 'next/navigation';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { usePersonPreference } from '@/hooks/use-person-preference';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { PersonFilter } from '@/components/dashboard/person-filter';
import { PersonSelectionModal } from '@/components/dashboard/person-selection-modal';
import { ReleaseList } from '@/components/releases/release-list';
import { BarChart } from '@/components/charts/bar-chart';
import { FinancialReleaseType, Person } from '@/types/financial-release';

export default function DashboardPage() {
  const params = useParams();
  const year = Number(params.year);
  const month = Number(params.month);

  const { filterValue, defaultPerson, preference, setPreference, needsSelection, isLoaded } =
    usePersonPreference();

  const handleFilterChange = (value: Person | '') => {
    setPreference(value === '' ? 'all' : value);
  };

  const handlePersonCreated = (person: Person) => {
    if (preference !== 'all') {
      setPreference(person);
    }
  };

  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(month, year);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceipts(month, year);

  const filteredExpenses = filterValue
    ? expenses.filter((e) => e.person === filterValue)
    : expenses;
  const filteredReceipts = filterValue
    ? receipts.filter((r) => r.person === filterValue)
    : receipts;

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.value, 0);
  const totalReceipts = filteredReceipts.reduce((sum, r) => sum + r.value, 0);
  const balance = totalReceipts - totalExpenses;

  const isLoading = loadingExpenses || loadingReceipts || !isLoaded;

  return (
    <div className="space-y-6">
      <PersonSelectionModal open={needsSelection} onSelect={setPreference} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BalanceCard balance={balance} isLoading={isLoading} />
        <PersonFilter value={filterValue} onChange={handleFilterChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReleaseList
          title="Receitas"
          type={FinancialReleaseType.Receipt}
          releases={filteredReceipts}
          month={month}
          year={year}
          isLoading={loadingReceipts}
          variant="receipt"
          defaultPerson={defaultPerson}
          onPersonCreated={handlePersonCreated}
        />

        <ReleaseList
          title="Despesas"
          type={FinancialReleaseType.Expense}
          releases={filteredExpenses}
          month={month}
          year={year}
          isLoading={loadingExpenses}
          variant="expense"
          defaultPerson={defaultPerson}
          onPersonCreated={handlePersonCreated}
        />
      </div>

      <BarChart receipts={totalReceipts} expenses={totalExpenses} />
    </div>
  );
}
