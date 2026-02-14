import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

const schema = z.object({
  token: z.string(),
});

export async function POST(req: Request) {
  const ctx = await getRequestContext();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input");

  const shareToken = await prisma.shareToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!shareToken) return badRequest("Invalid token");
  if (shareToken.expiresAt && shareToken.expiresAt < new Date())
    return badRequest("Token expired");

  if (shareToken.creatorId === ctx.userId)
    return forbidden("Cannot link yourself");

  await prisma.userLink.upsert({
    where: {
      ownerId_linkedUserId: {
        ownerId: shareToken.creatorId,
        linkedUserId: ctx.userId,
      },
    },
    update: { revokedAt: null },
    create: {
      ownerId: shareToken.creatorId,
      linkedUserId: ctx.userId,
    },
  });

  return ok({ linked: true });
}
