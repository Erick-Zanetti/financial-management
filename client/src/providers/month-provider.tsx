'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ViewTab = 'releases' | 'timeline';

interface MonthContextValue {
  currentYear: number;
  currentMonth: number;
  setMonth: (year: number, month: number) => void;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  currentBalance: number;
  setCurrentBalance: (value: number) => void;
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<ViewTab>('releases');
  const [currentBalance, setCurrentBalance] = useState(0);

  const setMonth = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, []);

  return (
    <MonthContext.Provider value={{ currentYear, currentMonth, setMonth, activeTab, setActiveTab, currentBalance, setCurrentBalance }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonth must be used within a MonthProvider');
  }
  return context;
}
