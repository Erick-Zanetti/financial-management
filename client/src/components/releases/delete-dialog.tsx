'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { FinancialRelease } from '@/types/financial-release';
import { useDeleteRelease } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release: FinancialRelease | null;
  month: number;
  year: number;
}

export function DeleteDialog({
  open,
  onOpenChange,
  release,
  month,
  year,
}: DeleteDialogProps) {
  const deleteMutation = useDeleteRelease();
  const { t } = useSettings();

  const handleDelete = async () => {
    if (!release?.id) return;

    try {
      await deleteMutation.mutateAsync({ id: release.id, month, year });
      toast.success(t('releaseDeleted'));
      onOpenChange(false);
    } catch {
      toast.error(t('deleteFailed'));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirmation')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('no')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? t('removing') : t('yes')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
