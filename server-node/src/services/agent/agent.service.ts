import { actionRegistry } from '../../actions';
import { systemConfigService } from '../system-config.service';
import { logger } from '../../config/logger.config';
import { streamChatCompletion } from './openrouter-client';
import { buildSystemPrompt } from './system-prompt';
import {
  AgentChatRequest,
  AgentEvent,
  ChatMessage,
  OpenRouterToolCall,
} from './agent.types';

const MAX_TOOL_ITERATIONS = 10;

function safeParseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

export class AgentService {
  async chat(
    req: AgentChatRequest,
    emit: (e: AgentEvent) => void,
  ): Promise<void> {
    try {
      const config = await systemConfigService.get();
      if (!config.openRouterToken || !config.agentModel) {
        emit({
          type: 'error',
          message:
            'Configure o token OpenRouter e o modelo do agente em Configurações.',
        });
        return;
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(req.screenContext) },
        ...req.messages,
      ];

      const resolved = await this.resolvePendingWrites(
        messages,
        req.decisions ?? {},
      );
      for (const result of resolved) {
        emit({ type: 'tool_message', message: result });
        messages.push(result);
      }
      if (this.undecidedWrites(messages).length > 0) {
        this.emitConfirmations(messages, emit);
        emit({ type: 'done' });
        return;
      }

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const { content, toolCalls } = await streamChatCompletion({
          token: config.openRouterToken,
          model: config.agentModel,
          messages,
          tools: actionRegistry.toOpenAiTools(),
          onToken: (t) => emit({ type: 'token', content: t }),
        });

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: content || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        };
        emit({ type: 'assistant_message', message: assistantMessage });
        messages.push(assistantMessage);

        if (toolCalls.length === 0) {
          emit({ type: 'done' });
          return;
        }

        let awaitingConfirmation = false;
        for (const tc of toolCalls) {
          const action = actionRegistry.get(tc.function.name);
          if (action?.mode === 'write') {
            emit({
              type: 'confirmation_request',
              toolCallId: tc.id,
              name: tc.function.name,
              args: safeParseArgs(tc.function.arguments),
            });
            awaitingConfirmation = true;
            continue;
          }
          const toolMessage = await this.runTool(tc, emit);
          emit({ type: 'tool_message', message: toolMessage });
          messages.push(toolMessage);
        }
        if (awaitingConfirmation) {
          emit({ type: 'done' });
          return;
        }
      }

      emit({
        type: 'error',
        message:
          'Limite de ações por mensagem atingido. Tente uma pergunta mais específica.',
      });
    } catch (error) {
      logger.error('Agent chat failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      emit({
        type: 'error',
        message: 'Não consegui falar com o modelo agora. Tente novamente.',
      });
    }
  }

  private async runTool(
    tc: OpenRouterToolCall,
    emit: (e: AgentEvent) => void,
  ): Promise<ChatMessage> {
    emit({ type: 'tool_start', toolCallId: tc.id, name: tc.function.name });
    try {
      const result = await actionRegistry.execute(
        tc.function.name,
        safeParseArgs(tc.function.arguments),
      );
      emit({ type: 'tool_result', toolCallId: tc.id, ok: true });
      return {
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      };
    } catch (error) {
      emit({ type: 'tool_result', toolCallId: tc.id, ok: false });
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify({ error: message }),
      };
    }
  }

  /** Tool calls de escrita da última mensagem assistant que ainda não têm tool result. */
  private undecidedWrites(messages: ChatMessage[]): OpenRouterToolCall[] {
    const last = [...messages]
      .reverse()
      .find(
        (m): m is Extract<ChatMessage, { role: 'assistant' }> =>
          m.role === 'assistant',
      );
    if (!last?.tool_calls) return [];
    const answered = new Set(
      messages
        .filter(
          (m): m is Extract<ChatMessage, { role: 'tool' }> => m.role === 'tool',
        )
        .map((m) => m.tool_call_id),
    );
    return last.tool_calls.filter(
      (tc) =>
        !answered.has(tc.id) &&
        actionRegistry.get(tc.function.name)?.mode === 'write',
    );
  }

  private emitConfirmations(
    messages: ChatMessage[],
    emit: (e: AgentEvent) => void,
  ): void {
    for (const tc of this.undecidedWrites(messages)) {
      emit({
        type: 'confirmation_request',
        toolCallId: tc.id,
        name: tc.function.name,
        args: safeParseArgs(tc.function.arguments),
      });
    }
  }

  /** Executa (ou rejeita) writes pendentes que receberam decisão neste request. */
  private async resolvePendingWrites(
    messages: ChatMessage[],
    decisions: Record<string, boolean>,
  ): Promise<ChatMessage[]> {
    const results: ChatMessage[] = [];
    for (const tc of this.undecidedWrites(messages)) {
      if (!(tc.id in decisions)) continue;
      if (decisions[tc.id]) {
        results.push(await this.runTool(tc, () => undefined));
      } else {
        results.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({
            error:
              'Usuário rejeitou esta ação. Não execute; pergunte como prosseguir.',
          }),
        });
      }
    }
    return results;
  }
}

export const agentService = new AgentService();
