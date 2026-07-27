import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AppAction } from './action.types';
import { AppError } from '../middlewares/error-handler.middleware';

// zod-to-json-schema's deep generic inference blows TS2589 on ZodTypeAny inputs
const toJsonSchema = zodToJsonSchema as unknown as (
  schema: z.ZodTypeAny,
) => Record<string, unknown>;

export interface OpenAiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export class ActionRegistry {
  private readonly actions: Map<string, AppAction>;

  constructor(actions: AppAction[]) {
    this.actions = new Map(actions.map((a) => [a.name, a]));
  }

  get(name: string): AppAction | undefined {
    return this.actions.get(name);
  }

  list(): AppAction[] {
    return Array.from(this.actions.values());
  }

  async execute(name: string, input: unknown): Promise<unknown> {
    const action = this.get(name);
    if (!action) {
      throw new AppError(404, `Unknown action: ${name}`);
    }
    const parsed = action.inputSchema.safeParse(input);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new AppError(400, `Invalid input for ${name}: ${detail}`);
    }
    return action.run(parsed.data);
  }

  toOpenAiTools(): OpenAiTool[] {
    return this.list().map((a) => ({
      type: 'function' as const,
      function: {
        name: a.name,
        description: a.description,
        parameters: toJsonSchema(a.inputSchema),
      },
    }));
  }
}
