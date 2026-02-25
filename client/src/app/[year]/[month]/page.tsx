'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useExpenses, useReceipts } from '@/hooks/use-releases';
import { usePersonPreference } from '@/hooks/use-person-preference';
import { useSettings } from '@/providers/settings-provider';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { PersonFilter } from '@/components/dashboard/person-filter';
import { PersonSelectionModal } from '@/components/dashboard/person-selection-modal';
import { ReleaseList } from '@/components/releases/release-list';
import { BarChart } from '@/components/charts/bar-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FinancialReleaseType, Person } from '@/types/financial-release';

const CURRENT_BALANCE_KEY = 'financial-management-current-balance';

export default function DashboardPage() {
  const params = useParams();
  const year = Number(params.year);
  const month = Number(params.month);
  const { t, formatDisplayValue, parseCurrency } = useSettings();

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const [displayBalance, setDisplayBalance] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_BALANCE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = new Date();
        if (parsed.month === now.getMonth() + 1 && parsed.year === now.getFullYear()) {
          setDisplayBalance(formatDisplayValue(parsed.value));
        } else {
          localStorage.removeItem(CURRENT_BALANCE_KEY);
        }
      }
    } catch {}
  }, [formatDisplayValue]);

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

  const hasTransactions = filteredExpenses.length > 0 || filteredReceipts.length > 0;
  const allMonthSettled = hasTransactions &&
    filteredExpenses.every((e) => e.settled) &&
    filteredReceipts.every((r) => r.settled);

  const activeExpenses = allMonthSettled
    ? filteredExpenses
    : filteredExpenses.filter((e) => !e.settled);
  const activeReceipts = allMonthSettled
    ? filteredReceipts
    : filteredReceipts.filter((r) => !r.settled);

  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.value, 0);
  const totalReceipts = activeReceipts.reduce((sum, r) => sum + r.value, 0);
  const balance = totalReceipts - totalExpenses;

  const isLoading = loadingExpenses || loadingReceipts || !isLoaded;

  return (
    <div className="space-y-6">
      <PersonSelectionModal open={needsSelection} onSelect={setPreference} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {isCurrentMonth && (
            <Card className="w-full sm:w-auto">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">{t('currentBalance')}</div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={displayBalance}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDisplayBalance(raw);
                    const numeric = parseCurrency(raw);
                    const now = new Date();
                    localStorage.setItem(
                      CURRENT_BALANCE_KEY,
                      JSON.stringify({ month: now.getMonth() + 1, year: now.getFullYear(), value: numeric })
                    );
                  }}
                  className="text-2xl font-bold w-40"
                />
              </CardContent>
            </Card>
          )}
          <BalanceCard balance={balance} isLoading={isLoading} />
        </div>
        <PersonFilter value={filterValue} onChange={handleFilterChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReleaseList
          title={t('receipts')}
          type={FinancialReleaseType.Receipt}
          releases={filteredReceipts}
          month={month}
          year={year}
          isLoading={loadingReceipts}
          variant="receipt"
          defaultPerson={defaultPerson}
          onPersonCreated={handlePersonCreated}
          allMonthSettled={allMonthSettled}
        />

        <ReleaseList
          title={t('expenses')}
          type={FinancialReleaseType.Expense}
          releases={filteredExpenses}
          month={month}
          year={year}
          isLoading={loadingExpenses}
          variant="expense"
          defaultPerson={defaultPerson}
          onPersonCreated={handlePersonCreated}
          allMonthSettled={allMonthSettled}
        />
      </div>

      <BarChart receipts={totalReceipts} expenses={totalExpenses} />
    </div>
  );
}
