import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';
import { AppError } from '../middlewares/error-handler.middleware';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'get_release',
  description: 'Busca um lançamento pelo id, incluindo subcategorias.',
  mode: 'read',
  inputSchema: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  run: async ({ id }) => {
    const release = await financialReleaseService.findById(id);
    if (!release) {
      throw new AppError(404, `Release ${id} not found`);
    }
    return serializeRelease(release);
  },
});
