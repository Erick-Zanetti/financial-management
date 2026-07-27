import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../openrouter-client', () => ({ streamChatCompletion: vi.fn() }));
vi.mock('../../system-config.service', () => ({
  systemConfigService: {
    get: vi.fn(),
  },
}));
vi.mock('../../financial-release.service', () => ({
  financialReleaseService: {
    findByTypeAndMonthAndYear: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    searchByName: vi.fn(),
    getDashboardSummarySegmented: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../category.service', () => ({
  categoryService: { findAll: vi.fn().mockResolvedValue([]) },
}));

import { streamChatCompletion } from '../openrouter-client';
import { systemConfigService } from '../../system-config.service';
import { agentService } from '../agent.service';
import { AgentEvent } from '../agent.types';

function collectEvents() {
  const events: AgentEvent[] = [];
  return { events, emit: (e: AgentEvent) => events.push(e) };
}

const toolCall = (id: string, name: string, args: string) => ({
  id,
  type: 'function' as const,
  function: { name, arguments: args },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(systemConfigService.get).mockResolvedValue({
    openRouterToken: 'tok',
    agentModel: 'test-model',
  } as never);
});

describe('agentService.chat', () => {
  it('resposta simples: assistant_message + done', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValue({
      content: 'Oi!',
      toolCalls: [],
    });
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'oi' }] },
      emit,
    );
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(events.some((e) => e.type === 'assistant_message')).toBe(true);
  });

  it('executa tool read e continua o loop', async () => {
    vi.mocked(streamChatCompletion)
      .mockResolvedValueOnce({
        content: '',
        toolCalls: [toolCall('tc1', 'list_categories', '{}')],
      })
      .mockResolvedValueOnce({ content: 'Sem categorias.', toolCalls: [] });
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'categorias?' }] },
      emit,
    );
    expect(events.filter((e) => e.type === 'tool_start')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'tool_message')).toHaveLength(1);
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(streamChatCompletion).toHaveBeenCalledTimes(2);
  });

  it('tool write vira confirmation_request e encerra o stream', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValueOnce({
      content: '',
      toolCalls: [
        toolCall('tc9', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}'),
      ],
    });
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'apaga' }] },
      emit,
    );
    const confirm = events.find((e) => e.type === 'confirmation_request');
    expect(confirm).toMatchObject({ toolCallId: 'tc9', name: 'delete_release' });
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(streamChatCompletion).toHaveBeenCalledTimes(1);
  });

  it('erro de tool vira tool_result ok=false e o loop segue', async () => {
    vi.mocked(streamChatCompletion)
      .mockResolvedValueOnce({
        content: '',
        toolCalls: [toolCall('tc2', 'get_release', '{"id":"invalido"}')],
      })
      .mockResolvedValueOnce({ content: 'Id inválido.', toolCalls: [] });
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'x' }] },
      emit,
    );
    expect(events.find((e) => e.type === 'tool_result')).toMatchObject({
      ok: false,
    });
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('respeita o limite de 10 iterações', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValue({
      content: '',
      toolCalls: [toolCall('tcN', 'list_categories', '{}')],
    });
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'loop' }] },
      emit,
    );
    expect(streamChatCompletion).toHaveBeenCalledTimes(10);
    expect(events.at(-1)).toMatchObject({ type: 'error' });
  });

  it('sem token configurado: evento error amigável', async () => {
    vi.mocked(systemConfigService.get).mockResolvedValueOnce({
      openRouterToken: '',
      agentModel: 'm',
    } as never);
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'oi' }] },
      emit,
    );
    expect(events).toEqual([
      { type: 'error', message: expect.stringContaining('OpenRouter') },
    ]);
  });
});
