'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Person } from '@/types/financial-release';

interface PersonFilterProps {
  value: Person | '';
  onChange: (value: Person | '') => void;
}

export function PersonFilter({ value, onChange }: PersonFilterProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(v) => onChange(v === 'all' ? '' : (v as Person))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por pessoa" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value={Person.ERICK}>Erick</SelectItem>
        <SelectItem value={Person.JULIA}>Julia</SelectItem>
      </SelectContent>
    </Select>
  );
}
