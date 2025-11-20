import { z } from 'zod';
import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '.env-production' : '.env';
dotenv.config({ path: envFile });

const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'production']),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ~32+ chars'),
    JWT_ISSUER: z.string().default('next15-api'),
    JWT_AUDIENCE: z.string().default('next15-clients'),
    JWT_EXP: z.string().default('15m'),
    JWT_REFRESH_EXP: z.string().default('30d'),
    CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export const env = envSchema.parse(process.env);

export const ALLOWED_ORIGINS = env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim());