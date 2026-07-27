import { defineAction } from './action.types';
import {
  objectIdSchema,
  updateFinancialReleaseSchema,
} from '../validators/financial-release.validator';
import { financialReleaseService } from '../services/financial-release.service';
import { AppError } from '../middlewares/error-handler.middleware';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'update_release',
  description:
    'Atualiza campos de um lançamento existente. Envie apenas os campos a alterar.',
  mode: 'write',
  inputSchema: updateFinancialReleaseSchema.extend({ id: objectIdSchema }),
  run: async ({ id, ...data }) => {
    const updated = await financialReleaseService.update(id, data);
    if (!updated) {
      throw new AppError(404, `Release ${id} not found`);
    }
    return serializeRelease(updated);
  },
});
