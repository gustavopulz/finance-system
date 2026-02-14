import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";
import { signAccessToken, signRefreshToken, hashToken } from "@/lib/auth";
import { setAuthCookies, setCsrfCookie } from "@/lib/cookies";
import { z } from "zod";
import bcrypt from "bcrypt";
import { generateCsrfToken } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  name: z.string().min(2),
  password: z.string().min(8),
  phone: z
    .string()
    .min(8)
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const { email, username, name, password, phone } = parsed.data;

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (exists) return badRequest("Email or username already exists");

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: passwordHash,
        phone: phone ?? null,
      },
      select: { id: true, role: true },
    });

    // cria sessão refresh
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
