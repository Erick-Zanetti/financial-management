import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'search_releases',
  description:
    'Busca lançamentos por texto no nome (case-insensitive), opcionalmente filtrando por ano. Máx. 50 resultados.',
  mode: 'read',
  inputSchema: z.object({
    text: z.string().min(1).max(100),
    year: z.number().int().min(2000).max(2100).optional(),
  }),
  run: async ({ text, year }) => {
    const releases = await financialReleaseService.searchByName(text, year);
    return releases.map((r) => serializeRelease(r));
  },
});
