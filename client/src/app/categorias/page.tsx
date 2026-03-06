'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FloatingInput } from '@/components/ui/floating-input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import { Category, CategoryType } from '@/types/category';

export default function CategoriasPage() {
  const { t } = useSettings();
  const { data: categories = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const formSchema = z.object({
    name: z.string().min(1, t('categoryNameRequired')).max(50),
    type: z.nativeEnum(CategoryType, { message: t('categoryTypeRequired') }),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', type: CategoryType.Expense },
  });

  const handleAdd = () => {
    setEditingCategory(null);
    form.reset({ name: '', type: CategoryType.Expense });
    setSheetOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({ name: category.name, type: category.type });
    setSheetOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingCategory(null);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: values });
        toast.success(t('categoryUpdated'));
      } else {
        await createMutation.mutateAsync(values);
        toast.success(t('categoryCreated'));
      }
      handleSheetClose();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      toast.success(t('categoryDeleted'));
      setDeleteDialogOpen(false);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 409) {
        toast.error(t('categoryInUse'));
      } else {
        toast.error(t('categoryDeleteFailed'));
      }
    }
  };

  const getTypeLabel = (type: CategoryType) => t(
    type === CategoryType.Receipt ? 'categoryTypeReceipt'
    : type === CategoryType.Expense ? 'categoryTypeExpense'
    : 'categoryTypeBoth'
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{t('categories')}</CardTitle>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{t('add')}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categoryName')}</TableHead>
                  <TableHead>{t('categoryType')}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getTypeLabel(category.type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {editingCategory ? t('editCategory') : t('addCategory')}
            </SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingInput
                        label={t('categoryName')}
                        maxLength={50}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
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
                            <SelectValue placeholder={t('categoryType')} />
                          </SelectTrigger>
                          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                            {t('categoryType')}
                          </span>
                        </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CategoryType.Expense}>{t('categoryTypeExpense')}</SelectItem>
                        <SelectItem value={CategoryType.Receipt}>{t('categoryTypeReceipt')}</SelectItem>
                        <SelectItem value={CategoryType.Both}>{t('categoryTypeBoth')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSheetClose}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteCategory')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('no')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              {deleteMutation.isPending ? t('removing') : t('yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
