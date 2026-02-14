import { prisma } from "@/lib/prisma";

export async function generateMonthlyInstances(
  userId: string,
  year: number,
  month: number
) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const bills = await prisma.bill.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      startDate: { lte: endOfMonth },
      OR: [
        { endDate: null },
        { endDate: { gte: startOfMonth } },
      ],
      card: {
        OR: [
          { ownerId: userId },
          {
            access: {
              some: {
                grantedToId: userId,
                revokedAt: null,
              },
            },
          },
        ],
      },
    },
  });

  for (const bill of bills) {
    // Avulsa
    if (bill.type === "avulsa") {
      if (
        bill.startDate.getFullYear() !== year ||
        bill.startDate.getMonth() + 1 !== month
      ) {
        continue;
      }
    }

    // Parcelada
    let installmentNumber: number | null = null;

    if (bill.type === "parcelada" && bill.totalInstallments) {
      const diffMonths =
        (year - bill.startDate.getFullYear()) * 12 +
        (month - (bill.startDate.getMonth() + 1));

      if (diffMonths < 0) continue;
      if (diffMonths >= bill.totalInstallments) continue;

      installmentNumber = diffMonths + 1;
    }

    // Recorrente
    // já filtrado por startDate e endDate

    const dueDay = bill.recurrenceDay ?? 1;

    // Evita datas inválidas tipo 31 em fevereiro
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const safeDay = Math.min(dueDay, lastDayOfMonth);

    const dueDate = new Date(year, month - 1, safeDay);

    await prisma.billInstance.upsert({
      where: {
        billId_referenceYear_referenceMonth: {
          billId: bill.id,
          referenceYear: year,
          referenceMonth: month,
        },
      },
      update: {},
      create: {
        billId: bill.id,
        referenceYear: year,
        referenceMonth: month,
        dueDate,
        amount: bill.amount,
        installmentNumber,
      },
    });
  }
}
