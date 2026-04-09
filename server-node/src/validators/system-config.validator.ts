import { z } from 'zod';

export const updateSystemConfigSchema = z.object({
  aiIntegrationEnabled: z.boolean().optional(),
  openRouterToken: z.string().optional().default(''),
  aiCustomPrompt: z.string().max(2000).optional().default(''),
});

export type UpdateSystemConfigDto = z.infer<typeof updateSystemConfigSchema>;
