import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { env } from "@/lib/env";

const enc = new TextEncoder();
const SECRET = enc.encode(env.JWT_SECRET);

export type AccessPayload = {
  sub: string; // userId
  role: "admin" | "user";
  typ: "access";
};

export type RefreshPayload = {
  sub: string;
  sid: string; // refresh session id
  typ: "refresh";
};

export async function signAccessToken(p: Omit<AccessPayload, "typ">) {
  return new SignJWT({ ...p, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXP) // ex: "15m"
    .sign(SECRET);
}

export async function signRefreshToken(p: Omit<RefreshPayload, "typ">) {
  return new SignJWT({ ...p, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXP) // ex: "30d"
    .sign(SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  if (payload.typ !== "access") throw new Error("Invalid token type");
  return {
    sub: payload.sub as string,
    role: payload.role as "admin" | "user",
    typ: "access",
  };
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  if (payload.typ !== "refresh") throw new Error("Invalid token type");
  return {
    sub: payload.sub as string,
    sid: payload.sid as string,
    typ: "refresh",
  };
}

// Hash seguro (não salvar refresh token puro no DB)
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// CSRF token (double submit)
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}
