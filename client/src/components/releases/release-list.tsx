'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialRelease, FinancialReleaseType } from '@/types/financial-release';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
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
}

export function ReleaseList({
  title,
  type,
  releases,
  month,
  year,
  isLoading,
  variant,
}: ReleaseListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<FinancialRelease | null>(null);
  const [deletingRelease, setDeletingRelease] = useState<FinancialRelease | null>(null);

  const total = releases.reduce((sum, r) => sum + r.value, 0);

  const sortedReleases = [...releases].sort((a, b) => a.day - b.day);

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
            <span className="hidden sm:inline">Adicionar</span>
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
              Sem dados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Dia</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Pessoa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReleases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell className="font-medium">{release.day}</TableCell>
                      <TableCell>{release.name}</TableCell>
                      <TableCell className="capitalize">
                        {release.person.toLowerCase()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(release.value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(release)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(release)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
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
