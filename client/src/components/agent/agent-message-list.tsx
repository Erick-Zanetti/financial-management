'use client';

import { Cog } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { DisplayEntry } from '@/types/agent';

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <p className="mb-1 mt-2 text-sm font-bold first:mt-0">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="mb-1 mt-2 text-sm font-semibold first:mt-0">
            {children}
          </p>
        ),
        h3: ({ children }) => (
          <p className="mb-0.5 mt-1.5 text-sm font-semibold first:mt-0">
            {children}
          </p>
        ),
        p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-1 list-disc space-y-0.5 pl-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1 list-decimal space-y-0.5 pl-4">{children}</ol>
        ),
        code: ({ children }) => (
          <code className="rounded bg-background/60 px-1 py-0.5 text-[0.8em]">
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-2 border-border" />,
        table: ({ children }) => (
          <div className="my-1.5 overflow-x-auto">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-background/40 px-2 py-1 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1 align-top">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-1 border-l-2 border-border pl-2 text-muted-foreground">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

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
              'max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed',
              entry.role === 'user'
                ? 'self-end whitespace-pre-wrap rounded-br-sm bg-primary text-primary-foreground'
                : 'self-start rounded-bl-sm bg-muted',
            )}
          >
            {entry.role === 'user' ? (
              entry.content
            ) : (
              <AssistantMarkdown content={entry.content} />
            )}
          </div>
        );
      })}
    </div>
  );
}
