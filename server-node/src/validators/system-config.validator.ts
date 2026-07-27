import { z } from 'zod';

export const updateSystemConfigSchema = z.object({
  aiIntegrationEnabled: z.boolean().optional(),
  openRouterToken: z.string().optional().default(''),
  aiCustomPrompt: z.string().max(5000).optional().default(''),
  aiModel: z.string().max(100).optional().default(''),
  aiOutputLanguage: z.string().max(10).optional().default('pt'),
});

export type UpdateSystemConfigDto = z.infer<typeof updateSystemConfigSchema>;
