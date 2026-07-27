export const CATEGORY_COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316',
  '#22d3ee', '#a855f7', '#84cc16', '#e879f9',
  '#2dd4bf', '#fb923c', '#818cf8', '#34d399',
];

/**
 * Atribuição determinística: nomes ordenados alfabeticamente recebem cores
 * em sequência. A mesma categoria mantém a mesma cor em qualquer gráfico
 * que use o mesmo conjunto (ou superconjunto ordenado) de nomes.
 */
export function buildCategoryColorMap(names: string[]): Record<string, string> {
  const sorted = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  const map: Record<string, string> = {};
  sorted.forEach((name, i) => {
    map[name] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
  });
  return map;
}
