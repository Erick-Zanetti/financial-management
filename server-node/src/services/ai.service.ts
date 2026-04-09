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
      logger.error('AI returned invalid structure', { parsed, error: err });
      throw new AppError(502, 'AI returned invalid structure');
    }
  }

  private buildSystemPrompt(
    outputLanguage: string,
    customPrompt: string,
  ): string {
    let prompt = `You are a financial document analyzer. Your task is to analyze a credit card statement or bill and extract all line items.

Instructions:
1. Identify every individual charge/transaction in the document.
2. For each charge, extract the merchant/description name and the monetary value.
3. Calculate the total sum of all charges.
4. Output item names in ${outputLanguage} language. Keep proper nouns (brand names, store names) unchanged.
5. Return ONLY a valid JSON object with this exact structure:

{
  "total": <number - the bill total as a decimal>,
  "subcategories": [
    { "name": "<string - item description>", "value": <number - item value as a decimal> }
  ]
}

Rules:
- All monetary values must be positive numbers with up to 2 decimal places.
- The "total" should be the overall bill total as stated on the document.
- Only current charges — no fees, interest, or previous balance.
- If you cannot extract items, return: { "total": 0, "subcategories": [] }
- Do NOT include any text outside the JSON object.`;

    if (customPrompt && customPrompt.trim()) {
      prompt += `\n\nAdditional instructions from the user:\n${customPrompt}`;
    }

    return prompt;
  }
}

export const aiService = new AiService();
