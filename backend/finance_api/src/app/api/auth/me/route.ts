import { NextRequest } from 'next/server';
import { ok, badRequest, serverError, unauthorized } from '@/lib/response';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return unauthorized();

  const token = auth.slice("Bearer ".length);
  try {
    const payload = await verifyToken(token);
    const me = await prisma.user.findUnique({
      where: { id: payload.sub },
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
    if (!me) return unauthorized();
    return ok(me);
  } catch {
    return unauthorized();
  }
}

// atualizar campos não sensíveis
export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return unauthorized();

  const token = auth.slice("Bearer ".length);
  const payload = await verifyToken(token);

  const json = await req.json();
  const { name, phone } = json;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw badRequest('Nome é obrigatório');
  }
  if (phone && typeof phone !== 'string') {
    throw badRequest('Telefone inválido');
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: payload.sub },
      data: {
        name: name,
        phone: phone,
      },
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

    return ok(updatedUser);
  } catch (e) {
    return serverError('Erro ao atualizar usuário');
  }
}