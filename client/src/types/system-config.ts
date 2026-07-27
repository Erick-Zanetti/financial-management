export interface SystemConfig {
  id: string;
  aiIntegrationEnabled: boolean;
  openRouterToken: string;
  aiCustomPrompt: string;
  aiModel: string;
  aiOutputLanguage: string;
}

export type UpdateSystemConfig = Partial<Omit<SystemConfig, 'id'>>;
