'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FloatingSelect,
  FloatingSelectTrigger,
  FloatingSelectValue,
  FloatingSelectContent,
  FloatingSelectItem,
} from '@/components/ui/floating-select';
import { FloatingInput } from '@/components/ui/floating-input';
import { FloatingTextarea } from '@/components/ui/floating-textarea';
import { useSettings } from '@/providers/settings-provider';
import { Language } from '@/lib/translations';
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/use-system-config';

export default function ConfiguracoesPage() {
  const { language, currency, setLanguage, setCurrency, t } = useSettings();
  const { theme, setTheme } = useTheme();

  const { data: systemConfig } = useSystemConfig();
  const updateConfigMutation = useUpdateSystemConfig();

  const [aiEnabled, setAiEnabled] = useState(false);
  const [openRouterToken, setOpenRouterToken] = useState('');
  const [tokenTouched, setTokenTouched] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiOutputLanguage, setAiOutputLanguage] = useState('pt');

  useEffect(() => {
    if (systemConfig) {
      setAiEnabled(systemConfig.aiIntegrationEnabled);
      setOpenRouterToken(systemConfig.openRouterToken);
      setTokenTouched(false);
      setAiCustomPrompt(systemConfig.aiCustomPrompt);
      setAiModel(systemConfig.aiModel);
      setAiOutputLanguage(systemConfig.aiOutputLanguage);
    }
  }, [systemConfig]);

  const handleSaveAiConfig = async () => {
    if (aiEnabled && tokenTouched && !openRouterToken.trim()) {
      toast.error(t('openRouterTokenRequired'));
      return;
    }

    if (aiEnabled && !aiModel.trim()) {
      toast.error(t('aiModelRequired'));
      return;
    }

    try {
      await updateConfigMutation.mutateAsync({
        aiIntegrationEnabled: aiEnabled,
        ...(tokenTouched ? { openRouterToken } : {}),
        aiCustomPrompt,
        aiModel,
        aiOutputLanguage,
      });
      toast.success(t('aiConfigSaved'));
    } catch {
      toast.error(t('aiConfigSaveFailed'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
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

        <Card>
          <CardContent className="pt-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-sm">{t('aiIntegrationEnabled')}</span>
            </label>

            {aiEnabled && (
              <>
                <FloatingInput
                  label={t('openRouterToken')}
                  type={tokenTouched ? 'password' : 'text'}
                  value={openRouterToken}
                  onFocus={() => {
                    if (!tokenTouched) {
                      setOpenRouterToken('');
                      setTokenTouched(true);
                    }
                  }}
                  onChange={(e) => setOpenRouterToken(e.target.value)}
                />

                <FloatingInput
                  label={t('aiModel')}
                  placeholder={t('aiModelPlaceholder')}
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                />

                <FloatingSelect value={aiOutputLanguage} onValueChange={setAiOutputLanguage}>
                  <FloatingSelectTrigger label={t('aiOutputLanguage')}>
                    <FloatingSelectValue />
                  </FloatingSelectTrigger>
                  <FloatingSelectContent>
                    <FloatingSelectItem value="pt">{t('portuguese')}</FloatingSelectItem>
                    <FloatingSelectItem value="en">{t('english')}</FloatingSelectItem>
                  </FloatingSelectContent>
                </FloatingSelect>

                <div className="relative">
                  <FloatingTextarea
                    label={t('aiCustomPrompt')}
                    maxLength={5000}
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder={t('aiCustomPromptPlaceholder')}
                    className="min-h-[200px]"
                  />
                  <div className="text-xs text-muted-foreground text-right mt-1">
                    {aiCustomPrompt.length}/5000
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleSaveAiConfig}
              disabled={updateConfigMutation.isPending}
              className="w-full"
            >
              {updateConfigMutation.isPending ? t('saving') : t('save')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
