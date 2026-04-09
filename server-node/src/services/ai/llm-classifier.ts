import { logger } from '../../config/logger.config';
import { AppError } from '../../middlewares/error-handler.middleware';
import { CsvRow, ConsolidatedRow, LlmClassification, CategoryConfig } from './types';
import { consolidateExpenses } from './preprocessor';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;

const BASE_SYSTEM_PROMPT = `Você é um classificador de transações de cartão de crédito. Para cada transação, classifique em UMA das categorias permitidas. Se o usuário fornecer instruções com regras de categorização, siga estritamente as regras do usuário. Não invente row_ids. Retorne todos os row_ids enviados.`;

function buildSystemPrompt(
  categories: CategoryConfig[],
  customPrompt: string,
): string {
  const categoriesBlock = categories
    .map((c, i) => {
      const examples =
        c.examples.length > 0 ? `\n   Exemplos: ${c.examples.join(', ')}` : '';
      return `${i + 1}. ${c.slug}\n   Escopo: ${c.description}${examples}`;
    })
    .join('\n\n');

  let prompt = `${BASE_SYSTEM_PROMPT}\n\nCATEGORIAS PERMITIDAS (use exatamente estes slugs):\n\n${categoriesBlock}`;

  if (customPrompt && customPrompt.trim()) {
    prompt += `\n\n${customPrompt}`;
  }

  return prompt;
}

function buildClassificationSchema(categories: CategoryConfig[]) {
  const slugs = categories.map((c) => c.slug);

  return {
    name: 'classifications',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        classifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row_id: { type: 'integer' },
              category: {
                type: 'string',
                enum: slugs,
              },
            },
            required: ['row_id', 'category'],
            additionalProperties: false,
          },
        },
      },
      required: ['classifications'],
      additionalProperties: false,
    },
  };
}

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildUserMessage(rows: ConsolidatedRow[]): string {
  const lines = rows.map((r) => {
    const suffix = r.count > 1 ? ` (x${r.count})` : '';
    return `${r.consolidated_id} | ${r.merchant}${suffix} | R$ ${formatBrl(r.total_amount)}`;
  });
  return `Classifique cada transação em uma categoria:\n\n${lines.join('\n')}`;
}

interface ClassifierConfig {
  openRouterToken: string;
  aiModel: string;
  customPrompt: string;
  categories: CategoryConfig[];
}

async function callLlm(
  rows: ConsolidatedRow[],
  config: ClassifierConfig,
): Promise<LlmClassification[]> {
  const systemContent = buildSystemPrompt(config.categories, config.customPrompt);
  const schema = buildClassificationSchema(config.categories);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: buildUserMessage(rows) },
        ],
        max_tokens: 8000,
        response_format: { type: 'json_schema', json_schema: schema },
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`OpenRouter fetch failed: ${msg}`);
    throw new AppError(502, `AI service connection failed: ${msg}`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(
      `OpenRouter API error [${response.status}]: ${errorBody.slice(0, 500)}`,
    );

    if (response.status === 400 && errorBody.includes('json_schema')) {
      logger.info('Falling back to json_object response format');
      return callLlmFallback(rows, config);
    }

    throw new AppError(
      502,
      `AI service error [${response.status}]: ${errorBody.slice(0, 200)}`,
    );
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError(502, 'AI service returned empty response');
  }

  let cleanContent = content.trim();
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleanContent) as {
    classifications: LlmClassification[];
  };

  return parsed.classifications || [];
}

async function callLlmFallback(
  rows: ConsolidatedRow[],
  config: ClassifierConfig,
): Promise<LlmClassification[]> {
  const systemContent = buildSystemPrompt(config.categories, config.customPrompt);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openRouterToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: buildUserMessage(rows) },
      ],
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      502,
      `AI service error [${response.status}]: ${errorBody.slice(0, 200)}`,
    );
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new AppError(502, 'AI service returned empty response');

  let cleanContent = content.trim();
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleanContent) as {
    classifications: LlmClassification[];
  };

  return parsed.classifications || [];
}

export async function classifyExpenses(
  rows: CsvRow[],
  config: ClassifierConfig,
): Promise<LlmClassification[]> {
  if (rows.length === 0) return [];

  const fallbackSlug = config.categories.find((c) => c.slug === 'outros')?.slug
    ?? config.categories[config.categories.length - 1].slug;

  const consolidated = consolidateExpenses(rows);
  logger.info(
    `Consolidated ${rows.length} expense rows into ${consolidated.length} unique merchants`,
  );

  const validIds = new Set(consolidated.map((r) => r.consolidated_id));
  const consolidatedClassifications: Array<{
    consolidated_id: number;
    category: string;
  }> = [];
  let remaining = [...consolidated];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (remaining.length === 0) break;

    if (attempt > 0) {
      logger.warn(
        `LLM retry ${attempt}/${MAX_RETRIES}: ${remaining.length} rows missing`,
      );
    }

    logger.info(
      `LLM classification call: ${remaining.length} consolidated rows, attempt ${attempt + 1}`,
    );

    const results = await callLlm(remaining, config);

    const validSlugs = new Set(config.categories.map((c) => c.slug));
    const valid = results.filter(
      (c) => validIds.has(c.row_id) && validSlugs.has(c.category),
    );
    for (const v of valid) {
      consolidatedClassifications.push({
        consolidated_id: v.row_id,
        category: v.category,
      });
    }

    const returnedIds = new Set(valid.map((c) => c.row_id));
    remaining = remaining.filter((r) => !returnedIds.has(r.consolidated_id));
  }

  for (const row of remaining) {
    logger.warn(
      `Consolidated row ${row.consolidated_id} (${row.merchant}) defaulted to "${fallbackSlug}" after ${MAX_RETRIES} retries`,
    );
    consolidatedClassifications.push({
      consolidated_id: row.consolidated_id,
      category: fallbackSlug,
    });
  }

  const classMap = new Map<number, string>();
  for (const c of consolidatedClassifications) {
    classMap.set(c.consolidated_id, c.category);
  }

  const allClassifications: LlmClassification[] = [];
  for (const cr of consolidated) {
    const category = classMap.get(cr.consolidated_id) || fallbackSlug;
    for (const rowId of cr.original_row_ids) {
      allClassifications.push({ row_id: rowId, category });
    }
  }

  return allClassifications;
}
