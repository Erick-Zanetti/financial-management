interface PopulatedName {
  name?: string;
}

function categoryName(value: unknown): string | null {
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as PopulatedName).name);
  }
  return null;
}

export interface SerializedRelease {
  id: string;
  name: string;
  value: number;
  type: string;
  category: string | null;
  date: string;
  settled: boolean;
  subcategories: Array<{ category: string | null; value: number }>;
}

export function serializeRelease(r: {
  id?: string;
  name: string;
  value: number;
  type: string;
  year: number;
  month: number;
  day: number;
  settled?: boolean;
  category?: unknown;
  subcategories?: Array<{ category?: unknown; value: number }>;
}): SerializedRelease {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id: r.id ?? '',
    name: r.name,
    value: r.value,
    type: r.type,
    category: categoryName(r.category),
    date: `${r.year}-${pad(r.month)}-${pad(r.day)}`,
    settled: r.settled ?? false,
    subcategories: (r.subcategories ?? []).map((s) => ({
      category: categoryName(s.category),
      value: s.value,
    })),
  };
}

export function serializeCategory(c: {
  id?: string;
  name: string;
  type: string;
  allowSubcategories?: boolean;
  subcategoryMode?: string;
  allowDirectEntry?: boolean;
}): Record<string, unknown> {
  return {
    id: c.id ?? '',
    name: c.name,
    type: c.type,
    allowSubcategories: c.allowSubcategories ?? false,
    subcategoryMode: c.subcategoryMode ?? 'multi',
    allowDirectEntry: c.allowDirectEntry !== false,
  };
}
