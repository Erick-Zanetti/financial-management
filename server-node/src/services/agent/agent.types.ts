export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface ScreenContext {
  route: string;
  year?: number;
  month?: number;
}

export interface AgentChatRequest {
  messages: ChatMessage[];
  screenContext?: ScreenContext;
  decisions?: Record<string, boolean>;
}

export type AgentEvent =
  | { type: 'token'; content: string }
  | { type: 'assistant_message'; message: ChatMessage }
  | { type: 'tool_message'; message: ChatMessage }
  | { type: 'tool_start'; toolCallId: string; name: string }
  | { type: 'tool_result'; toolCallId: string; ok: boolean }
  | {
      type: 'confirmation_request';
      toolCallId: string;
      name: string;
      args: unknown;
    }
  | { type: 'done' }
  | { type: 'error'; message: string };
