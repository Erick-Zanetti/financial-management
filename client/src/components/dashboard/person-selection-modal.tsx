'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Person } from '@/types/financial-release';
import { useSettings } from '@/providers/settings-provider';

type PersonPreference = Person | 'all';

interface PersonSelectionModalProps {
  open: boolean;
  onSelect: (value: PersonPreference) => void;
}

export function PersonSelectionModal({ open, onSelect }: PersonSelectionModalProps) {
  const { t } = useSettings();

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[360px] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{t('whoAreYou')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('personSelectionDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            size="lg"
            onClick={() => onSelect(Person.ERICK)}
          >
            Erick
          </Button>
          <Button
            size="lg"
            onClick={() => onSelect(Person.JULIA)}
          >
            Julia
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onSelect('all')}
          >
            {t('all')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
