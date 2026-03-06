'use client';

import { useSettings } from '@/providers/settings-provider';

export default function CategoriasPage() {
  const { t } = useSettings();

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold">{t('categories')}</h1>
    </div>
  );
}
