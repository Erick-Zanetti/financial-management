export interface IAiProcessedResult {
  total: number;
  subcategories: Array<{ categoryId: string; name: string; value: number }>;
  report: string;
  validation?: {
    expected_total: number;
    categorized_total: number;
    matches: boolean;
  };
}
