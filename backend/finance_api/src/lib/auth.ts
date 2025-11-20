import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { env } from './env';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type TokenPayload = {
  sub: string; // user id
  role: 'USER' | 'ADMIN';
  email: string;
};

export async function signAccessToken(payload: TokenPayload) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXP)
    .sign(secret);
}

export async function signRefreshToken(payload: TokenPayload) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXP)
    .sign(secret);
}

export async function verifyToken<T = TokenPayload>(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return payload as unknown as T;
}