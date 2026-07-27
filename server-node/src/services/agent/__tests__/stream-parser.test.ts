import { describe, it, expect } from 'vitest';
import {
  extractDataLines,
  createAccumulator,
  applyDelta,
  finishAccumulator,
} from '../stream-parser';

describe('extractDataLines', () => {
  it('separa eventos completos e mantém resto parcial', () => {
    const { events, rest } = extractDataLines(
      'data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"par',
    );
    expect(events).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('data: {"par');
  });

  it('ignora [DONE] e linhas de comentário', () => {
    const { events } = extractDataLines('data: [DONE]\n\n: keep-alive\n\n');
    expect(events).toEqual([]);
  });
});

describe('delta accumulator', () => {
  it('acumula content e retorna tokens', () => {
    const acc = createAccumulator();
    expect(applyDelta(acc, { content: 'Olá' })).toBe('Olá');
    expect(applyDelta(acc, { content: ' mundo' })).toBe(' mundo');
    expect(finishAccumulator(acc).content).toBe('Olá mundo');
  });

  it('acumula tool_calls fragmentados por index', () => {
    const acc = createAccumulator();
    applyDelta(acc, {
      tool_calls: [
        {
          index: 0,
          id: 'tc1',
          function: { name: 'list_releases', arguments: '{"ye' },
        },
      ],
    });
    applyDelta(acc, {
      tool_calls: [{ index: 0, function: { arguments: 'ar":2026}' } }],
    });
    const { toolCalls } = finishAccumulator(acc);
    expect(toolCalls).toEqual([
      {
        id: 'tc1',
        type: 'function',
        function: { name: 'list_releases', arguments: '{"year":2026}' },
      },
    ]);
  });
});
