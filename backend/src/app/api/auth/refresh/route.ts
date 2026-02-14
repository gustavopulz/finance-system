import { prisma } from "@/lib/prisma";
import { ok, unauthorized, serverError } from "@/lib/response";
import { verifyRefreshToken, signAccessToken, signRefreshToken, hashToken } from "@/lib/auth";
import { setAuthCookies } from "@/lib/cookies";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const rt = (await cookies()).get("fs_rt")?.value;
    if (!rt) return unauthorized();

    const payload = await verifyRefreshToken(rt);

    const session = await prisma.refreshSession.findUnique({
      where: { id: payload.sid },
      select: { id: true, userId: true, tokenHash: true, expiresAt: true, revokedAt: true, user: { select: { role: true } } },
    });

    if (!session || session.revokedAt) return unauthorized();
    if (session.expiresAt.getTime() < Date.now()) return unauthorized();
    if (session.userId !== payload.sub) return unauthorized();

    if (session.tokenHash !== hashToken(rt)) return unauthorized();

    // rotaciona: cria nova sessão
    const newSession = await prisma.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      select: { id: true },
    });

    const newRefresh = await signRefreshToken({ sub: session.userId, sid: newSession.id });

    await prisma.refreshSession.update({
      where: { id: newSession.id },
      data: { tokenHash: hashToken(newRefresh) },
    });

    // revoga antiga
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), replacedById: newSession.id },
    });

    const newAccess = await signAccessToken({ sub: session.userId, role: session.user.role });

    setAuthCookies({ accessToken: newAccess, refreshToken: newRefresh });

    return ok({ ok: true });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
