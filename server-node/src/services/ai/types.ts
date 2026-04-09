export interface CategoryConfig {
  slug: string;
  displayName: string;
  description: string;
  examples: string[];
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { slug: 'supermercado', displayName: 'Supermercados', description: 'Supermercados, atacadistas e padarias', examples: [] },
  { slug: 'restaurante', displayName: 'Restaurantes', description: 'Delivery, bares, bistrôs e restaurantes', examples: [] },
  { slug: 'combustivel_transporte', displayName: 'Combustível e Transporte', description: 'Postos de combustível e estacionamento', examples: [] },
  { slug: 'saas_assinaturas', displayName: 'Assinaturas/Serviços', description: 'Ferramentas de dev, hospedagem, IA e SaaS', examples: [] },
  { slug: 'saude_farmacia', displayName: 'Saúde', description: 'Farmácias, odontologia e fitness', examples: [] },
  { slug: 'educacao', displayName: 'Educação', description: 'Faculdade, cursos e treinamentos', examples: [] },
  { slug: 'viagem', displayName: 'Viagens', description: 'Passagens aéreas, hospedagem e turismo', examples: [] },
  { slug: 'marketplace_eletronicos', displayName: 'Compras em Marketplaces', description: 'Amazon, Mercado Livre e similares', examples: [] },
  { slug: 'vestuario_beleza', displayName: 'Vestuário e Beleza', description: 'Lojas de roupa, beleza e estética', examples: [] },
  { slug: 'lazer_streaming', displayName: 'Assinaturas/Lazer', description: 'Streaming, jogos e entretenimento digital', examples: [] },
  { slug: 'casa_utilidades', displayName: 'Casa e Utilidades', description: 'Lojas de departamento e utilidades domésticas', examples: [] },
  { slug: 'outros', displayName: 'Outros', description: 'Tudo que não se encaixar nas categorias acima', examples: [] },
];

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
