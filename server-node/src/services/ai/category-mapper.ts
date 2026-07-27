import { logger } from '../../config/logger.config';
import { ICategory } from '../../types/category.types';
import { slugify } from '../../utils/slugify';
import { CategoryConfig } from './types';

export function buildCategoryConfigs(categories: ICategory[]): CategoryConfig[] {
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const usedSlugs = new Set<string>();

  return sorted.map((category, index) => {
    let slug = slugify(category.name) || `cat_${index}`;

    if (usedSlugs.has(slug)) {
      const base = slug;
      let suffix = 2;
      while (usedSlugs.has(`${base}_${suffix}`)) {
        suffix += 1;
      }
      slug = `${base}_${suffix}`;
      logger.warn(
        `Category slug collision for "${category.name}": using "${slug}"`,
      );
    }
    usedSlugs.add(slug);

    return {
      id: category.id ?? '',
      slug,
      displayName: category.name,
      description: category.description || '',
      examples: category.aiKeywords || [],
      prompt: category.aiPrompt || '',
    };
  });
}
