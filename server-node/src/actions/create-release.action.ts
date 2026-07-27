import { defineAction } from './action.types';
import { createFinancialReleaseSchema } from '../validators/financial-release.validator';
import { financialReleaseService } from '../services/financial-release.service';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'create_release',
  description:
    'Cria um lançamento financeiro. category deve ser um id obtido via list_categories. Valores em BRL, sempre positivos (type define receita/despesa).',
  mode: 'write',
  inputSchema: createFinancialReleaseSchema,
  run: async (input) => {
    const created = await financialReleaseService.create(input);
    return serializeRelease(created);
  },
});
