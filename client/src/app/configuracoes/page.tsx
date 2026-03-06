'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FloatingSelect,
  FloatingSelectTrigger,
  FloatingSelectValue,
  FloatingSelectContent,
  FloatingSelectItem,
} from '@/components/ui/floating-select';
import { useSettings } from '@/providers/settings-provider';
import { Language } from '@/lib/translations';

export default function ConfiguracoesPage() {
  const { language, currency, setLanguage, setCurrency, t } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FloatingSelect value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <FloatingSelectTrigger label={t('language')}>
                <FloatingSelectValue />
              </FloatingSelectTrigger>
              <FloatingSelectContent>
                <FloatingSelectItem value="pt">{t('portuguese')}</FloatingSelectItem>
                <FloatingSelectItem value="en">{t('english')}</FloatingSelectItem>
              </FloatingSelectContent>
            </FloatingSelect>

            <FloatingSelect value={currency} onValueChange={(v) => setCurrency(v as 'BRL' | 'USD')}>
              <FloatingSelectTrigger label={t('currency')}>
                <FloatingSelectValue />
              </FloatingSelectTrigger>
              <FloatingSelectContent>
                <FloatingSelectItem value="BRL">R$ — BRL</FloatingSelectItem>
                <FloatingSelectItem value="USD">$ — USD</FloatingSelectItem>
              </FloatingSelectContent>
            </FloatingSelect>

            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-12 w-full justify-start pt-5 pb-1 gap-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-4">{t('toggleTheme')}</span>
              </Button>
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                {t('theme')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
