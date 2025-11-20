import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, serverError } from "@/lib/response";
import { verifyToken } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

/**
 * POST /api/me/alterar-senha
 * Permite ao usuário autenticado alterar sua própria senha.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return unauthorized();

    const token = auth.slice("Bearer ".length);
    const payload = await verifyToken(token);
    const userId = payload.sub;

    if (!userId) return unauthorized();

    const json = await req.json();
    const parsed = changePasswordSchema.safeParse(json);
    if (!parsed.success) return badRequest('Invalid payload', parsed.error);

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) return unauthorized();

    const senhaCorreta = await bcrypt.compare(currentPassword, user.password);
    if (!senhaCorreta) return unauthorized("Senha atual incorreta.");

    const novaSenhaHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: novaSenhaHash },
    });

    return ok({ message: "Senha alterada com sucesso." });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return serverError();
  }
}
