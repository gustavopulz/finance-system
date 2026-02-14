import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";
import { signAccessToken, signRefreshToken, hashToken, generateCsrfToken } from "@/lib/auth";
import { setAuthCookies, setCsrfCookie } from "@/lib/cookies";
import { z } from "zod";
import bcrypt from "bcrypt";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, role: true },
    });

    if (!user) return badRequest("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return badRequest("Invalid credentials");

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      select: { id: true },
    });

    const refreshToken = await signRefreshToken({ sub: user.id, sid: session.id });
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { tokenHash: hashToken(refreshToken) },
    });

    const accessToken = await signAccessToken({ sub: user.id, role: user.role });

    setAuthCookies({ accessToken, refreshToken });

    const csrf = generateCsrfToken();
    setCsrfCookie(csrf);

    return ok({ userId: user.id });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
