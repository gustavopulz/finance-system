import { prisma } from "@/lib/prisma";
import {
  ok,
  badRequest,
  forbidden,
  serverError,
} from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

// GET /api/bills?cardId=...
export async function GET(req: Request) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) return badRequest("cardId is required");

    // verificar acesso ao card
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
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
      select: { id: true },
    });

    if (!card) return forbidden();

    const bills = await prisma.bill.findMany({
      where: {
        cardId,
        deletedAt: null,
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
      },
      orderBy: { createdDate: "asc" },
    });

    return ok(bills);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

// POST /api/bills
const createSchema = z.object({
  cardId: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["recorrente", "avulsa", "parcelada"]),
  recurrenceDay: z.number().min(1).max(31).optional(),
  totalInstallments: z.number().min(1).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  createdDate: z.string(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const data = parsed.data;

    // apenas owner pode criar bill
    const card = await prisma.card.findUnique({
      where: { id: data.cardId },
      select: { ownerId: true },
    });

    if (!card) return badRequest("Card not found");
    if (card.ownerId !== ctx.userId) return forbidden();

    const bill = await prisma.bill.create({
      data: {
        cardId: data.cardId,
        createdById: ctx.userId,
        description: data.description,
        category: data.category,
        amount: data.amount,
        type: data.type,
        recurrenceDay: data.recurrenceDay,
        totalInstallments: data.totalInstallments,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdDate: new Date(data.createdDate),
      },
      select: {
        id: true,
        description: true,
        category: true,
        amount: true,
        type: true,
        createdDate: true,
      },
    });

    return ok(bill);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
