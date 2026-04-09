import { z } from 'zod';

export const updateSystemConfigSchema = z.object({
  aiIntegrationEnabled: z.boolean().optional(),
  openRouterToken: z.string().optional().default(''),
  aiCustomPrompt: z.string().max(5000).optional().default(''),
  aiModel: z.string().max(100).optional().default(''),
  aiOutputLanguage: z.string().max(10).optional().default('pt'),
  aiCategories: z
    .array(
      z.object({
        slug: z.string().min(1).max(50),
        displayName: z.string().min(1).max(100),
        description: z.string().max(200).default(''),
        examples: z.array(z.string()).default([]),
      }),
    )
    .optional()
    .default([]),
});

export type UpdateSystemConfigDto = z.infer<typeof updateSystemConfigSchema>;
