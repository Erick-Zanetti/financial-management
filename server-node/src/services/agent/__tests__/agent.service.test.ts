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

  it('aprovação executa o write pendente e continua o loop', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValueOnce({
      content: 'Apagado com sucesso.',
      toolCalls: [],
    });
    const { financialReleaseService } = await import(
      '../../financial-release.service'
    );
    vi.mocked(financialReleaseService.delete).mockResolvedValue(true as never);
    const history = [
      { role: 'user' as const, content: 'apaga o lançamento X' },
      {
        role: 'assistant' as const,
        content: null,
        tool_calls: [
          toolCall('tcA', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}'),
        ],
      },
    ];
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: history, decisions: { tcA: true } },
      emit,
    );
    expect(financialReleaseService.delete).toHaveBeenCalledWith(
      'aaaaaaaaaaaaaaaaaaaaaaaa',
    );
    expect(events.some((e) => e.type === 'tool_message')).toBe(true);
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('rejeição vira tool_result de recusa sem executar', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValueOnce({
      content: 'Ok, não vou apagar.',
      toolCalls: [],
    });
    const { financialReleaseService } = await import(
      '../../financial-release.service'
    );
    const history = [
      { role: 'user' as const, content: 'apaga o lançamento X' },
      {
        role: 'assistant' as const,
        content: null,
        tool_calls: [
          toolCall('tcR', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}'),
        ],
      },
    ];
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: history, decisions: { tcR: false } },
      emit,
    );
    expect(financialReleaseService.delete).not.toHaveBeenCalled();
    const toolMsg = events.find((e) => e.type === 'tool_message');
    expect(JSON.stringify(toolMsg)).toContain('rejeitou');
  });

  it('write pendente sem decisão re-emite confirmation_request', async () => {
    const history = [
      { role: 'user' as const, content: 'apaga' },
      {
        role: 'assistant' as const,
        content: null,
        tool_calls: [
          toolCall('tcP', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}'),
        ],
      },
    ];
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: history }, emit);
    expect(events.find((e) => e.type === 'confirmation_request')).toBeTruthy();
    expect(streamChatCompletion).not.toHaveBeenCalled();
  });

  it('reenvio após queda do stream não executa o write de novo (ledger)', async () => {
    const { AgentService } = await import('../agent.service');
    const service = new AgentService();
    vi.mocked(streamChatCompletion).mockResolvedValue({
      content: 'Feito.',
      toolCalls: [],
    });
    const { financialReleaseService } = await import(
      '../../financial-release.service'
    );
    vi.mocked(financialReleaseService.delete).mockResolvedValue(true as never);
    const history = [
      { role: 'user' as const, content: 'apaga o lançamento X' },
      {
        role: 'assistant' as const,
        content: null,
        tool_calls: [
          toolCall('tcL', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}'),
        ],
      },
    ];
    // 1º request: aprova e executa
    let collected = collectEvents();
    await service.chat(
      { messages: history, decisions: { tcL: true } },
      collected.emit,
    );
    expect(financialReleaseService.delete).toHaveBeenCalledTimes(1);

    // 2º request: mesmo histórico (cliente perdeu o tool result), SEM decisão
    collected = collectEvents();
    await service.chat({ messages: history }, collected.emit);
    // não re-pergunta nem re-executa: replay do resultado + loop continua
    expect(financialReleaseService.delete).toHaveBeenCalledTimes(1);
    expect(
      collected.events.find((e) => e.type === 'confirmation_request'),
    ).toBeUndefined();
    expect(collected.events.some((e) => e.type === 'tool_message')).toBe(true);
    expect(collected.events.at(-1)).toEqual({ type: 'done' });

    // 3º request: re-aprovação explícita também não executa de novo
    collected = collectEvents();
    await service.chat(
      { messages: history, decisions: { tcL: true } },
      collected.emit,
    );
    expect(financialReleaseService.delete).toHaveBeenCalledTimes(1);
  });

  it('resultado de tool gigante é truncado antes de virar mensagem', async () => {
    const { categoryService } = await import('../../category.service');
    const huge = Array.from({ length: 3000 }, (_, i) => ({
      id: `c${i}`,
      name: `Categoria com nome bem comprido número ${i}`,
      type: 'E',
      allowSubcategories: false,
      allowDirectEntry: true,
    }));
    vi.mocked(categoryService.findAll).mockResolvedValueOnce(huge as never);
    vi.mocked(streamChatCompletion)
      .mockResolvedValueOnce({
        content: '',
        toolCalls: [toolCall('tcBig', 'list_categories', '{}')],
      })
      .mockResolvedValueOnce({ content: 'ok', toolCalls: [] });
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'categorias' }] },
      emit,
    );
    const toolMsg = events.find((e) => e.type === 'tool_message');
    const content =
      toolMsg && 'message' in toolMsg && toolMsg.message.role === 'tool'
        ? toolMsg.message.content
        : '';
    expect(content.length).toBeLessThan(51000);
    expect(content).toContain('TRUNCADO');
  });

  it('várias decisões no mesmo request executam todas de uma vez', async () => {
    const { AgentService } = await import('../agent.service');
    const service = new AgentService();
    vi.mocked(streamChatCompletion).mockResolvedValueOnce({
      content: 'Criados.',
      toolCalls: [],
    });
    const { financialReleaseService } = await import(
      '../../financial-release.service'
    );
    vi.mocked(financialReleaseService.delete).mockResolvedValue(true as never);
    const history = [
      { role: 'user' as const, content: 'apaga os dois' },
      {
        role: 'assistant' as const,
        content: null,
        tool_calls: [
          toolCall('tcM1', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}'),
          toolCall('tcM2', 'delete_release', '{"id":"bbbbbbbbbbbbbbbbbbbbbbbb"}'),
        ],
      },
    ];
    const { events, emit } = collectEvents();
    await service.chat(
      { messages: history, decisions: { tcM1: true, tcM2: true } },
      emit,
    );
    expect(financialReleaseService.delete).toHaveBeenCalledTimes(2);
    expect(events.filter((e) => e.type === 'tool_message')).toHaveLength(2);
    expect(
      events.find((e) => e.type === 'confirmation_request'),
    ).toBeUndefined();
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('signal abortado interrompe antes de chamar o modelo', async () => {
    const controller = new AbortController();
    controller.abort();
    const { events, emit } = collectEvents();
    await agentService.chat(
      { messages: [{ role: 'user', content: 'oi' }] },
      emit,
      controller.signal,
    );
    expect(streamChatCompletion).not.toHaveBeenCalled();
    expect(events.find((e) => e.type === 'error')).toBeUndefined();
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
