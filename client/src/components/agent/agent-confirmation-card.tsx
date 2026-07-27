'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/providers/settings-provider';
import { useCategories } from '@/hooks/use-categories';
import { PendingConfirmation } from '@/types/agent';
import { TranslationKey } from '@/lib/translations';

interface AgentConfirmationCardProps {
  confirmation: PendingConfirmation;
  onRespond: (toolCallId: string, approved: boolean) => void;
  disabled: boolean;
}

const TITLE_BY_ACTION: Record<string, TranslationKey> = {
  create_release: 'agentConfirmCreate',
  update_release: 'agentConfirmUpdate',
  delete_release: 'agentConfirmDelete',
};

const FIELD_LABELS: Record<string, TranslationKey> = {
  name: 'agentFieldName',
  value: 'agentFieldValue',
  type: 'agentFieldType',
  category: 'agentFieldCategory',
  person: 'agentFieldPerson',
  day: 'agentFieldDate',
  settled: 'agentFieldSettled',
  id: 'agentFieldId',
};

export function AgentConfirmationCard({
  confirmation,
  onRespond,
  disabled,
}: AgentConfirmationCardProps) {
  const { t, formatDisplayValue } = useSettings();
  const { data: categories = [] } = useCategories();

  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      if (c.id) map.set(c.id, c.name);
    });
    return map;
  }, [categories]);

  const args = confirmation.args;

  const rows = useMemo(() => {
    const result: Array<{ label: string; value: string }> = [];
    const push = (key: string, value: string) => {
      const labelKey = FIELD_LABELS[key];
      result.push({ label: labelKey ? t(labelKey) : key, value });
    };

    Object.entries(args).forEach(([key, raw]) => {
      if (raw === undefined || raw === null) return;
      switch (key) {
        case 'value':
          push(key, formatDisplayValue(Number(raw)));
          break;
        case 'type':
          push(key, raw === 'R' ? t('agentTypeReceipt') : t('agentTypeExpense'));
          break;
        case 'category':
          push(key, categoryNames.get(String(raw)) ?? String(raw));
          break;
        case 'year':
        case 'month':
          break;
        case 'day': {
          const year = args.year;
          const month = args.month;
          const pad = (n: unknown) => String(n).padStart(2, '0');
          push(
            key,
            year && month
              ? `${pad(raw)}/${pad(month)}/${year}`
              : String(raw),
          );
          break;
        }
        case 'settled':
          push(key, raw ? t('yes') : t('no'));
          break;
        case 'subcategories':
          if (Array.isArray(raw) && raw.length > 0) {
            push(
              key,
              raw
                .map((s: { category?: string; value?: number }) => {
                  const name = categoryNames.get(String(s.category)) ?? '?';
                  return `${name}: ${formatDisplayValue(Number(s.value ?? 0))}`;
                })
                .join(', '),
            );
          }
          break;
        case 'useAiIntegration':
        case 'aiReport':
          break;
        default:
          push(key, String(raw));
      }
    });
    return result;
  }, [args, categoryNames, formatDisplayValue, t]);

  const titleKey = TITLE_BY_ACTION[confirmation.name];

  return (
    <div className="w-[92%] self-start overflow-hidden rounded-lg border border-amber-500/50">
      <div className="bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        {titleKey ? t(titleKey) : confirmation.name}
      </div>
      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5 px-3 py-2 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2 px-3 pb-2.5">
        {confirmation.resolved ? (
          <Badge
            variant={
              confirmation.resolved === 'approved' ? 'default' : 'secondary'
            }
          >
            {confirmation.resolved === 'approved'
              ? t('agentApproved')
              : t('agentRejected')}
          </Badge>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={() => onRespond(confirmation.toolCallId, true)}
            >
              <Check className="mr-1 h-3 w-3" />
              {t('agentApprove')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={() => onRespond(confirmation.toolCallId, false)}
            >
              <X className="mr-1 h-3 w-3" />
              {t('agentReject')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
