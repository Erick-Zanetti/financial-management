'use client';

import { useCallback, useRef, useState } from 'react';
import { Download, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcessPdf } from '@/hooks/use-ai-processing';
import { useSettings } from '@/providers/settings-provider';

interface AiPdfProcessorProps {
  onAccept: (result: {
    total: number;
    subcategories: Array<{ name: string; value: number }>;
  }) => void;
  onBack: () => void;
  onProcessingChange: (processing: boolean) => void;
}

type Phase = 'upload' | 'processing' | 'review';

interface ReviewSubcategory {
  name: string;
  value: number;
  displayValue: string;
}

export function AiPdfProcessor({
  onAccept,
  onBack,
  onProcessingChange,
}: AiPdfProcessorProps) {
  const { t, formatDisplayValue } = useSettings();
  const processMutation = useProcessPdf();

  const [phase, setPhase] = useState<Phase>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiTotal, setAiTotal] = useState(0);
  const [subcategories, setSubcategories] = useState<ReviewSubcategory[]>([]);
  const [report, setReport] = useState('');

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleProcess = async () => {
    if (!selectedFile) return;

    setPhase('processing');
    onProcessingChange(true);

    try {
      const result = await processMutation.mutateAsync(selectedFile);

      if (!result.subcategories || result.subcategories.length === 0) {
        toast.error(t('aiNoResults'));
        setPhase('upload');
        onProcessingChange(false);
        return;
      }

      setAiTotal(result.total);
      setSubcategories(
        result.subcategories.map((s) => ({
          ...s,
          displayValue: formatDisplayValue(s.value),
        })),
      );
      setReport(result.report || '');
      setPhase('review');
    } catch {
      toast.error(t('aiProcessingFailed'));
      setPhase('upload');
    } finally {
      onProcessingChange(false);
    }
  };

  const handleSubNameChange = (index: number, name: string) => {
    setSubcategories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s)),
    );
  };

  const handleSubValueChange = (index: number, rawInput: string) => {
    const digits = rawInput.replace(/\D/g, '');
    const cents = parseInt(digits, 10) || 0;
    const numeric = cents / 100;

    setSubcategories((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              value: numeric,
              displayValue: cents === 0 ? '' : formatDisplayValue(numeric),
            }
          : s,
      ),
    );
  };

  const subcategorySum = subcategories.reduce((acc, s) => acc + s.value, 0);

  const handleAccept = () => {
    onAccept({
      total: Math.max(aiTotal, subcategorySum),
      subcategories: subcategories.map(({ name, value }) => ({ name, value })),
    });
  };

  if (phase === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium">{t('aiProcessing')}</p>
          <p className="text-xs text-muted-foreground">{t('aiProcessingWait')}</p>
        </div>
        <div className="w-full space-y-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">{t('aiReviewTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('aiReviewSubtitle')}</p>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium">{t('aiTotal')}</span>
          <span className="text-sm font-semibold">{formatDisplayValue(aiTotal)}</span>
        </div>

        <div className="max-h-[calc(100vh-320px)] overflow-y-auto rounded-lg border p-3 space-y-2">
          {subcategories.map((sub, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex-1">
                <FloatingInput
                  label={t('subcategoryName')}
                  value={sub.name}
                  onChange={(e) => handleSubNameChange(index, e.target.value)}
                />
              </div>
              <div className="w-full sm:w-32">
                <FloatingInput
                  label={t('value')}
                  type="text"
                  inputMode="numeric"
                  value={sub.displayValue}
                  onChange={(e) => handleSubValueChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-right text-muted-foreground">
          {formatDisplayValue(subcategorySum)}
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            disabled={!report}
            onClick={() => {
              const blob = new Blob([report], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ai-report.md';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-3 w-3 mr-1" />
            {t('aiCopyReport')}
          </Button>
          <Button variant="outline" onClick={onBack}>
            {t('aiBack')}
          </Button>
          <Button onClick={handleAccept}>
            {t('aiAccept')}
          </Button>
        </div>
      </div>
    );
  }

  // Upload phase
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">{t('aiUploadPdf')}</h3>
      </div>

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('aiDragDrop')}</p>
      </div>

      {selectedFile && (
        <p className="text-xs text-muted-foreground">
          {t('pdfSelected')}: <span className="font-medium">{selectedFile.name}</span>
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onBack}>
          {t('aiBack')}
        </Button>
        <Button onClick={handleProcess} disabled={!selectedFile}>
          {t('aiProcess')}
        </Button>
      </div>
    </div>
  );
}
