export interface AiCategoryConfig {
  slug: string;
  displayName: string;
  description: string;
  examples: string[];
}

export interface SystemConfig {
  id: string;
  aiIntegrationEnabled: boolean;
  openRouterToken: string;
  aiCustomPrompt: string;
  aiModel: string;
  aiOutputLanguage: string;
  aiCategories: AiCategoryConfig[];
}

export type UpdateSystemConfig = Partial<Omit<SystemConfig, 'id'>>;
