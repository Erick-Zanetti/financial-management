'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
  FormMessage,
} from '@/components/ui/form';
import { FloatingInput } from '@/components/ui/floating-input';
import { FloatingTextarea } from '@/components/ui/floating-textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Plus, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FinancialRelease, FinancialReleaseType } from '@/types/financial-release';
import { useCreateRelease, useUpdateRelease } from '@/hooks/use-releases';
import { useCategories } from '@/hooks/use-categories';
import { useSettings } from '@/providers/settings-provider';
import { useSystemConfig } from '@/hooks/use-system-config';
import { AiPdfProcessor } from './ai-pdf-processor';

interface ReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: FinancialReleaseType;
  month: number;
  year: number;
  release?: FinancialRelease | null;
}

function SubcategorySummary({
  subcategories,
  total,
  formatCurrency,
}: {
  subcategories: { name: string; value: number }[];
  total: number;
  formatCurrency: (v: number) => string;
}) {
  const sum = subcategories.reduce((acc, s) => acc + s.value, 0);
  const match = sum <= total + 0.01;
  return (
    <div className={cn('text-xs text-right', match ? 'text-muted-foreground' : 'text-destructive font-medium')}>
      {formatCurrency(sum)} / {formatCurrency(total)}
    </div>
  );
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
  const { data: allCategories = [] } = useCategories();
  const { data: systemConfig } = useSystemConfig();
  const categories = allCategories.filter((cat) => (cat.type as string) === type || cat.type === 'B');

  const [aiViewActive, setAiViewActive] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const subcategorySchema = z.object({
    name: z.string().min(1, t('descriptionRequired')),
    value: z.number().min(0.01, t('valueMustBePositive')),
  });

  const formSchema = z.object({
    name: z.string().min(1, t('descriptionRequired')).max(30, t('maxChars')),
    value: z.number().min(0.01, t('valueMustBePositive')),
    day: z.number().min(1, t('invalidDay')).max(31, t('invalidDay')),
    category: z.string().min(1, t('categoryRequired')),
    observations: z.string().max(200, t('maxCharsObservations')),
    subcategories: z.array(subcategorySchema),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: 0,
      day: 1,
      category: '',
      observations: '',
      subcategories: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subcategories',
  });

  const selectedCategoryId = form.watch('category');
  const selectedCategory = allCategories.find((c) => c.id === selectedCategoryId);
  const showSubcategories = selectedCategory?.allowSubcategories === true;
  const showAiIntegration =
    showSubcategories &&
    selectedCategory?.allowAiIntegration === true &&
    systemConfig?.aiIntegrationEnabled === true;

  const [subDisplayValues, setSubDisplayValues] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setAiViewActive(false);
      setAiProcessing(false);
      if (release) {
        const subs = release.subcategories ?? [];
        form.reset({
          name: release.name,
          value: release.value,
          day: release.day,
          category: release.category?.id || '',
          observations: release.observations || '',
          subcategories: subs,
        });
        setDisplayValue(formatDisplayValue(release.value));
        setSubDisplayValues(subs.map((s) => formatDisplayValue(s.value)));
      } else {
        form.reset({
          name: '',
          value: 0,
          day: 1,
          category: '',
          observations: '',
          subcategories: [],
        });
        setDisplayValue('');
        setSubDisplayValues([]);
      }
    }
  }, [open, release, form, formatDisplayValue]);

  const onSubmit = async (values: FormValues) => {
    const subcategories = showSubcategories && values.subcategories && values.subcategories.length > 0
      ? values.subcategories
      : undefined;

    if (subcategories) {
      const sum = subcategories.reduce((acc, s) => acc + s.value, 0);
      if (sum > values.value + 0.01) {
        form.setError('subcategories', { message: t('subcategorySumMismatch') });
        return;
      }
    }

    try {
      const payload = {
        ...values,
        type,
        month,
        year,
        subcategories,
      };
      if (isEditing && release?.id) {
        await updateMutation.mutateAsync({ id: release.id, data: payload });
        toast.success(t('releaseUpdated'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('releaseSaved'));
      }
      onOpenChange(false);
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && aiProcessing) return;
    if (!newOpen) {
      setAiViewActive(false);
      setAiProcessing(false);
    }
    onOpenChange(newOpen);
  };

  const handleAiAccept = async (result: {
    total: number;
    subcategories: Array<{ name: string; value: number }>;
  }) => {
    form.setValue('value', result.total);
    form.setValue('subcategories', result.subcategories);
    setDisplayValue(formatDisplayValue(result.total));
    setSubDisplayValues(result.subcategories.map((s) => formatDisplayValue(s.value)));
    setAiViewActive(false);

    await form.handleSubmit(onSubmit)();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        hideClose={aiProcessing}
        onInteractOutside={(e) => { if (aiProcessing) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (aiProcessing) e.preventDefault(); }}
      >
        <SheetHeader>
          <SheetTitle>
            {aiViewActive ? t('fillWithAi') : isEditing ? t('edit') : t('add')}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              — {getMonthLabel(month)}/{year}
            </span>
          </SheetTitle>
        </SheetHeader>

        {aiViewActive ? (
          <div className="mt-8 flex-1 min-h-0 flex flex-col">
            <AiPdfProcessor
              onAccept={handleAiAccept}
              onBack={() => setAiViewActive(false)}
              onProcessingChange={setAiProcessing}
            />
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-8">
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="relative">
                          <button
                            type="button"
                            className={cn(
                              'flex h-12 w-full items-center rounded-lg border border-input bg-transparent px-3 pt-5 pb-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-left',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? `${t('dayPrefix')} ${field.value}` : t('selectDay')}
                          </button>
                          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                            {t('day')}
                          </span>
                        </div>
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
                  <FormControl>
                    <div className="relative">
                      <FloatingInput
                        label={t('description')}
                        maxLength={30}
                        {...field}
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {field.value?.length || 0}/30
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <div className="relative">
                        <SelectTrigger
                          className={cn(
                            'h-12 rounded-lg pt-5 pb-1 text-sm',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <SelectValue placeholder={t('category')} />
                        </SelectTrigger>
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                          {t('category')}
                        </span>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingInput
                      label={t('value')}
                      type="text"
                      inputMode="numeric"
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

            {showSubcategories && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('subcategories')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      append({ name: '', value: 0 });
                      setSubDisplayValues((prev) => [...prev, '']);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('addSubcategory')}
                  </Button>
                </div>
                {showAiIntegration && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAiViewActive(true)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {t('fillWithAi')}
                  </Button>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`subcategories.${index}.name`}
                      render={({ field: nameField }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <FloatingInput
                              label={t('subcategoryName')}
                              {...nameField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`subcategories.${index}.value`}
                      render={({ field: valField }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <FloatingInput
                              label={t('value')}
                              type="text"
                              inputMode="numeric"
                              value={subDisplayValues[index] ?? ''}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '');
                                const cents = parseInt(digits, 10) || 0;
                                const numeric = cents / 100;
                                setSubDisplayValues((prev) => {
                                  const next = [...prev];
                                  next[index] = cents === 0 ? '' : formatDisplayValue(numeric);
                                  return next;
                                });
                                valField.onChange(numeric);
                              }}
                              onBlur={valField.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 mt-2 shrink-0 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        remove(index);
                        setSubDisplayValues((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {fields.length > 0 && (
                  <SubcategorySummary
                    subcategories={form.watch('subcategories') ?? []}
                    total={form.watch('value')}
                    formatCurrency={formatDisplayValue}
                  />
                )}

                {form.formState.errors.subcategories?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.subcategories.message}
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <FloatingTextarea
                        label={t('observations')}
                        maxLength={200}
                        {...field}
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {field.value?.length || 0}/200
                      </div>
                    </div>
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
        )}
      </SheetContent>
    </Sheet>
  );
}
