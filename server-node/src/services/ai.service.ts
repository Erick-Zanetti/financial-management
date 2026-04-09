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

    logger.info('AI raw response parsed', { parsed: JSON.stringify(parsed) });

    try {
      return aiProcessedResultSchema.parse(parsed);
    } catch (err) {
      const detail = JSON.stringify(parsed).slice(0, 500);
      logger.error('AI returned invalid structure', {
        parsed: detail,
        error: String(err),
      });
      throw new AppError(502, `AI returned invalid structure. Raw: ${detail}`);
    }
  }

  private buildSystemPrompt(
    outputLanguage: string,
    customPrompt: string,
  ): string {
    let prompt = `You are a financial document analyzer specialized in categorizing expenses. Your task is to analyze a credit card statement or bill, group the transactions into meaningful spending categories, and return the categorized totals.

Instructions:
1. Read all individual charges/transactions in the document.
2. Group them into logical spending categories that YOU create (e.g., "Groceries", "Restaurants", "Transportation", "Subscriptions", "Health", "Entertainment", "Shopping", "Education", etc.). Use your judgment to pick the most appropriate category names.
3. For each category, sum up all transactions that belong to it and return the category name and total value.
4. Calculate the overall total of the bill.
5. Output category names in ${outputLanguage} language.
6. Return ONLY a valid JSON object with this exact structure:

{
  "total": <number - the bill total as a decimal>,
  "subcategories": [
    { "name": "<string - category name>", "value": <number - sum of transactions in this category as a decimal> }
  ]
}

Rules:
- All monetary values must be positive numbers with up to 2 decimal places.
- The "total" should be the overall bill total as stated on the document.
- The sum of all subcategory values must equal the total.
- Only current charges — no fees, interest, or previous balance.
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
