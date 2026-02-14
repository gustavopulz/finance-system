import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/request-context";

export async function requireUser() {
  const ctx = await getRequestContext();

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, role: true },
  });

  if (!user) throw new Error("Unauthorized");

  return { ...ctx, role: user.role };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.role !== "admin") throw new Error("Forbidden");
  return ctx;
}

/**
 * Garante que o usuário pode acessar o card
 */
export async function assertCardAccess(cardId: string) {
  const ctx = await requireUser();

  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      OR: [
        { ownerId: ctx.userId },
        {
          access: {
            some: {
              grantedToId: ctx.userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!card) throw new Error("Forbidden");

  return ctx;
}
