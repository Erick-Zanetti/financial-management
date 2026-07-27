'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSettings } from '@/providers/settings-provider';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { publishScreenContext } from '@/lib/agent-screen-context';
import { AgentMessageList } from './agent-message-list';
import { AgentConfirmationCard } from './agent-confirmation-card';

export function AgentPanel() {
  const { t } = useSettings();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const {
    display,
    sending,
    sendMessage,
    respondToConfirmation,
    respondToAll,
    clear,
  } = useAgentChat(t('agentErrorGeneric'));

  const pendingCount = display.filter(
    (d) => d.confirmation && !d.confirmation.resolved,
  ).length;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publishScreenContext({ route: pathname ?? '/' });
  }, [pathname]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [display, sending, open]);

  const handleSend = () => {
    const text = input;
    setInput('');
    void sendMessage(text);
  };

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label={t('agentTitle')}
      >
        <Sparkles className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          {/* Mesmo estilo/posicionamento do X que o SheetContent injeta (right-4 top-4) */}
          <button
            type="button"
            onClick={clear}
            aria-label={t('agentClear')}
            className="absolute right-12 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              {t('agentTitle')}
            </SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3">
            <AgentMessageList
              entries={display}
              renderConfirmation={(entry) =>
                entry.confirmation ? (
                  <AgentConfirmationCard
                    confirmation={entry.confirmation}
                    onRespond={(toolCallId, approved) =>
                      void respondToConfirmation(toolCallId, approved)
                    }
                    disabled={sending}
                  />
                ) : null
              }
            />
            {sending && (
              <span className="mb-2 ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('agentThinking')}
              </span>
            )}
          </div>

          {pendingCount > 1 && !sending && (
            <div className="flex items-center justify-between border-t px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {pendingCount} {t('agentPendingActions')}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => void respondToAll(true)}
                >
                  {t('agentApproveAll')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => void respondToAll(false)}
                >
                  {t('agentRejectAll')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 border-t p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('agentPlaceholder')}
              rows={Math.min(3, Math.max(1, input.split('\n').length))}
              className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label={t('agentSend')}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
