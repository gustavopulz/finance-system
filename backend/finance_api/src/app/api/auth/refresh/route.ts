import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signAccessToken } from '@/lib/auth';
import { unauthorized, serverError } from '@/lib/response';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('refresh_token')?.value;
    if (!cookie) return unauthorized('Missing refresh token');

    const payload = await verifyToken(cookie);
    const newAccessToken = await signAccessToken(payload);

    return NextResponse.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (e) {
    logger.error({ err: e }, 'refresh_failed');
    return unauthorized('Invalid or expired refresh token');
  }
}
