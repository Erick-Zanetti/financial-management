'use client';

import { Cog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { DisplayEntry } from '@/types/agent';

interface AgentMessageListProps {
  entries: DisplayEntry[];
  renderConfirmation?: (entry: DisplayEntry) => React.ReactNode;
}

const TOOL_LABELS: Record<string, { pt: string; en: string }> = {
  list_releases: { pt: 'lançamentos', en: 'releases' },
  search_releases: { pt: 'busca de lançamentos', en: 'release search' },
  get_release: { pt: 'lançamento', en: 'release' },
  list_categories: { pt: 'categorias', en: 'categories' },
  get_dashboard_summary: { pt: 'resumo do dashboard', en: 'dashboard summary' },
};

export function AgentMessageList({
  entries,
  renderConfirmation,
}: AgentMessageListProps) {
  const { t, language } = useSettings();

  if (entries.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-muted-foreground">
        {t('agentEmptyState')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-1 py-2">
      {entries.map((entry) => {
        if (entry.confirmation && renderConfirmation) {
          return <div key={entry.id}>{renderConfirmation(entry)}</div>;
        }
        if (entry.role === 'tool-chip') {
          const label =
            TOOL_LABELS[entry.content]?.[language === 'pt' ? 'pt' : 'en'] ??
            entry.content;
          return (
            <span
              key={entry.id}
              className="inline-flex w-fit items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              <Cog className="h-3 w-3" />
              {t('agentToolPrefix')} {label}…
            </span>
          );
        }
        if (!entry.content) return null;
        return (
          <div
            key={entry.id}
            className={cn(
              'max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed',
              entry.role === 'user'
                ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
                : 'self-start rounded-bl-sm bg-muted',
            )}
          >
            {entry.content}
          </div>
        );
      })}
    </div>
  );
}
