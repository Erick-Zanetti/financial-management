import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27019/financial-management',
    host: process.env.MONGODB_HOST || 'localhost',
    port: process.env.MONGODB_PORT || '27019',
  },
  backup: {
    path: process.env.BACKUP_PATH || './backups/',
  },
} as const;
