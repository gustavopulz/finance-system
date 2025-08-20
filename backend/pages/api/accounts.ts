import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const { month, year, ownerId, type } = req.query;

      const where: any = {};

      if (ownerId) where.ownerId = Number(ownerId);
      if (type) where.type = type;
      if (month && year) {
        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
        where.dueDate = { gte: start, lte: end };
      }

      const accounts = await prisma.account.findMany({
        where,
        include: { owner: true, user: true },
        orderBy: { dueDate: 'asc' },
      });

      return res.status(200).json(accounts);
    }

    if (req.method === 'POST') {
      const {
        description,
        value,
        installment,
        type,
        ownerId,
        userId,
        dueDate,
      } = req.body;

      const account = await prisma.account.create({
        data: {
          description,
          value,
          installment,
          type,
          ownerId: ownerId ? Number(ownerId) : null,
          userId: userId ? Number(userId) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      return res.status(201).json(account);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
