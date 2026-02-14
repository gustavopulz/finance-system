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

function calculateDueDate(
  recurrenceDay: number | null,
  year: number,
  month: number
) {
  const day = recurrenceDay ?? 1;
  const lastDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month - 1, safeDay);
}

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
  type: z.enum(["recorrente", "avulsa", "parcelada"]).optional(),
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

    const existingBill = await prisma.bill.findUnique({
      where: { id },
      include: { card: { select: { ownerId: true } } },
    });

    if (!existingBill) return notFound();
    if (existingBill.card.ownerId !== ctx.userId) return forbidden();

    const data: any = { ...parsed.data };

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
      data.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.createdDate)
      data.createdDate = new Date(data.createdDate);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.bill.findUnique({
        where: { id },
        select: { version: true },
      });

      const updateRes = await tx.bill.updateMany({
        where: {
          id,
          version: before!.version,
        },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });

      if (updateRes.count !== 1) {
        throw new Error("CONFLICT");
      }

      const updatedBill = await tx.bill.findUnique({
        where: { id },
      });

      if (!updatedBill) throw new Error("NOT_FOUND");

      // Validação coerente por tipo
      if (updatedBill.type === "parcelada") {
        if (!updatedBill.totalInstallments) {
          throw new Error("Parcelada requires totalInstallments");
        }
      } else {
        // recorrente ou avulsa
        await tx.bill.update({
          where: { id },
          data: { totalInstallments: null },
        });
        updatedBill.totalInstallments = null;
      }

      // Atualiza instância do mês atual
      const currentInstance =
        await tx.billInstance.findUnique({
          where: {
            billId_referenceYear_referenceMonth: {
              billId: id,
              referenceYear: currentYear,
              referenceMonth: currentMonth,
            },
          },
        });

      if (
        currentInstance &&
        currentInstance.status === "pendente" &&
        !currentInstance.overriddenAmount &&
        !currentInstance.overriddenDueDate
      ) {
        let newInstallment: number | null = null;

        const diffMonths =
          (currentYear - updatedBill.startDate.getFullYear()) *
            12 +
          (currentMonth -
            (updatedBill.startDate.getMonth() + 1));

        if (updatedBill.type === "parcelada") {
          if (
            diffMonths >= 0 &&
            diffMonths < updatedBill.totalInstallments!
          ) {
            newInstallment = diffMonths + 1;
          }
        }

        let newDueDate = currentInstance.dueDate;

        if (
          updatedBill.type === "recorrente" ||
          updatedBill.type === "parcelada"
        ) {
          newDueDate = calculateDueDate(
            updatedBill.recurrenceDay,
            currentYear,
            currentMonth
          );
        }

        if (updatedBill.type === "avulsa") {
          newDueDate = updatedBill.startDate;
        }

        await tx.billInstance.update({
          where: { id: currentInstance.id },
          data: {
            amount: updatedBill.amount,
            dueDate: newDueDate,
            installmentNumber: newInstallment,
          },
        });
      }

      // Reconcile estrutural futuro
      const futureWhere = {
        billId: id,
        OR: [
          { referenceYear: { gt: currentYear } },
          {
            referenceYear: currentYear,
            referenceMonth: { gte: currentMonth },
          },
        ],
      };

      const futureInstances =
        await tx.billInstance.findMany({
          where: futureWhere,
          orderBy: [
            { referenceYear: "asc" },
            { referenceMonth: "asc" },
          ],
        });

      for (const instance of futureInstances) {
        if (
          instance.status === "pago" ||
          instance.status === "cancelado"
        )
          continue;

        const diffMonths =
          (instance.referenceYear -
            updatedBill.startDate.getFullYear()) *
            12 +
          (instance.referenceMonth -
            (updatedBill.startDate.getMonth() + 1));

        let newInstallment: number | null = null;
        let shouldDelete = false;

        if (updatedBill.type === "parcelada") {
          if (
            diffMonths >= 0 &&
            diffMonths < updatedBill.totalInstallments!
          ) {
            newInstallment = diffMonths + 1;
          } else {
            shouldDelete = true;
          }
        }

        if (updatedBill.type === "recorrente") {
          newInstallment = null;
        }

        if (updatedBill.type === "avulsa") {
          const startYear =
            updatedBill.startDate.getFullYear();
          const startMonth =
            updatedBill.startDate.getMonth() + 1;

          if (
            instance.referenceYear !== startYear ||
            instance.referenceMonth !== startMonth
          ) {
            shouldDelete = true;
          }
        }

        if (shouldDelete) {
          await tx.billInstance.delete({
            where: { id: instance.id },
          });
        } else {
          let newDueDate = instance.dueDate;

          if (
            updatedBill.type === "recorrente" ||
            updatedBill.type === "parcelada"
          ) {
            newDueDate = calculateDueDate(
              updatedBill.recurrenceDay,
              instance.referenceYear,
              instance.referenceMonth
            );
          }

          if (updatedBill.type === "avulsa") {
            newDueDate = updatedBill.startDate;
          }

          await tx.billInstance.update({
            where: { id: instance.id },
            data: {
              installmentNumber: newInstallment,
              amount: updatedBill.amount,
              dueDate: newDueDate,
            },
          });
        }
      }

      return updatedBill;
    });

    return ok(result);
  } catch (err: any) {
    if (err.message === "CONFLICT") {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Conflict" },
        }),
        { status: 409 }
      );
    }

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
      include: { card: { select: { ownerId: true } } },
    });

    if (!bill) return notFound();
    if (bill.card.ownerId !== ctx.userId) return forbidden();

    const res = await prisma.bill.updateMany({
      where: {
        id,
        version: bill.version,
      },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });

    if (res.count !== 1) {
      return new Response(JSON.stringify({
        success: false,
        error: { message: "Conflict" },
      }), { status: 409 });
    }

    return ok({ deleted: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

