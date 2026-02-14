import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ~32+ chars'),
    JWT_EXP: z.string().default('15m'),
    JWT_REFRESH_EXP: z.string().default('30d'),
    CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);

export const ALLOWED_ORIGINS = env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim());