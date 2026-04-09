export interface IAiProcessedResult {
  total: number;
  subcategories: Array<{ name: string; value: number }>;
  report: string;
  validation?: {
    expected_total: number;
    categorized_total: number;
    matches: boolean;
  };
}
