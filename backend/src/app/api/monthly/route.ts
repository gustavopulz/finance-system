import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { generateMonthlyInstances } from "@/lib/services/generateMonthlyInstances";

export async function GET(req: Request) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);

    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!year || !month) {
      return badRequest("year and month are required");
    }

    await generateMonthlyInstances(ctx.userId, year, month);

    const instances = await prisma.billInstance.findMany({
      where: {
        referenceYear: year,
        referenceMonth: month,
        status: { not: "cancelado" },
        bill: {
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
      },
      include: {
        bill: {
          select: {
            description: true,
            totalInstallments: true,
            createdDate: true,
            card: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const grouped: Record<string, any> = {};

    for (const instance of instances) {
      const cardId = instance.bill.card.id;

      if (!grouped[cardId]) {
        grouped[cardId] = {
          cardId,
          cardName: instance.bill.card.name,
          totals: {
            total: 0,
            totalPaid: 0,
            totalPending: 0,
          },
          bills: [],
        };
      }

      const amount = Number(instance.amount);

      grouped[cardId].totals.total += amount;

      if (instance.status === "pago") {
        grouped[cardId].totals.totalPaid += amount;
      } else {
        grouped[cardId].totals.totalPending += amount;
      }

      grouped[cardId].bills.push({
        billInstanceId: instance.id,
        description: instance.bill.description,
        amount,
        status: instance.status,
        installmentLabel:
          instance.installmentNumber &&
          instance.bill.totalInstallments
            ? `${instance.installmentNumber}/${instance.bill.totalInstallments}`
            : "Fixo",
      });
    }

    return ok(Object.values(grouped));
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
