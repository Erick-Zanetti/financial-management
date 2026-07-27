import { z } from 'zod';
import { defineAction } from './action.types';
import { categoryService } from '../services/category.service';
import { serializeCategory } from './serializers';

export default defineAction({
  name: 'list_categories',
  description:
    'Lista todas as categorias com id, tipo (R/E/B) e flags. Use os ids ao criar/editar lançamentos.',
  mode: 'read',
  inputSchema: z.object({}),
  run: async () => {
    const categories = await categoryService.findAll();
    return categories.map((c) => serializeCategory(c));
  },
});
