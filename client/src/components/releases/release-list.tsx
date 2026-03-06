'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateRelease, useToggleSettled } from '@/hooks/use-releases';
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
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialRelease, FinancialReleaseType } from '@/types/financial-release';
import { useSettings } from '@/providers/settings-provider';
import { cn } from '@/lib/utils';
import { PieChart } from '@/components/charts/pie-chart';
import { ReleaseDialog } from './release-dialog';
import { DeleteDialog } from './delete-dialog';

interface ReleaseListProps {
  title: string;
  type: FinancialReleaseType;
  releases: FinancialRelease[];
  month: number;
  year: number;
  isLoading?: boolean;
  variant: 'receipt' | 'expense';
  allMonthSettled?: boolean;
}

export function ReleaseList({
  title,
  type,
  releases,
  month,
  year,
  isLoading,
  variant,
  allMonthSettled = false,
}: ReleaseListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<FinancialRelease | null>(null);
  const [deletingRelease, setDeletingRelease] = useState<FinancialRelease | null>(null);

  const { t, formatCurrency } = useSettings();
  const createMutation = useCreateRelease();
  const toggleSettledMutation = useToggleSettled();

  const pieData = allMonthSettled
    ? releases
    : releases.filter((r) => !r.settled);

  const sortedReleases = [...releases].sort((a, b) => a.day - b.day);

  const settledLabel = variant === 'receipt' ? t('received') : t('paid');

  const handleToggleSettled = async (release: FinancialRelease) => {
    if (!release.id) return;
    const newSettled = !release.settled;
    try {
      await toggleSettledMutation.mutateAsync({
        id: release.id,
        settled: newSettled,
        month,
        year,
      });
      toast.success(newSettled ? t('settledSuccess') : t('unsettledSuccess'));
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleClone = async (release: FinancialRelease) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    try {
      await createMutation.mutateAsync({
        name: release.name,
        value: release.value,
        type: release.type,
        category: release.category?.id,
        day: release.day,
        month: nextMonth,
        year: nextYear,
      });
      toast.success(t('releaseCloned'));
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleEdit = (release: FinancialRelease) => {
    setEditingRelease(release);
    setDialogOpen(true);
  };

  const handleDelete = (release: FinancialRelease) => {
    setDeletingRelease(release);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRelease(null);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeletingRelease(null);
  };

  const borderColor = variant === 'receipt'
    ? 'border-t-emerald-500'
    : 'border-t-red-500';

  return (
    <>
      <Card className={cn('border-t-2', borderColor)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
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
          ) : releases.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('noData')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">{t('status')}</TableHead>
                    <TableHead className="w-12">{t('day')}</TableHead>
                    <TableHead>{t('description')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead className="text-right">{t('value')}</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReleases.map((release) => {
                    const isSettled = !!release.settled;
                    return (
                      <TableRow key={release.id} className={cn(isSettled && 'opacity-60')}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSettled}
                            onChange={() => handleToggleSettled(release)}
                            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                            title={isSettled ? settledLabel : t('pending')}
                          />
                        </TableCell>
                        <TableCell className={cn('font-medium', isSettled && 'line-through')}>
                          {release.day}
                        </TableCell>
                        <TableCell className={cn(isSettled && 'line-through')}>
                          {release.name}
                        </TableCell>
                        <TableCell className={cn('text-muted-foreground', isSettled && 'line-through')}>
                          {release.category?.name}
                        </TableCell>
                        <TableCell className={cn('text-right', isSettled && 'line-through')}>
                          {formatCurrency(release.value)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(release)}
                              disabled={isSettled}
                              title={isSettled ? t('cannotEditSettled') : undefined}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleClone(release)}
                              title={t('clone')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(release)}
                              disabled={isSettled}
                              title={isSettled ? t('cannotDeleteSettled') : undefined}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <PieChart data={pieData} />
        </CardContent>
      </Card>

      <ReleaseDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        type={type}
        month={month}
        year={year}
        release={editingRelease}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        release={deletingRelease}
        month={month}
        year={year}
      />
    </>
  );
}
