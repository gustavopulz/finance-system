import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";

export async function DELETE(
  _req: Request,
  { params }: { params: { linkedUserId: string } }
) {
  const ctx = await getRequestContext();

  await prisma.userLink.updateMany({
    where: {
      ownerId: ctx.userId,
      linkedUserId: params.linkedUserId,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  // revoga todos os cards
  await prisma.cardAccess.updateMany({
    where: {
      grantedToId: params.linkedUserId,
      card: { ownerId: ctx.userId },
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return ok({ revoked: true });
}
