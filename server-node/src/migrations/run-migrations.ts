import { Category } from '../models/category.model';
import { FinancialRelease } from '../models/financial-release.model';
import { SystemConfig } from '../models/system-config.model';
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

  const subcatResult = await Category.updateMany(
    { allowSubcategories: { $exists: false } },
    { $set: { allowSubcategories: false } },
  );
  if (subcatResult.modifiedCount > 0) {
    logger.info(
      `Set allowSubcategories=false on ${subcatResult.modifiedCount} categories`,
    );
  }

  const aiCatResult = await Category.updateMany(
    { allowAiIntegration: { $exists: false } },
    { $set: { allowAiIntegration: false } },
  );
  if (aiCatResult.modifiedCount > 0) {
    logger.info(
      `Set allowAiIntegration=false on ${aiCatResult.modifiedCount} categories`,
    );
  }

  const aiRelResult = await FinancialRelease.updateMany(
    { useAiIntegration: { $exists: false } },
    { $set: { useAiIntegration: false } },
  );
  if (aiRelResult.modifiedCount > 0) {
    logger.info(
      `Set useAiIntegration=false on ${aiRelResult.modifiedCount} releases`,
    );
  }

  const existingConfig = await SystemConfig.findOne();
  if (!existingConfig) {
    await new SystemConfig({}).save();
    logger.info('Created default system config');
  }

  const aiModelResult = await SystemConfig.updateMany(
    { aiModel: { $exists: false } },
    { $set: { aiModel: '' } },
  );
  if (aiModelResult.modifiedCount > 0) {
    logger.info(`Set aiModel='' on ${aiModelResult.modifiedCount} system configs`);
  }

  const aiLangResult = await SystemConfig.updateMany(
    { aiOutputLanguage: { $exists: false } },
    { $set: { aiOutputLanguage: 'pt' } },
  );
  if (aiLangResult.modifiedCount > 0) {
    logger.info(
      `Set aiOutputLanguage='pt' on ${aiLangResult.modifiedCount} system configs`,
    );
  }

  logger.info('Migrations complete');
}
