import { OpenRouterToolCall } from './agent.types';

export interface StreamDelta {
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }>;
}

export interface DeltaAccumulator {
  content: string;
  toolCalls: Map<number, { id: string; name: string; arguments: string }>;
}

export function extractDataLines(buffer: string): {
  events: string[];
  rest: string;
} {
  const events: string[] = [];
  let rest = buffer;
  let idx: number;
  while ((idx = rest.indexOf('\n\n')) !== -1) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    for (const line of block.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload && payload !== '[DONE]') events.push(payload);
    }
  }
  return { events, rest };
}

export function createAccumulator(): DeltaAccumulator {
  return { content: '', toolCalls: new Map() };
}

export function applyDelta(
  acc: DeltaAccumulator,
  delta: StreamDelta,
): string | null {
  if (delta.tool_calls) {
    for (const tc of delta.tool_calls) {
      const existing = acc.toolCalls.get(tc.index) ?? {
        id: '',
        name: '',
        arguments: '',
      };
      acc.toolCalls.set(tc.index, {
        id: tc.id ?? existing.id,
        name: existing.name + (tc.function?.name ?? ''),
        arguments: existing.arguments + (tc.function?.arguments ?? ''),
      });
    }
  }
  if (delta.content) {
    acc.content += delta.content;
    return delta.content;
  }
  return null;
}

export function finishAccumulator(acc: DeltaAccumulator): {
  content: string;
  toolCalls: OpenRouterToolCall[];
} {
  const toolCalls: OpenRouterToolCall[] = [];
  acc.toolCalls.forEach((tc) => {
    toolCalls.push({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: tc.arguments },
    });
  });
  return { content: acc.content, toolCalls };
}
