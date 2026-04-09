import pdfParse from 'pdf-parse';
import { logger } from '../config/logger.config';
import { AppError } from '../middlewares/error-handler.middleware';
import { aiProcessedResultSchema, AiProcessedResultDto } from '../validators/ai.validator';

interface AiConfig {
  openRouterToken: string;
  aiModel: string;
  aiOutputLanguage: string;
  aiCustomPrompt: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

class AiService {
  async processPdf(
    pdfBuffer: Buffer,
    config: AiConfig,
  ): Promise<AiProcessedResultDto> {
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length < 50) {
      throw new AppError(422, 'PDF contains insufficient text content');
    }

    const systemPrompt = this.buildSystemPrompt(
      config.aiOutputLanguage,
      config.aiCustomPrompt,
    );

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('OpenRouter API error', {
        status: response.status,
        body: errorBody,
      });
      throw new AppError(502, 'AI service returned an error');
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

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      logger.error('AI returned invalid JSON', { content: cleanContent });
      throw new AppError(502, 'AI returned invalid JSON');
    }

    // Filter out negative subcategories (e.g. refunds the model included despite instructions)
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.subcategories)) {
      obj.subcategories = (obj.subcategories as Array<Record<string, unknown>>).filter(
        (s) => typeof s.value === 'number' ? s.value > 0 : true,
      );
    }

    try {
      return aiProcessedResultSchema.parse(obj);
    } catch (err) {
      logger.error('AI returned invalid structure', {
        parsed: JSON.stringify(obj),
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(502, 'AI returned invalid structure');
    }
  }

  private buildSystemPrompt(
    outputLanguage: string,
    customPrompt: string,
  ): string {
    let prompt = `You are a financial document analyzer specialized in categorizing expenses. Your task is to analyze a credit card statement or bill, group the transactions into meaningful spending categories, and return the categorized totals.

Instructions:
1. First, find the EXACT total amount of the bill as printed on the document (look for "Total", "Total da fatura", "Amount due", etc.). This is your reference total — use it as-is, do NOT recalculate it.
2. Read all individual charges/transactions in the document.
3. Group them into logical spending categories that YOU create (e.g., "Groceries", "Restaurants", "Transportation", "Subscriptions", "Health", "Entertainment", "Shopping", "Education", etc.). Use your judgment to pick the most appropriate category names.
4. For each category, sum up all transactions that belong to it.
5. CRITICAL: Verify that the sum of all category values equals the document total EXACTLY. If there is a difference, create an adjustment category to make the sum match.
6. Output category names in ${outputLanguage} language.
7. For each category, write a brief rationale explaining why those transactions were grouped together, and include a markdown table listing every transaction in that category with its value.
8. Return ONLY a valid JSON object with this exact structure:

{
  "total": <number - the bill total as a decimal>,
  "subcategories": [
    { "name": "<string - category name>", "value": <number - sum of transactions in this category as a decimal> }
  ],
  "report": "<string - markdown report with details per category>"
}

The "report" field must be a markdown string with the following structure for each category:
## Category Name — $value
**Rationale:** Brief explanation of why these transactions were grouped.
| Transaction | Value |
|---|---|
| item name | $value |
| ... | ... |

Rules:
- All monetary values must be positive numbers with up to 2 decimal places.
- The "total" MUST be the exact total printed on the document. Do NOT recalculate or estimate it.
- The sum of all subcategory values MUST equal the total EXACTLY. This is mandatory.
- Only current charges — no fees, interest, or previous balance.
- EXCLUDE refunds, credits, chargebacks, and adjustments entirely. Do NOT include negative values.
- Do NOT list individual transactions — group them into categories.
- Aim for 5 to 15 categories. Merge very small or similar categories together.
- If you cannot extract items, return: { "total": 0, "subcategories": [] }
- Do NOT include any text outside the JSON object.`;

    if (customPrompt && customPrompt.trim()) {
      prompt += `\n\nAdditional instructions from the user:\n${customPrompt}`;
    }

    return prompt;
  }
}

export const aiService = new AiService();
