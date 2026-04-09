import pdfParse from 'pdf-parse';
import { logger } from '../config/logger.config';
import { AppError } from '../middlewares/error-handler.middleware';
import { aiRawResponseSchema, AiProcessedResultDto } from '../validators/ai.validator';

interface AiConfig {
  openRouterToken: string;
  aiModel: string;
  aiOutputLanguage: string;
  aiCustomPrompt: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

class AiService {
  async processFile(
    fileBuffer: Buffer,
    mimetype: string,
    config: AiConfig,
  ): Promise<AiProcessedResultDto> {
    logger.info(`Processing file: mimetype=${mimetype}, size=${fileBuffer.length}`);

    let text: string;

    if (mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } catch (err) {
        logger.error(`PDF parse failed: ${err instanceof Error ? err.message : err}`);
        throw new AppError(422, 'Failed to parse PDF file');
      }
    } else {
      text = fileBuffer.toString('utf-8');
    }

    logger.info(`Extracted text length: ${text.length}`);

    if (!text || text.trim().length < 20) {
      throw new AppError(422, 'File contains insufficient text content');
    }

    const systemPrompt = this.buildSystemPrompt(config.aiCustomPrompt);

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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 43329,
          response_format: { type: 'json_object' },
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const cause = err instanceof Error && err.cause ? ` cause: ${JSON.stringify(err.cause)}` : '';
      logger.error(`OpenRouter fetch failed: ${msg}${cause}`);
      throw new AppError(502, `AI service connection failed: ${msg}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        `OpenRouter API error [${response.status}]: ${errorBody.slice(0, 500)}`,
      );
      throw new AppError(502, `AI service error [${response.status}]: ${errorBody.slice(0, 200)}`);
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
      const raw = aiRawResponseSchema.parse(parsed);

      return {
        total: raw.categorized_expense_total,
        subcategories: raw.subcategories,
        report: raw.report,
      };
    } catch (err) {
      const zodMsg = err instanceof Error ? err.message.slice(0, 500) : String(err);
      const keys = parsed && typeof parsed === 'object' ? Object.keys(parsed as Record<string, unknown>).join(', ') : 'not-object';
      logger.error(`AI invalid structure. Keys: [${keys}]. Zod: ${zodMsg}`);
      throw new AppError(502, `AI invalid structure. Keys: [${keys}]. Zod: ${zodMsg.slice(0, 200)}`);
    }
  }

  private buildSystemPrompt(customPrompt: string): string {
    let prompt = `You are a financial transaction analyzer specialized in credit card CSV statements.

Your input is a CSV export of a credit card statement. The CSV is the source of truth. Do not infer values from OCR or visual layout. Read the CSV rows exactly as provided.

Your job is to:
- classify each transaction correctly
- remove reversals from expense categorization
- keep payments/credits tracked separately
- group real expenses into categories
- consolidate repeated transactions
- return a valid JSON object only

PROCESSING RULES

1. Read every CSV row as an individual transaction.
2. Normalize each transaction into:
   - date
   - description
   - amount
3. Normalize merchant names:
   - remove installment suffixes such as "Parcela 3/6", "1/10", etc. from the merchant label, but preserve installment info in a separate note if relevant
   - remove card suffix noise, duplicated OCR fragments, and trailing technical tokens that do not change merchant identity
   - keep merchant names consistent across similar rows
4. Classify every row into exactly one of these types:
   - expense
   - credit_or_reversal
   - payment
   - fee_or_tax
5. Classify as credit_or_reversal if the description indicates a refund, estorno, reversal, chargeback, credited amount, or cancellation.
6. Classify as payment if the description indicates payment, bill payment, inclusão de pagamento, antecipação, or any account payment toward the bill.
7. Classify as fee_or_tax if it is clearly IOF, annual fee, financing fee, interest, late fee, or similar.
8. Only transactions classified as expense should be categorized into spending categories.
9. credit_or_reversal, payment, and fee_or_tax must NEVER be mixed into expense categories.
10. Detect matched reversal pairs:
    - if one expense and one credit_or_reversal have the same absolute amount and clearly refer to the same merchant or transaction, mark them as a matched pair
    - remove BOTH from expense categorization
    - still list them in the audit report under removed pairs
11. Unmatched credit_or_reversal rows must remain excluded from categories and must be listed in the audit section.
12. payment rows must remain excluded from categories and must be listed in the audit section.
13. fee_or_tax rows must remain excluded from categories by default, unless they are explicitly requested to be included as a separate category. If excluded, list them in the audit section.
14. Consolidate repeated expense transactions inside the same category:
    - if the same normalized merchant appears multiple times in the same category, combine them into one line
    - include a count field
    - example: "POSTO TREVO EC 2886934" occurring 4 times at 150.00 becomes one consolidated line with count=4 and value=600.00
15. Create 5 to 15 spending categories using sensible financial grouping.
16. The category total must equal the sum of its consolidated expense lines exactly.
17. The overall categorized_expense_total must equal the sum of all category totals exactly.
18. Never invent rows, values, merchants, or categories that are not supported by the CSV.
19. If a row is ambiguous, keep it in a category called "Other" rather than guessing aggressively.
20. Return ONLY valid JSON. No prose outside JSON.

OUTPUT FORMAT

Return exactly this JSON structure:

{
  "categorized_expense_total": <number>,
  "excluded_total": <number>,
  "excluded_breakdown": {
    "matched_reversals_total": <number>,
    "unmatched_credits_total": <number>,
    "payments_total": <number>,
    "fees_and_taxes_total": <number>
  },
  "subcategories": [
    {
      "name": "<string>",
      "value": <number>
    }
  ],
  "report": "<markdown string>"
}

REPORT FORMAT

The "report" field must be markdown and follow this structure exactly:

## Removed Pairs
| Charge | Reversal | Value |
|---|---|---:|
| Merchant A | Estorno Merchant A | 197.91 |

## Excluded Credits / Payments / Fees
| Type | Transaction | Value |
|---|---|---:|
| payment | Inclusao de Pagamento | 1000.00 |
| credit_or_reversal | MERCADOLIVRE Estorno | 257.74 |
| fee_or_tax | IOF Transações Exterior | 15.92 |

## Category Name — 600.00
**Rationale:** Brief explanation of why these transactions belong together.
| Transaction | Count | Value |
|---|---:|---:|
| POSTO TREVO EC 2886934 | 4 | 600.00 |

## Another Category — 320.50
**Rationale:** Brief explanation.
| Transaction | Count | Value |
|---|---:|---:|
| SPOTIFY | 1 | 40.90 |
| DISNEY PLUS | 1 | 44.50 |
| APPLE SERVICES | 3 | 235.10 |

VALIDATION RULES

- All subcategory values must be positive.
- categorized_expense_total must equal the sum of subcategory values exactly.
- excluded_total must equal:
  matched_reversals_total + unmatched_credits_total + payments_total + fees_and_taxes_total
- Transactions listed under Removed Pairs or Excluded sections must not appear in spending categories.
- Each CSV row must be accounted for exactly once in one of:
  - categorized expense
  - removed pair
  - excluded credit
  - excluded payment
  - excluded fee/tax
- If classification is uncertain, prefer "Other" for expenses or "excluded credit" for clearly non-spending rows.
- If you cannot parse the CSV, return:
  {
    "categorized_expense_total": 0,
    "excluded_total": 0,
    "excluded_breakdown": {
      "matched_reversals_total": 0,
      "unmatched_credits_total": 0,
      "payments_total": 0,
      "fees_and_taxes_total": 0
    },
    "subcategories": [],
    "report": ""
  }`;

    if (customPrompt && customPrompt.trim()) {
      prompt += `\n\nAdditional instructions from the user:\n${customPrompt}`;
    }

    return prompt;
  }
}

export const aiService = new AiService();
