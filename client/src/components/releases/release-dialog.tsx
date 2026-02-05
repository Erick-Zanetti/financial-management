'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FinancialRelease, FinancialReleaseType, Person } from '@/types/financial-release';
import { useCreateRelease, useUpdateRelease } from '@/hooks/use-releases';
import { getMonthLabel } from '@/lib/months';

const formSchema = z.object({
  name: z.string().min(1, 'Descrição é obrigatória').max(30, 'Máximo 30 caracteres'),
  value: z.number().min(0.01, 'Valor deve ser maior que zero'),
  day: z.number().min(1, 'Dia inválido').max(31, 'Dia inválido'),
  person: z.nativeEnum(Person, { message: 'Pessoa é obrigatória' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: FinancialReleaseType;
  month: number;
  year: number;
  release?: FinancialRelease | null;
}

export function ReleaseDialog({
  open,
  onOpenChange,
  type,
  month,
  year,
  release,
}: ReleaseDialogProps) {
  const isEditing = !!release;
  const createMutation = useCreateRelease();
  const updateMutation = useUpdateRelease();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: 0,
      day: 1,
      person: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (release) {
        form.reset({
          name: release.name,
          value: release.value,
          day: release.day,
          person: release.person,
        });
      } else {
        form.reset({
          name: '',
          value: 0,
          day: 1,
          person: undefined,
        });
      }
    }
  }, [open, release, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && release?.id) {
        await updateMutation.mutateAsync({
          id: release.id,
          data: {
            ...values,
            type,
            month,
            year,
          },
        });
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync({
          ...values,
          type,
          month,
          year,
        });
        toast.success('Lançamento salvo com sucesso!');
      }
      onOpenChange(false);
    } catch {
      toast.error('Falha ao salvar. Tente novamente.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{isEditing ? 'Editar' : 'Adicionar'}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {getMonthLabel(month)}/{year}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pessoa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma pessoa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Person.ERICK}>Erick</SelectItem>
                      <SelectItem value={Person.JULIA}>Julia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={31} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição"
                      maxLength={30}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/30
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
