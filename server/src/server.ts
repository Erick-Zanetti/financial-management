import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.config.js';
import { logger } from './config/logger.config.js';
import { initBackupJob, performInitialBackup } from './jobs/backup.job.js';

const start = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Perform initial backup on startup
    await performInitialBackup();

    // Schedule daily backups
    initBackupJob();

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Swagger docs available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
