import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth';
import { badRequest, serverError, unauthorized } from '@/lib/response';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) return badRequest('Invalid payload', parsed.error);

    const { email, username, password } = parsed.data;

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) return badRequest('User already exists');

    user = await prisma.user.findUnique({ where: { username } });
    if (user) return badRequest('Username already taken');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: parsed.data.name,
        phone: parsed.data.phone, //opcional
      },
    });

    const payload = { sub: newUser.id, role: newUser.role, email: newUser.email, username: newUser.username } as const;
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Define cookie seguro com refresh token
    const res = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: { id: newUser.id, email: newUser.email, username: newUser.username, name: newUser.name, role: newUser.role },
      },
    });

    res.cookies.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return res;
  } catch (e) {
    logger.error({ err: e }, 'register_failed');
    return serverError();
  }
}
