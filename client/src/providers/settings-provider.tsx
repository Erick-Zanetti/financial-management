'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import translations, { Language, TranslationKey } from '@/lib/translations';

type Currency = 'BRL' | 'USD';

interface SettingsContextValue {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (cur: Currency) => void;
  t: (key: TranslationKey) => string;
  formatCurrency: (value: number) => string;
  parseCurrency: (value: string) => number;
  getMonthLabel: (month: number) => string;
  formatDisplayValue: (value: number) => string;
}

const STORAGE_KEY = 'financial-management-settings';

const SettingsContext = createContext<SettingsContextValue | null>(null);

const monthKeys: TranslationKey[] = [
  'monthJan', 'monthFeb', 'monthMar', 'monthApr',
  'monthMay', 'monthJun', 'monthJul', 'monthAug',
  'monthSep', 'monthOct', 'monthNov', 'monthDec',
];

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');
  const [currency, setCurrencyState] = useState<Currency>('BRL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.language === 'pt' || parsed.language === 'en') {
          setLanguageState(parsed.language);
        }
        if (parsed.currency === 'BRL' || parsed.currency === 'USD') {
          setCurrencyState(parsed.currency);
        }
      }
    } catch {}
    setMounted(true);
  }, []);

  const persist = useCallback((lang: Language, cur: Currency) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ language: lang, currency: cur }));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setCurrencyState((cur) => {
      persist(lang, cur);
      return cur;
    });
  }, [persist]);

  const setCurrency = useCallback((cur: Currency) => {
    setCurrencyState(cur);
    setLanguageState((lang) => {
      persist(lang, cur);
      return lang;
    });
  }, [persist]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] ?? key;
  }, [language]);

  const formatCurrencyFn = useCallback((value: number): string => {
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }, [currency]);

  const parseCurrencyFn = useCallback((value: string): number => {
    if (currency === 'USD') {
      const clean = value.replace(/[$,\s]/g, '');
      return parseFloat(clean) || 0;
    }
    const clean = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return parseFloat(clean) || 0;
  }, [currency]);

  const getMonthLabel = useCallback((month: number): string => {
    const key = monthKeys[month - 1];
    if (!key) return '';
    return translations[language][key];
  }, [language]);

  const formatDisplayValue = useCallback((value: number): string => {
    if (value === 0) return '';
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [currency]);

  const ctx = useMemo<SettingsContextValue>(() => ({
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    formatCurrency: formatCurrencyFn,
    parseCurrency: parseCurrencyFn,
    getMonthLabel,
    formatDisplayValue,
  }), [language, currency, setLanguage, setCurrency, t, formatCurrencyFn, parseCurrencyFn, getMonthLabel, formatDisplayValue]);

  if (!mounted) {
    return null;
  }

  return (
    <SettingsContext.Provider value={ctx}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
