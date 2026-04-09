export interface SystemConfig {
  id: string;
  aiIntegrationEnabled: boolean;
  openRouterToken: string;
  aiCustomPrompt: string;
}

export type UpdateSystemConfig = Partial<Omit<SystemConfig, 'id'>>;
