import { createApp } from './app';
import { connectDatabase } from './config/database.config';
import { config } from './config';
import { logger } from './config/logger.config';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`Swagger docs: http://localhost:${config.port}/api-docs`);
  });
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();
