'use client';

import { useState, useEffect } from 'react';
import { useMonthNavigation } from '@/hooks/use-month-navigation';
import { useMonth, ViewTab } from '@/providers/month-provider';
import { useSettings } from '@/providers/settings-provider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const CURRENT_BALANCE_KEY = 'financial-management-current-balance';

export function MonthNavigation() {
  const { months, currentYear, currentMonth, navigateToMonth } = useMonthNavigation();
  const { activeTab, setActiveTab, setCurrentBalance } = useMonth();
  const { getMonthLabel, t, formatDisplayValue, parseCurrency } = useSettings();

  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const isCurrentMonth = currentMonth === nowMonth && currentYear === nowYear;

  const [displayBalance, setDisplayBalance] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENT_BALANCE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.month === nowMonth && parsed.year === nowYear) {
          setDisplayBalance(formatDisplayValue(parsed.value));
          setCurrentBalance(parsed.value);
        } else {
          localStorage.removeItem(CURRENT_BALANCE_KEY);
          setDisplayBalance('');
          setCurrentBalance(0);
        }
      }
    } catch {
      setDisplayBalance('');
      setCurrentBalance(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatDisplayValue]);

  const monthValue = `${currentYear}-${currentMonth}`;

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ViewTab)}
      >
        <TabsList className="w-full rounded-none h-10">
          <TabsTrigger value="releases" className="w-1/2 rounded-sm">
            {t('releases')}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="w-1/2 rounded-sm">
            {t('timeline')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Select
          value={monthValue}
          onValueChange={(v) => {
            const [y, m] = v.split('-').map(Number);
            navigateToMonth(y, m);
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                {getMonthLabel(m.month)}/{m.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isCurrentMonth && (
          <Input
            type="text"
            inputMode="numeric"
            placeholder={t('currentBalance')}
            value={displayBalance}
            onChange={(e) => {
              const raw = e.target.value;
              setDisplayBalance(raw);
              const numeric = parseCurrency(raw);
              setCurrentBalance(numeric);
              localStorage.setItem(
                CURRENT_BALANCE_KEY,
                JSON.stringify({ month: nowMonth, year: nowYear, value: numeric })
              );
            }}
            className="flex-1 h-9 text-sm font-medium"
          />
        )}
      </div>
    </div>
  );
}
