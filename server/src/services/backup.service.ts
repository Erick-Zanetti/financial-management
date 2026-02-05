import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from '../config/logger.config.js';

const execAsync = promisify(exec);

export class BackupService {
  private formatDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  async performBackup(): Promise<void> {
    try {
      const dateFormatted = this.formatDate();
      const backupDir = path.join(config.backup.path, dateFormatted);

      await mkdir(backupDir, { recursive: true });

      const command = `mongodump --host ${config.mongodb.host} --port ${config.mongodb.port} --out=${backupDir}`;

      logger.info(`Executing backup command: ${command}`);

      const { stdout, stderr } = await execAsync(command);

      if (stdout) logger.debug(`Backup stdout: ${stdout}`);
      if (stderr) logger.debug(`Backup stderr: ${stderr}`);

      logger.info('Backup completed successfully');
    } catch (error) {
      logger.error('Failed to perform backup:', error);
    }
  }
}

export const backupService = new BackupService();
