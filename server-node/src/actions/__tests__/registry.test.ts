import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { defineAction } from '../action.types';
import { ActionRegistry } from '../registry';
import { AppError } from '../../middlewares/error-handler.middleware';

const echo = defineAction({
  name: 'echo',
  description: 'Echoes input',
  mode: 'read',
  inputSchema: z.object({ text: z.string() }),
  run: async (input) => ({ echoed: input.text }),
});

describe('ActionRegistry', () => {
  it('executes a registered action with valid input', async () => {
    const registry = new ActionRegistry([echo]);
    await expect(registry.execute('echo', { text: 'oi' })).resolves.toEqual({
      echoed: 'oi',
    });
  });

  it('throws AppError 404 for unknown action', async () => {
    const registry = new ActionRegistry([echo]);
    await expect(registry.execute('nope', {})).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws AppError 400 for invalid input and does not run', async () => {
    const run = vi.fn();
    const registry = new ActionRegistry([{ ...echo, run }]);
    await expect(registry.execute('echo', { text: 42 })).rejects.toBeInstanceOf(
      AppError,
    );
    expect(run).not.toHaveBeenCalled();
  });

  it('generates OpenAI tool definitions', () => {
    const registry = new ActionRegistry([echo]);
    const tools = registry.toOpenAiTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].type).toBe('function');
    expect(tools[0].function.name).toBe('echo');
    expect(tools[0].function.parameters).toMatchObject({ type: 'object' });
  });
});
