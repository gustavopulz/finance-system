import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

// GET /api/cards/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = params;

    const card = await prisma.card.findFirst({
      where: {
        id,
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
    });

    if (!card) return notFound();

    return ok(card);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

// PATCH /api/cards/[id]
const updateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    // Apenas owner pode editar
    const card = await prisma.card.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!card) return notFound();
    if (card.ownerId !== ctx.userId) return forbidden();

    const updated = await prisma.card.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        isArchived: true,
        updatedAt: true,
      },
    });

    return ok(updated);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

// DELETE /api/cards/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = params;

    const card = await prisma.card.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!card) return notFound();
    if (card.ownerId !== ctx.userId) return forbidden();

    // Soft delete → arquivar
    await prisma.card.update({
      where: { id },
      data: { isArchived: true },
    });

    return ok({ deleted: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
