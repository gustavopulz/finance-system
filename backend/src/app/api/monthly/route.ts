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
      orderBy: {
        dueDate: "asc",
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

      const effectiveAmount =
        instance.overriddenAmount !== null &&
        instance.overriddenAmount !== undefined
          ? Number(instance.overriddenAmount)
          : Number(instance.amount);

      const effectiveDueDate =
        instance.overriddenDueDate ?? instance.dueDate;

      grouped[cardId].totals.total += effectiveAmount;

      if (instance.status === "pago") {
        grouped[cardId].totals.totalPaid += effectiveAmount;
      } else {
        grouped[cardId].totals.totalPending += effectiveAmount;
      }

      grouped[cardId].bills.push({
        billInstanceId: instance.id,
        description: instance.bill.description,
        amount: effectiveAmount,
        dueDate: effectiveDueDate,
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
