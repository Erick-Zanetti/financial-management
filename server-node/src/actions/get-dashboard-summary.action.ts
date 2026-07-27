import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';

export default defineAction({
  name: 'get_dashboard_summary',
  description:
    'Resumo agregado por categoria e mês (visão segmentada do dashboard) para um período. Valores em BRL.',
  mode: 'read',
  inputSchema: z.object({
    fromYear: z.number().int().min(2000).max(2100),
    fromMonth: z.number().int().min(1).max(12),
    toYear: z.number().int().min(2000).max(2100),
    toMonth: z.number().int().min(1).max(12),
  }),
  run: (filter) => financialReleaseService.getDashboardSummarySegmented(filter),
});
