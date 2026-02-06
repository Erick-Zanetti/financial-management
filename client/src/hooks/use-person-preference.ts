'use client';

import { useState, useEffect, useCallback } from 'react';
import { Person } from '@/types/financial-release';

const STORAGE_KEY = 'financial-management-person';
type PersonPreference = Person | 'all';

export function usePersonPreference() {
  const [preference, setPreferenceState] = useState<PersonPreference | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ERICK' || stored === 'JULIA' || stored === 'all') {
      setPreferenceState(stored as PersonPreference);
    }
    setIsLoaded(true);
  }, []);

  const setPreference = useCallback((value: PersonPreference) => {
    localStorage.setItem(STORAGE_KEY, value);
    setPreferenceState(value);
  }, []);

  const filterValue: Person | '' =
    preference === 'all' || preference === null ? '' : preference;

  const defaultPerson: Person | undefined =
    preference === 'ERICK' || preference === 'JULIA' ? preference : undefined;

  const needsSelection = isLoaded && preference === null;

  return { preference, filterValue, defaultPerson, setPreference, needsSelection, isLoaded };
}
