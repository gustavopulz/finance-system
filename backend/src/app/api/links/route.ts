import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const ctx = await getRequestContext();

  const links = await prisma.userLink.findMany({
    where: {
      ownerId: ctx.userId,
      revokedAt: null,
    },
    include: {
      linkedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return ok(links);
}
