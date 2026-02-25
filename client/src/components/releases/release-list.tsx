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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialRelease, FinancialReleaseType, Person } from '@/types/financial-release';
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
  defaultPerson?: Person;
  onPersonCreated?: (person: Person) => void;
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
  defaultPerson,
  onPersonCreated,
  allMonthSettled = false,
}: ReleaseListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<FinancialRelease | null>(null);
  const [deletingRelease, setDeletingRelease] = useState<FinancialRelease | null>(null);

  const { t, formatCurrency } = useSettings();
  const createMutation = useCreateRelease();
  const toggleSettledMutation = useToggleSettled();

  const activeReleases = allMonthSettled
    ? releases
    : releases.filter((r) => !r.settled);
  const total = activeReleases.reduce((sum, r) => sum + r.value, 0);

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
        person: release.person,
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
    ? 'border-l-emerald-500'
    : 'border-l-red-500';

  return (
    <>
      <Card className={cn('border-l-4', borderColor)}>
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
                    <TableHead className="w-12">{t('day')}</TableHead>
                    <TableHead>{t('description')}</TableHead>
                    <TableHead>{t('person')}</TableHead>
                    <TableHead className="text-right">{t('value')}</TableHead>
                    <TableHead className="w-28">{t('status')}</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReleases.map((release) => {
                    const isSettled = !!release.settled;
                    return (
                      <TableRow key={release.id} className={cn(isSettled && 'opacity-60')}>
                        <TableCell className={cn('font-medium', isSettled && 'line-through')}>
                          {release.day}
                        </TableCell>
                        <TableCell className={cn(isSettled && 'line-through')}>
                          {release.name}
                        </TableCell>
                        <TableCell className={cn('capitalize', isSettled && 'line-through')}>
                          {release.person.toLowerCase()}
                        </TableCell>
                        <TableCell className={cn('text-right', isSettled && 'line-through')}>
                          {formatCurrency(release.value)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={isSettled ? 'settled' : 'pending'}
                            onValueChange={() => handleToggleSettled(release)}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{t('pending')}</SelectItem>
                              <SelectItem value="settled">{settledLabel}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
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
                              className="h-8 w-8 text-destructive hover:text-destructive"
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
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-medium">
                      {t('total')}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
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
        defaultPerson={defaultPerson}
        onPersonCreated={onPersonCreated}
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
