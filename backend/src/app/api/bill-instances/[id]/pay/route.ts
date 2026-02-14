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
        status: { not: "cancelado" },
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
    });

    if (!instance) return notFound();

    if (instance.status === "pago") {
      return ok({ alreadyPaid: true });
    }

    await prisma.billInstance.update({
      where: { id },
      data: {
        status: "pago",
        paidAt: new Date(),
        paidByUserId: ctx.userId,
      },
    });

    return ok({ paid: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
