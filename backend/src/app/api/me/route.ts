import { prisma } from "@/lib/prisma";
import { ok, serverError, unauthorized } from "@/lib/response";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  try {
    const ctx = await getRequestContext();

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return unauthorized();
    }

    return ok(user);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
