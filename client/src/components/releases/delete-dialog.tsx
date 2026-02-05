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

  const handleDelete = async () => {
    if (!release?.id) return;

    try {
      await deleteMutation.mutateAsync({ id: release.id, month, year });
      toast.success('Lançamento removido com sucesso!');
      onOpenChange(false);
    } catch {
      toast.error('Falha ao remover. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente remover esse lançamento?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Não</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Removendo...' : 'Sim'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
