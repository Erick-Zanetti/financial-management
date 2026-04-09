export interface ISystemConfig {
  id?: string;
  aiIntegrationEnabled: boolean;
  openRouterToken: string;
  aiCustomPrompt: string;
  aiModel: string;
  aiOutputLanguage: string;
  aiCategories: Array<{
    slug: string;
    displayName: string;
    description: string;
    examples: string[];
  }>;
}
