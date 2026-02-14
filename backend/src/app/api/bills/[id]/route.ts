import { prisma } from "@/lib/prisma";
import {
  ok,
  badRequest,
  forbidden,
  notFound,
  serverError,
} from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

// GET /api/bills/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = params;

    const bill = await prisma.bill.findFirst({
      where: {
        id,
        deletedAt: null,
        card: {
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
      },
      select: {
        id: true,
        description: true,
        category: true,
        amount: true,
        type: true,
        recurrenceDay: true,
        totalInstallments: true,
        startDate: true,
        endDate: true,
        createdDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!bill) return notFound();

    return ok(bill);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

// PATCH /api/bills/[id]
const updateSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  recurrenceDay: z.number().min(1).max(31).optional(),
  totalInstallments: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  createdDate: z.string().optional(),
  isActive: z.boolean().optional(),
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

    // buscar bill + card owner
    const bill = await prisma.bill.findUnique({
      where: { id },
      select: {
        id: true,
        card: { select: { ownerId: true } },
      },
    });

    if (!bill) return notFound();
    if (bill.card.ownerId !== ctx.userId) return forbidden();

    const data: any = { ...parsed.data };

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.createdDate) data.createdDate = new Date(data.createdDate);

    const updated = await prisma.bill.update({
      where: { id },
      data,
      select: {
        id: true,
        description: true,
        category: true,
        amount: true,
        type: true,
        recurrenceDay: true,
        totalInstallments: true,
        startDate: true,
        endDate: true,
        createdDate: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return ok(updated);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

// DELETE /api/bills/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = params;

    const bill = await prisma.bill.findUnique({
      where: { id },
      select: {
        card: { select: { ownerId: true } },
      },
    });

    if (!bill) return notFound();
    if (bill.card.ownerId !== ctx.userId) return forbidden();

    await prisma.bill.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return ok({ deleted: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
