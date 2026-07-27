import { z } from 'zod';
import { defineAction } from './action.types';
import { objectIdSchema } from '../validators/financial-release.validator';
import { financialReleaseService } from '../services/financial-release.service';
import { AppError } from '../middlewares/error-handler.middleware';

export default defineAction({
  name: 'delete_release',
  description: 'Apaga um lançamento definitivamente. Ação irreversível.',
  mode: 'write',
  inputSchema: z.object({ id: objectIdSchema }),
  run: async ({ id }) => {
    const deleted = await financialReleaseService.delete(id);
    if (!deleted) {
      throw new AppError(404, `Release ${id} not found`);
    }
    return { deleted: true, id };
  },
});
