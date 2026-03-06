import { Category } from '../models/category.model';
import { FinancialRelease } from '../models/financial-release.model';
import { logger } from '../config/logger.config';

export async function runMigrations(): Promise<void> {
  logger.info('Running migrations...');

  let outros = await Category.findOne({ name: 'Outros' });
  if (!outros) {
    outros = await new Category({ name: 'Outros', type: 'E' }).save();
    logger.info('Created default category "Outros"');
  }

  const catTypeResult = await Category.updateMany(
    { type: { $exists: false } },
    { $set: { type: 'E' } },
  );
  if (catTypeResult.modifiedCount > 0) {
    logger.info(`Set type "E" on ${catTypeResult.modifiedCount} categories`);
  }

  const result = await FinancialRelease.updateMany(
    { $or: [{ category: { $exists: false } }, { category: null }] },
    { $set: { category: outros._id } },
  );

  if (result.modifiedCount > 0) {
    logger.info(`Migrated ${result.modifiedCount} releases to category "Outros"`);
  }

  logger.info('Migrations complete');
}
