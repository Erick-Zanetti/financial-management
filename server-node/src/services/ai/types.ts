export const EXPENSE_CATEGORIES = [
  'supermercado',
  'restaurante',
  'combustivel_transporte',
  'saas_assinaturas',
  'saude_farmacia',
  'educacao',
  'viagem',
  'marketplace_eletronicos',
  'vestuario_beleza',
  'lazer_streaming',
  'casa_utilidades',
  'outros',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_DISPLAY_NAMES: Record<ExpenseCategory, string> = {
  supermercado: 'Supermercados',
  restaurante: 'Restaurantes',
  combustivel_transporte: 'Combustível e Transporte',
  saas_assinaturas: 'Assinaturas/Serviços',
  saude_farmacia: 'Saúde',
  educacao: 'Educação',
  viagem: 'Viagens',
  marketplace_eletronicos: 'Compras em Marketplaces',
  vestuario_beleza: 'Vestuário e Beleza',
  lazer_streaming: 'Assinaturas/Lazer',
  casa_utilidades: 'Casa e Utilidades',
  outros: 'Outros',
};

export interface CsvRow {
  row_id: number;
  date: string;
  merchant: string;
  amount_brl: number;
  amount_usd: number;
}

export interface IofEntry {
  iof_row: CsvRow;
  parent_row_id: number;
}

export interface ReversalPair {
  positive_row: CsvRow;
  negative_row: CsvRow;
}

export interface PreprocessedData {
  expense_rows: CsvRow[];
  iof_entries: IofEntry[];
  matched_reversals: ReversalPair[];
  unmatched_credits: CsvRow[];
  payments: CsvRow[];
  fees: CsvRow[];
}

export interface ConsolidatedRow {
  consolidated_id: number;
  merchant: string;
  total_amount: number;
  count: number;
  original_row_ids: number[];
}

export interface LlmClassification {
  row_id: number;
  category: ExpenseCategory;
}

export interface ClassifiedRow {
  row: CsvRow;
  iof_amount: number;
  effective_amount: number;
}

export interface AggregatedResult {
  total: number;
  subcategories: Array<{ name: string; value: number }>;
  validation: {
    expected_total: number;
    categorized_total: number;
    matches: boolean;
  };
  category_details: Map<ExpenseCategory, ClassifiedRow[]>;
  preprocessed: PreprocessedData;
}

export interface AiConfig {
  openRouterToken: string;
  aiModel: string;
  aiOutputLanguage: string;
  aiCustomPrompt: string;
}
