import { AppError } from '../../middlewares/error-handler.middleware';
import { OpenAiTool } from '../../actions/registry';
import { ChatMessage, OpenRouterToolCall } from './agent.types';
import {
  extractDataLines,
  createAccumulator,
  applyDelta,
  finishAccumulator,
  StreamDelta,
} from './stream-parser';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Sem timeout, um upstream travado pendura o turno para sempre.
const CALL_TIMEOUT_MS = 180000;

export async function streamChatCompletion(opts: {
  token: string;
  model: string;
  messages: ChatMessage[];
  tools: OpenAiTool[];
  onToken: (t: string) => void;
  signal?: AbortSignal;
}): Promise<{ content: string; toolCalls: OpenRouterToolCall[] }> {
  const signals = [AbortSignal.timeout(CALL_TIMEOUT_MS)];
  if (opts.signal) signals.push(opts.signal);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    signal: AbortSignal.any(signals),
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      tools: opts.tools,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new AppError(
      502,
      `OpenRouter error ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const acc = createAccumulator();
  const decoder = new TextDecoder();
  let buffer = '';
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = extractDataLines(buffer);
    buffer = rest;
    for (const raw of events) {
      let parsed: { choices?: Array<{ delta?: StreamDelta }> };
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) continue;
      const tokenText = applyDelta(acc, delta);
      if (tokenText) opts.onToken(tokenText);
    }
  }
  return finishAccumulator(acc);
}
