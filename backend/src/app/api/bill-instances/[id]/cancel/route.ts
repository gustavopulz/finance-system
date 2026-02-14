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
        payments: { select: { id: true } },
      },
    });

    if (!instance) return notFound();

    if (instance.status === "cancelado") {
      return ok({ alreadyCancelled: true });
    }

    if (instance.payments.length > 0) {
      return badRequest(
        "Cannot cancel an instance that already has payments"
      );
    }

    await prisma.billInstance.update({
      where: { id },
      data: {
        status: "cancelado",
        cancelledAt: new Date(),
      },
    });

    return ok({ cancelled: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
