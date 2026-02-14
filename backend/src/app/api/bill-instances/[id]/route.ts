import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";
import { z } from "zod";

const schema = z.object({
  overriddenAmount: z.number().positive().optional(),
  overriddenDueDate: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const instance = await prisma.billInstance.findFirst({
      where: {
        id: params.id,
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

    if (instance.status !== "pendente") {
      return badRequest("Cannot override a paid or cancelled instance");
    }

    const data: any = {};

    if (parsed.data.overriddenAmount !== undefined) {
      data.overriddenAmount = parsed.data.overriddenAmount;
    }

    if (parsed.data.overriddenDueDate !== undefined) {
      data.overriddenDueDate = new Date(parsed.data.overriddenDueDate);
    }

    const updated = await prisma.billInstance.update({
      where: { id: params.id },
      data,
    });

    return ok(updated);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
