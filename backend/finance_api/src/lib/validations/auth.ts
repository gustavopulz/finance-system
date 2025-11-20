import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  username: z.string().min(3).max(30),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  // permite login com email ou username
  identifier: z.string().min(3).max(80),
  password: z.string().max(128),
});