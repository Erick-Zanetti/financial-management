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

    try {
      return aiProcessedResultSchema.parse(parsed);
    } catch (err) {
      logger.error('AI returned invalid structure', {
        parsed: JSON.stringify(parsed),
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(502, 'AI returned invalid structure');
    }
  }

  private buildSystemPrompt(
    outputLanguage: string,
    customPrompt: string,
  ): string {
    let prompt = `You are a financial document analyzer specialized in categorizing expenses. Your task is to analyze a credit card statement or bill, clean up the transactions, group them into categories, and return the results.

Instructions:
1. Extract ALL line items from the document (positive and negative).
2. Identify and REMOVE matched pairs: when a negative transaction clearly reverses/cancels a positive one (e.g., "Anuidade Cartão +98.00" paired with "Estorno Anuidade -98.00", or "Seguro +15.00" paired with "Estorno Seguro -15.00"). Remove BOTH the charge and its reversal. Match by similar description and equal absolute value.
3. After removing matched pairs, DISCARD any remaining negative transactions entirely.
4. The working set is now only positive charges with no reversals.
5. Group these charges into spending categories that YOU create. Use your judgment for category names.
6. For each category, sum up all transactions that belong to it.
7. The "total" in your response MUST be the sum of all remaining positive charges (after cleanup). Do NOT use the printed bill total — calculate it from the cleaned transactions.
8. Output category names in ${outputLanguage} language.
9. For each category, write a brief rationale and a markdown table listing every transaction with its value.
10. Return ONLY a valid JSON object with this exact structure:

{
  "total": <number>,
  "subcategories": [
    { "name": "<string>", "value": <number> }
  ],
  "report": "<string - markdown report>"
}

The "report" field must be a markdown string with this structure per category:
## Category Name — $value
**Rationale:** Brief explanation of grouping logic.
| Transaction | Value |
|---|---|
| item name | $value |

At the top of the report, include a section listing removed pairs:
## Removed Pairs
| Charge | Reversal | Value |
|---|---|---|
| Anuidade Cartão | Estorno Anuidade | 98.00 |

Rules:
- All subcategory values MUST be positive.
- The "total" MUST equal the sum of all subcategory values EXACTLY.
- Do NOT use the printed bill total. Calculate from cleaned transactions.
- Do NOT include any negative values in subcategories.
- Do NOT list individual transactions in the JSON subcategories — only grouped category totals.
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
