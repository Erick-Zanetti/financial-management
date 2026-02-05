import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Financial Management API',
      version: '1.0.0',
      description: 'API for managing financial releases (receipts and expenses)',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        FinancialRelease: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'MongoDB ObjectId' },
            name: { type: 'string', description: 'Description of the release' },
            value: { type: 'number', description: 'Monetary value' },
            type: { type: 'string', enum: ['R', 'E'], description: 'R=Receipt, E=Expense' },
            person: { type: 'string', enum: ['ERICK', 'JULIA'], description: 'Person associated' },
            year: { type: 'integer', description: 'Year' },
            month: { type: 'integer', minimum: 1, maximum: 12, description: 'Month (1-12)' },
            day: { type: 'integer', minimum: 1, maximum: 31, description: 'Day (1-31)' },
          },
          required: ['name', 'value', 'type', 'person', 'year', 'month', 'day'],
        },
        FinancialReleaseInput: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Description of the release' },
            value: { type: 'number', description: 'Monetary value' },
            type: { type: 'string', enum: ['R', 'E'], description: 'R=Receipt, E=Expense' },
            person: { type: 'string', enum: ['ERICK', 'JULIA'], description: 'Person associated' },
            year: { type: 'integer', description: 'Year' },
            month: { type: 'integer', minimum: 1, maximum: 12, description: 'Month (1-12)' },
            day: { type: 'integer', minimum: 1, maximum: 31, description: 'Day (1-31)' },
          },
          required: ['name', 'value', 'type', 'person', 'year', 'month', 'day'],
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
