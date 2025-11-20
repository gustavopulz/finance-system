import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  try {
    // O token já foi verificado pelo middleware, pode pegar do cookie
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const accountsSnap = await firestore
      .collection('accounts')
      .where('userId', '==', user.id)
      .where('month', '==', month)
      .where('year', '==', year)
      .where('status', '==', 'Pendente')
      .get();
    const accounts = accountsSnap.docs.map((doc) => doc.data());
    const total = accounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const origemTotals: Record<string, number> = {};
    accounts.forEach((acc) => {
      if (acc.origem) {
        origemTotals[acc.origem] =
          (origemTotals[acc.origem] || 0) + (acc.value || 0);
      }
    });
    const responsavelTotals: Record<string, number> = {};
    accounts.forEach((acc) => {
      if (acc.responsavel) {
        responsavelTotals[acc.responsavel] =
          (responsavelTotals[acc.responsavel] || 0) + (acc.value || 0);
      }
    });
    const salarySnap = await firestore
      .collection('salary')
      .where('userId', '==', user.id)
      .where('month', '==', month)
      .where('year', '==', year)
      .get();
    const salary = salarySnap.empty ? null : salarySnap.docs[0].data().value;
    return NextResponse.json({
      total,
      origem: origemTotals,
      responsavel: responsavelTotals,
      salary,
      month,
      year,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
