import { prisma } from "@/lib/prisma";
import {
  ok,
  forbidden,
  notFound,
  badRequest,
  serverError,
} from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = params;

    const instance = await prisma.billInstance.findFirst({
      where: {
        id,
        bill: {
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
      },
      select: {
        id: true,
        status: true,
        amount: true,
        payments: {
          select: { amount: true },
        },
      },
    });

    if (!instance) return notFound();

    if (instance.status !== "cancelado") {
      return badRequest("Instance is not cancelled");
    }

    const totalPaid = instance.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    if (totalPaid > 0) {
      return badRequest(
        "Cannot uncancel an instance that already has payments"
      );
    }

    await prisma.billInstance.update({
      where: { id },
      data: {
        status: "pendente",
        cancelledAt: null,
      },
    });

    return ok({ uncancelled: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
