import { NextRequest, NextResponse } from 'next/server';
import { badRequest, serverError, unauthorized } from '@/lib/response';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) return badRequest('Invalid payload', parsed.error);

    // permite login com email ou username
    const { identifier, password } = parsed.data;

    let user;
    if (identifier.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
    } else {
      user = await prisma.user.findUnique({ where: { username: identifier } });
    }

    if (!user) return unauthorized('Invalid credentials');

    const okPass = await bcrypt.compare(password, user.password);
    if (!okPass) return unauthorized('Invalid credentials');

    const payload = { sub: user.id, role: user.role, email: user.email, username: user.username } as const;
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Define cookie seguro com refresh token
    const res = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
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
    logger.error({ err: e }, 'login_failed');
    return serverError();
  }
}
