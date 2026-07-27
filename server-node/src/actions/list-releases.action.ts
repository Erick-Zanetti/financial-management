import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';
import { FinancialReleaseType } from '../types/financial-release.types';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'list_releases',
  description:
    'Lista os lançamentos financeiros de um mês. type: R = receitas, E = despesas; omita para ambos.',
  mode: 'read',
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    type: z.nativeEnum(FinancialReleaseType).optional(),
  }),
  run: async ({ year, month, type }) => {
    const types = type
      ? [type]
      : [FinancialReleaseType.Receipt, FinancialReleaseType.Expense];
    const lists = await Promise.all(
      types.map((t) =>
        financialReleaseService.findByTypeAndMonthAndYear({
          type: t,
          month,
          year,
        }),
      ),
    );
    return lists.flat().map((r) => serializeRelease(r));
  },
});
