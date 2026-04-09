import { logger } from '../../config/logger.config';
import { AppError } from '../../middlewares/error-handler.middleware';
import { CsvRow, LlmClassification, EXPENSE_CATEGORIES } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;

const SYSTEM_PROMPT = `Você é um classificador de transações de cartão de crédito. Para cada transação, classifique em UMA das categorias do enum. Use 'outros' somente quando realmente não se encaixar em nenhuma outra categoria. Não invente row_ids. Retorne todos os row_ids enviados.`;

const CLASSIFICATION_SCHEMA = {
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
              enum: [...EXPENSE_CATEGORIES],
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

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildUserMessage(rows: CsvRow[]): string {
  const lines = rows.map(
    (r) => `${r.row_id} | ${r.merchant} | R$ ${formatBrl(r.amount_brl)}`,
  );
  return `Classifique cada transação em uma categoria:\n\n${lines.join('\n')}`;
}

async function callLlm(
  rows: CsvRow[],
  config: { openRouterToken: string; aiModel: string; customPrompt: string },
): Promise<LlmClassification[]> {
  const systemContent = config.customPrompt
    ? `${SYSTEM_PROMPT}\n\n${config.customPrompt}`
    : SYSTEM_PROMPT;

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
        response_format: { type: 'json_schema', json_schema: CLASSIFICATION_SCHEMA },
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

    // Fallback to json_object if json_schema is not supported
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
  rows: CsvRow[],
  config: { openRouterToken: string; aiModel: string; customPrompt: string },
): Promise<LlmClassification[]> {
  const systemContent = config.customPrompt
    ? `${SYSTEM_PROMPT}\n\n${config.customPrompt}`
    : SYSTEM_PROMPT;

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
  config: { openRouterToken: string; aiModel: string; customPrompt: string },
): Promise<LlmClassification[]> {
  if (rows.length === 0) return [];

  const validRowIds = new Set(rows.map((r) => r.row_id));
  const allClassifications: LlmClassification[] = [];
  let remainingRows = [...rows];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (remainingRows.length === 0) break;

    if (attempt > 0) {
      logger.warn(
        `LLM retry ${attempt}/${MAX_RETRIES}: ${remainingRows.length} rows missing`,
      );
    }

    logger.info(
      `LLM classification call: ${remainingRows.length} rows, attempt ${attempt + 1}`,
    );

    const results = await callLlm(remainingRows, config);

    // Filter out invalid row_ids
    const valid = results.filter((c) => validRowIds.has(c.row_id));
    allClassifications.push(...valid);

    const returnedIds = new Set(valid.map((c) => c.row_id));
    remainingRows = remainingRows.filter((r) => !returnedIds.has(r.row_id));
  }

  // Default remaining to "outros"
  for (const row of remainingRows) {
    logger.warn(
      `Row ${row.row_id} (${row.merchant}) defaulted to "outros" after ${MAX_RETRIES} retries`,
    );
    allClassifications.push({ row_id: row.row_id, category: 'outros' });
  }

  return allClassifications;
}
