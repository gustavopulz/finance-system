import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { verifyRefreshToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { clearAuthCookies } from "@/lib/cookies";

export async function POST() {
  const rt = (await cookies()).get("fs_rt")?.value;

  if (rt) {
    try {
      const p = await verifyRefreshToken(rt);
      await prisma.refreshSession.update({
        where: { id: p.sid },
        data: { revokedAt: new Date() },
      });
    } catch {
      // ignora token inválido
    }
  }

  clearAuthCookies();
  return ok({ ok: true });
}
