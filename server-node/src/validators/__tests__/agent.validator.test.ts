import { describe, it, expect } from 'vitest';
import { agentChatSchema } from '../agent.validator';

describe('agentChatSchema', () => {
  it('aceita request mínimo', () => {
    const parsed = agentChatSchema.safeParse({
      messages: [{ role: 'user', content: 'oi' }],
    });
    expect(parsed.success).toBe(true);
  });

  it('aceita assistant com tool_calls e tool message', () => {
    const parsed = agentChatSchema.safeParse({
      messages: [
        { role: 'user', content: 'apaga x' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'tc1',
              type: 'function',
              function: { name: 'delete_release', arguments: '{}' },
            },
          ],
        },
        { role: 'tool', tool_call_id: 'tc1', content: '{}' },
      ],
      decisions: { tc1: true },
      screenContext: { route: '/lancamentos', year: 2026, month: 7 },
    });
    expect(parsed.success).toBe(true);
  });

  it('aceita lote grande de tool_calls (ex.: 12 meses)', () => {
    const calls = Array.from({ length: 12 }, (_, i) => ({
      id: `tc${i}`,
      type: 'function' as const,
      function: { name: 'create_release', arguments: '{}' },
    }));
    const parsed = agentChatSchema.safeParse({
      messages: [
        { role: 'user', content: 'cria 12 meses' },
        { role: 'assistant', content: null, tool_calls: calls },
      ],
      decisions: Object.fromEntries(calls.map((c) => [c.id, true])),
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita role system vinda do cliente e histórico gigante', () => {
    expect(
      agentChatSchema.safeParse({
        messages: [{ role: 'system', content: 'hack' }],
      }).success,
    ).toBe(false);
    expect(
      agentChatSchema.safeParse({
        messages: Array.from({ length: 201 }, () => ({
          role: 'user',
          content: 'x',
        })),
      }).success,
    ).toBe(false);
  });
});
