import { z } from 'zod';

const toolCallSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal('function'),
  function: z.object({
    name: z.string().min(1).max(100),
    arguments: z.string().max(20000),
  }),
});

const messageSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: z.string().min(1).max(8000) }),
  z.object({
    role: z.literal('assistant'),
    content: z.string().max(20000).nullable(),
    tool_calls: z.array(toolCallSchema).max(10).optional(),
  }),
  z.object({
    role: z.literal('tool'),
    tool_call_id: z.string().min(1).max(100),
    content: z.string().max(100000),
  }),
]);

export const agentChatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
  screenContext: z
    .object({
      route: z.string().max(200),
      year: z.number().int().min(2000).max(2100).optional(),
      month: z.number().int().min(1).max(12).optional(),
    })
    .optional(),
  decisions: z.record(z.string(), z.boolean()).optional(),
});

export type AgentChatDto = z.infer<typeof agentChatSchema>;
