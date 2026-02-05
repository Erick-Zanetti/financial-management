import cron from 'node-cron';
import { backupService } from '../services/backup.service.js';
import { logger } from '../config/logger.config.js';

export const initBackupJob = (): void => {
  // Schedule backup at midnight every day (0 0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting scheduled backup...');
    await backupService.performBackup();
  });

  logger.info('Backup job scheduled for midnight every day');
};

export const performInitialBackup = async (): Promise<void> => {
  logger.info('Performing initial backup on startup...');
  await backupService.performBackup();
};
