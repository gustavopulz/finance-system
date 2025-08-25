import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const accountsSnap = await firestore.collection('accounts')
      .where('userId', '==', user.id)
      .where('month', '==', month)
      .where('year', '==', year)
      .where('status', '==', 'ativo')
      .get();
    const accounts = accountsSnap.docs.map(doc => doc.data());
    const total = accounts.reduce((sum, acc) => sum + (acc.value || 0), 0);
    const origemTotals: Record<string, number> = {};
    accounts.forEach(acc => {
      if (acc.origem) {
        origemTotals[acc.origem] = (origemTotals[acc.origem] || 0) + (acc.value || 0);
      }
    });
    const responsavelTotals: Record<string, number> = {};
    accounts.forEach(acc => {
      if (acc.responsavel) {
        responsavelTotals[acc.responsavel] = (responsavelTotals[acc.responsavel] || 0) + (acc.value || 0);
      }
    });
    const salarySnap = await firestore.collection('salary')
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
