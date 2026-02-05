import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { swaggerSpec } from './config/swagger.config.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use(routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
