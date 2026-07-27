export interface CategoryConfig {
  slug: string;
  displayName: string;
  description: string;
  examples: string[];
  prompt?: string;
}

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
  category: string;
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
  category_details: Map<string, ClassifiedRow[]>;
  preprocessed: PreprocessedData;
}

export interface AiConfig {
  openRouterToken: string;
  aiModel: string;
  aiOutputLanguage: string;
  aiCustomPrompt: string;
  aiCategories: CategoryConfig[];
}
