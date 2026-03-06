'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FinancialRelease, FinancialReleaseType } from '@/types/financial-release';
import { useCreateRelease, useUpdateRelease } from '@/hooks/use-releases';
import { useSettings } from '@/providers/settings-provider';

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
  const [displayValue, setDisplayValue] = useState('');
  const { t, getMonthLabel, formatDisplayValue } = useSettings();

  const formSchema = z.object({
    name: z.string().min(1, t('descriptionRequired')).max(30, t('maxChars')),
    value: z.number().min(0.01, t('valueMustBePositive')),
    day: z.number().min(1, t('invalidDay')).max(31, t('invalidDay')),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: 0,
      day: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (release) {
        form.reset({
          name: release.name,
          value: release.value,
          day: release.day,
        });
        setDisplayValue(formatDisplayValue(release.value));
      } else {
        form.reset({
          name: '',
          value: 0,
          day: 1,
        });
        setDisplayValue('');
      }
    }
  }, [open, release, form, formatDisplayValue]);

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
        toast.success(t('releaseUpdated'));
      } else {
        await createMutation.mutateAsync({
          ...values,
          type,
          month,
          year,
        });
        toast.success(t('releaseSaved'));
      }
      onOpenChange(false);
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? t('edit') : t('add')}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              — {getMonthLabel(month)}/{year}
            </span>
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('day')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? `${t('dayPrefix')} ${field.value}` : t('selectDay')}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(year, month - 1, field.value)}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date.getDate());
                          }
                        }}
                        month={new Date(year, month - 1)}
                        disableNavigation
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('descriptionPlaceholder')}
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
                  <FormLabel>{t('value')}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={displayValue}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const cents = parseInt(digits, 10) || 0;
                        const numeric = cents / 100;
                        if (cents === 0) {
                          setDisplayValue('');
                          field.onChange(0);
                        } else {
                          setDisplayValue(formatDisplayValue(numeric));
                          field.onChange(numeric);
                        }
                      }}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('saving') : t('save')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
