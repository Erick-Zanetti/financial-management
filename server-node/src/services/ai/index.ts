import { logger } from '../../config/logger.config';
import { AppError } from '../../middlewares/error-handler.middleware';
import { AiConfig } from './types';
import { parseCsv } from './csv-parser';
import { preprocess } from './preprocessor';
import { classifyExpenses } from './llm-classifier';
import { aggregate } from './aggregator';
import { generateReport } from './report-generator';

export interface AiProcessedResultDto {
  total: number;
  subcategories: Array<{ name: string; value: number }>;
  report: string;
  validation?: {
    expected_total: number;
    categorized_total: number;
    matches: boolean;
  };
}

class AiService {
  async processFile(
    fileBuffer: Buffer,
    _mimetype: string,
    config: AiConfig,
  ): Promise<AiProcessedResultDto> {
    logger.info(`Processing CSV file: size=${fileBuffer.length}`);

    const text = fileBuffer.toString('utf-8');

    if (!text || text.trim().length < 20) {
      throw new AppError(422, 'File contains insufficient text content');
    }

    // 2. Parse CSV
    const rows = parseCsv(text);
    logger.info(`Parsed ${rows.length} CSV rows`);

    // 3. Pre-process
    const preprocessed = preprocess(rows);
    logger.info(
      `Preprocessed: ${preprocessed.expense_rows.length} expenses, ` +
        `${preprocessed.iof_entries.length} IOF, ` +
        `${preprocessed.matched_reversals.length} reversal pairs, ` +
        `${preprocessed.payments.length} payments, ` +
        `${preprocessed.fees.length} fees`,
    );

    if (preprocessed.expense_rows.length === 0) {
      throw new AppError(
        422,
        'No expense transactions found after filtering payments, reversals, and fees',
      );
    }

    // 4. LLM classification
    const classifications = await classifyExpenses(preprocessed.expense_rows, {
      openRouterToken: config.openRouterToken,
      aiModel: config.aiModel,
      customPrompt: config.aiCustomPrompt || '',
    });

    logger.info(`LLM returned ${classifications.length} classifications`);

    // 5. Aggregate
    const result = aggregate(preprocessed, classifications);
    logger.info(
      `Aggregated: total=${result.total}, categories=${result.subcategories.length}, matches=${result.validation.matches}`,
    );

    // 6. Generate report
    const report = generateReport(result);

    return {
      total: result.total,
      subcategories: result.subcategories,
      report,
      validation: result.validation,
    };
  }
}

export const aiService = new AiService();
