import { prisma } from "@/lib/prisma";
import { ok, forbidden, badRequest } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

const schema = z.object({
  cardIds: z.array(z.string()),
});

export async function PUT(
  req: Request,
  { params }: { params: { linkedUserId: string } }
) {
  const ctx = await getRequestContext();
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) return badRequest("Invalid input");

  const { linkedUserId } = params;
  const { cardIds } = parsed.data;

  const link = await prisma.userLink.findUnique({
    where: {
      ownerId_linkedUserId: {
        ownerId: ctx.userId,
        linkedUserId,
      },
    },
  });

  if (!link || link.revokedAt) return forbidden();

  // Remove acessos que não estão mais na lista
  await prisma.cardAccess.updateMany({
    where: {
      grantedToId: linkedUserId,
      card: { ownerId: ctx.userId },
      cardId: { notIn: cardIds },
    },
    data: { revokedAt: new Date() },
  });

  // Criar ou reativar acessos
  for (const cardId of cardIds) {
    await prisma.cardAccess.upsert({
      where: {
        cardId_grantedToId: {
          cardId,
          grantedToId: linkedUserId,
        },
      },
      update: { revokedAt: null },
      create: {
        cardId,
        grantedById: ctx.userId,
        grantedToId: linkedUserId,
      },
    });
  }

  return ok({ updated: true });
}
