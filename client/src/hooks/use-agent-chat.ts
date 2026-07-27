'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api/client';
import { getScreenContext } from '@/lib/agent-screen-context';
import {
  AgentEvent,
  ChatMessage,
  DisplayEntry,
  PendingConfirmation,
  ScreenContext,
} from '@/types/agent';

const STORAGE_KEY = 'agent-chat-v1';
// Servidor rejeita >200 mensagens; manter folga e cortar em fronteira de
// turno (mensagem user) para nunca órfãos de tool_calls no protocolo.
const MAX_HISTORY = 80;
const MAX_DISPLAY = 300;

function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_HISTORY) return messages;
  const from = messages.length - MAX_HISTORY;
  for (let i = from; i < messages.length; i++) {
    if (messages[i].role === 'user') return messages.slice(i);
  }
  return messages.slice(from);
}

interface StoredState {
  history: ChatMessage[];
  display: DisplayEntry[];
}

interface TurnRequest {
  messages: ChatMessage[];
  screenContext?: ScreenContext;
  decisions?: Record<string, boolean>;
}

let entryCounter = 0;
function nextEntryId(): string {
  entryCounter += 1;
  return `e${Date.now()}-${entryCounter}`;
}

function loadStored(): StoredState {
  if (typeof window === 'undefined') return { history: [], display: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { history: [], display: [] };
    const parsed = JSON.parse(raw) as StoredState;
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      display: Array.isArray(parsed.display) ? parsed.display : [],
    };
  } catch {
    return { history: [], display: [] };
  }
}

async function streamAgentEvents(
  body: TurnRequest,
  onEvent: (e: AgentEvent) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) {
    throw new Error(`Agent error: ${response.status}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          onEvent(JSON.parse(line.slice(6)) as AgentEvent);
        } catch {
          // chunk malformado: ignora
        }
      }
    }
  }
}

export function useAgentChat(errorMessage: string) {
  const queryClient = useQueryClient();
  const initial = useRef<StoredState | null>(null);
  if (initial.current === null) {
    initial.current = loadStored();
  }
  const [display, setDisplay] = useState<DisplayEntry[]>(
    initial.current.display,
  );
  const [sending, setSending] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);
  const historyRef = useRef<ChatMessage[]>(initial.current.history);
  const displayRef = useRef<DisplayEntry[]>(initial.current.display);

  const persist = useCallback(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          history: historyRef.current,
          display: displayRef.current,
        }),
      );
    } catch {
      // quota cheia: segue sem persistir
    }
  }, []);

  useEffect(() => {
    displayRef.current = display;
    persist();
  }, [display, persist]);

  const runTurn = useCallback(
    async (requestInput: TurnRequest) => {
      setSending(true);
      historyRef.current = trimHistory(historyRef.current);
      const request = { ...requestInput, messages: historyRef.current };
      const streamingId = nextEntryId();
      let streamedText = '';
      const approvedWrite = Object.values(request.decisions ?? {}).some(
        Boolean,
      );

      try {
        await streamAgentEvents(request, (event) => {
          switch (event.type) {
            case 'token':
              streamedText += event.content;
              setDisplay((prev) => {
                const others = prev.filter((d) => d.id !== streamingId);
                return [
                  ...others,
                  { id: streamingId, role: 'assistant', content: streamedText },
                ];
              });
              break;
            case 'assistant_message': {
              historyRef.current = [...historyRef.current, event.message];
              const content =
                event.message.role === 'assistant'
                  ? event.message.content
                  : null;
              if (content) {
                streamedText = '';
                setDisplay((prev) => {
                  const others = prev.filter((d) => d.id !== streamingId);
                  return [
                    ...others,
                    { id: nextEntryId(), role: 'assistant', content },
                  ];
                });
              }
              break;
            }
            case 'tool_message':
              historyRef.current = [...historyRef.current, event.message];
              break;
            case 'tool_start':
              setDisplay((prev) => [
                ...prev,
                { id: nextEntryId(), role: 'tool-chip', content: event.name },
              ]);
              break;
            case 'confirmation_request': {
              const confirmation: PendingConfirmation = {
                toolCallId: event.toolCallId,
                name: event.name,
                args: event.args,
              };
              setPendingConfirmation(confirmation);
              setDisplay((prev) => {
                // O servidor re-emite pedidos ainda pendentes a cada resume;
                // se o card já está na tela sem resposta, não duplicar.
                const alreadyShown = prev.some(
                  (d) =>
                    d.confirmation?.toolCallId === event.toolCallId &&
                    !d.confirmation.resolved,
                );
                if (alreadyShown) return prev;
                return [
                  ...prev,
                  {
                    id: nextEntryId(),
                    role: 'assistant',
                    content: '',
                    confirmation,
                  },
                ];
              });
              break;
            }
            case 'error':
              setDisplay((prev) => [
                ...prev,
                { id: nextEntryId(), role: 'assistant', content: event.message },
              ]);
              break;
            case 'tool_result':
            case 'done':
              break;
          }
        });
      } catch {
        setDisplay((prev) => [
          ...prev,
          { id: nextEntryId(), role: 'assistant', content: errorMessage },
        ]);
      } finally {
        setSending(false);
        setDisplay((prev) =>
          prev.length > MAX_DISPLAY ? prev.slice(-MAX_DISPLAY) : prev,
        );
        persist();
        if (approvedWrite) {
          queryClient.invalidateQueries();
        }
      }
    },
    [errorMessage, persist, queryClient],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      historyRef.current = [...historyRef.current, userMessage];
      setDisplay((prev) => [
        ...prev,
        { id: nextEntryId(), role: 'user', content: trimmed },
      ]);
      await runTurn({
        messages: historyRef.current,
        screenContext: getScreenContext(),
      });
    },
    [runTurn, sending],
  );

  const respondToConfirmation = useCallback(
    async (toolCallId: string, approved: boolean) => {
      if (sending) return;
      setPendingConfirmation(null);
      setDisplay((prev) =>
        prev.map((d) =>
          d.confirmation?.toolCallId === toolCallId
            ? {
                ...d,
                confirmation: {
                  ...d.confirmation,
                  resolved: approved ? 'approved' : 'rejected',
                },
              }
            : d,
        ),
      );
      await runTurn({
        messages: historyRef.current,
        screenContext: getScreenContext(),
        decisions: { [toolCallId]: approved },
      });
    },
    [runTurn, sending],
  );

  const clear = useCallback(() => {
    historyRef.current = [];
    setDisplay([]);
    setPendingConfirmation(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // indisponível: ignora
    }
  }, []);

  return {
    display,
    sending,
    pendingConfirmation,
    sendMessage,
    respondToConfirmation,
    clear,
  };
}
