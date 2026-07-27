import { Category } from '../models/category.model';
import { FinancialRelease } from '../models/financial-release.model';
import { SystemConfig } from '../models/system-config.model';
import { logger } from '../config/logger.config';
import { normalizeForMatch } from '../utils/slugify';

interface LegacyAiCategory {
  slug: string;
  displayName: string;
  description?: string;
  examples?: string[];
}

const LEGACY_AI_CATEGORY_TARGETS: Record<string, string> = {
  educacao: 'Estudos',
  saude: 'Saude',
  outros: 'Outros',
};

async function migrateLegacyAiCategories(): Promise<void> {
  // Read via the native collection: the aiCategories field no longer exists
  // on the Mongoose schema, so strict mode would hide it.
  const rawConfig = await SystemConfig.collection.findOne({});
  const legacyCategories = (rawConfig?.aiCategories ?? []) as LegacyAiCategory[];
  if (legacyCategories.length === 0) {
    return;
  }

  const categories = await Category.find();
  const byNormalizedName = new Map(
    categories.map((c) => [normalizeForMatch(c.name), c]),
  );

  let matched = 0;
  let created = 0;

  for (const legacy of legacyCategories) {
    if (!legacy.displayName?.trim()) {
      logger.warn(`Skipping legacy AI category "${legacy.slug}": empty displayName`);
      continue;
    }

    const targetName = LEGACY_AI_CATEGORY_TARGETS[legacy.slug] ?? legacy.displayName;
    const target = byNormalizedName.get(normalizeForMatch(targetName));

    if (target) {
      await Category.updateOne(
        { _id: target._id },
        {
          $set: {
            description: legacy.description || '',
            aiKeywords: legacy.examples || [],
            aiClassificationEnabled: true,
          },
        },
      );
      matched += 1;
      logger.info(
        `Migrated AI category "${legacy.slug}" into category "${target.name}"`,
      );
    } else {
      // Create under the mapped target name so a crash-and-retry finds it.
      const createdCategory = await new Category({
        name: targetName,
        type: 'E',
        allowSubcategories: false,
        allowAiIntegration: false,
        description: legacy.description || '',
        aiKeywords: legacy.examples || [],
        aiClassificationEnabled: true,
      }).save();
      byNormalizedName.set(
        normalizeForMatch(createdCategory.name),
        createdCategory,
      );
      created += 1;
      logger.info(
        `Created category "${targetName}" from AI category "${legacy.slug}"`,
      );
    }
  }

  await SystemConfig.collection.updateMany(
    {},
    { $unset: { aiCategories: '' } },
  );
  logger.info(
    `Migrated ${legacyCategories.length} AI categories to Category collection (${matched} matched, ${created} created)`,
  );
}

const SUBCATEGORY_SEED_NAMES = [
  'Contador',
  'DAS',
  'INSS',
  'Polimed',
  'Cartão PJ',
  'Reembolsos/Créditos',
];

const LEGACY_SUBCATEGORY_TARGETS: Record<string, string> = {
  educacao: 'Estudos',
  cartao: 'Cartão PJ',
  fatura: 'Cartão PJ',
};

interface LegacySubcategory {
  name?: string;
  value: number;
  category?: unknown;
}

async function migrateSubcategoryLinks(): Promise<void> {
  const byNormalizedName = new Map(
    (await Category.find()).map((c) => [normalizeForMatch(c.name), c]),
  );

  for (const seedName of SUBCATEGORY_SEED_NAMES) {
    if (!byNormalizedName.has(normalizeForMatch(seedName))) {
      const created = await new Category({ name: seedName, type: 'E' }).save();
      byNormalizedName.set(normalizeForMatch(created.name), created);
      logger.info(`Created category "${seedName}" for subcategory links`);
    }
  }

  // Native collection access: the new schema no longer has subcategories.name,
  // and we want to keep the legacy name in place as a rollback backup.
  const releases = await FinancialRelease.collection
    .find({
      subcategories: {
        $elemMatch: { name: { $exists: true }, category: { $exists: false } },
      },
    })
    .toArray();

  let converted = 0;
  let skipped = 0;

  for (const release of releases) {
    const subcategories = (release.subcategories ?? []) as LegacySubcategory[];
    let unresolvedName: string | undefined;

    const newSubcategories = [];
    for (const sub of subcategories) {
      if (sub.category || !sub.name) {
        newSubcategories.push(sub);
        continue;
      }
      const normalized = normalizeForMatch(sub.name);
      const targetName = LEGACY_SUBCATEGORY_TARGETS[normalized];
      let target = targetName
        ? byNormalizedName.get(normalizeForMatch(targetName))
        : byNormalizedName.get(normalized);
      if (!target && targetName) {
        // Manually-mapped target missing (e.g. fresh install): create it.
        target = await new Category({ name: targetName, type: 'E' }).save();
        byNormalizedName.set(normalizeForMatch(target.name), target);
        logger.info(`Created category "${targetName}" for subcategory links`);
      }
      if (!target) {
        unresolvedName = sub.name;
        newSubcategories.push(sub);
        continue;
      }
      newSubcategories.push({ ...sub, category: target._id });
    }

    if (unresolvedName) {
      logger.error(
        `Skipping release ${String(release._id)}: no category match for subcategory "${unresolvedName}"`,
      );
      skipped += 1;
      continue;
    }

    await FinancialRelease.collection.updateOne(
      { _id: release._id },
      { $set: { subcategories: newSubcategories } },
    );
    converted += 1;
  }

  if (converted > 0 || skipped > 0) {
    logger.info(
      `Linked subcategories to categories: converted=${converted} skipped=${skipped}`,
    );
  }
}

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

  const descriptionResult = await Category.updateMany(
    { description: { $exists: false } },
    { $set: { description: '' } },
  );
  if (descriptionResult.modifiedCount > 0) {
    logger.info(
      `Set description='' on ${descriptionResult.modifiedCount} categories`,
    );
  }

  const aiClassResult = await Category.updateMany(
    { aiClassificationEnabled: { $exists: false } },
    { $set: { aiClassificationEnabled: false } },
  );
  if (aiClassResult.modifiedCount > 0) {
    logger.info(
      `Set aiClassificationEnabled=false on ${aiClassResult.modifiedCount} categories`,
    );
  }

  const aiKeywordsResult = await Category.updateMany(
    { aiKeywords: { $exists: false } },
    { $set: { aiKeywords: [] } },
  );
  if (aiKeywordsResult.modifiedCount > 0) {
    logger.info(
      `Set aiKeywords=[] on ${aiKeywordsResult.modifiedCount} categories`,
    );
  }

  const aiPromptResult = await Category.updateMany(
    { aiPrompt: { $exists: false } },
    { $set: { aiPrompt: '' } },
  );
  if (aiPromptResult.modifiedCount > 0) {
    logger.info(
      `Set aiPrompt='' on ${aiPromptResult.modifiedCount} categories`,
    );
  }

  await migrateLegacyAiCategories();
  await migrateSubcategoryLinks();

  logger.info('Migrations complete');
}
