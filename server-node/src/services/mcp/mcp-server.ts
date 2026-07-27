import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { actionRegistry } from '../../actions';

// Same TS2589 workaround used in actions/registry.ts.
const toJsonSchema = zodToJsonSchema as unknown as (
  schema: z.ZodTypeAny,
) => Record<string, unknown>;

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'financial-management', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: actionRegistry.list().map((a) => ({
      name: a.name,
      description: a.description,
      inputSchema: toJsonSchema(a.inputSchema) as {
        type: 'object';
        [key: string]: unknown;
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
      const result = await actionRegistry.execute(
        req.params.name,
        req.params.arguments ?? {},
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
