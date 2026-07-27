export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ChatMessage =
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
      args: Record<string, unknown>;
    }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface PendingConfirmation {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  resolved?: 'approved' | 'rejected';
}

export interface DisplayEntry {
  id: string;
  role: 'user' | 'assistant' | 'tool-chip';
  content: string;
  confirmation?: PendingConfirmation;
}
