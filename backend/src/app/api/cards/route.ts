import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

// GET /api/cards
export async function GET() {
  try {
    const ctx = await getRequestContext();

    const cards = await prisma.card.findMany({
      where: {
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
      select: {
        id: true,
        name: true,
        ownerId: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return ok(cards);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

// POST /api/cards
const createSchema = z.object({
  name: z.string().min(2).max(150),
});

export async function POST(req: Request) {
  try {
    const ctx = await getRequestContext();

    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const card = await prisma.card.create({
      data: {
        name: parsed.data.name,
        ownerId: ctx.userId,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        isArchived: true,
        createdAt: true,
      },
    });

    return ok(card);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
