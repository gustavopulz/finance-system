import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../lib/firestore';
import { verifyToken } from '../../lib/jwt';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const month = req.nextUrl.searchParams.get('month');
    const year = req.nextUrl.searchParams.get('year');
    let salarySnap;
    if (month && year) {
      salarySnap = await firestore.collection('salary')
        .where('userId', '==', user.id)
        .where('month', '==', Number(month))
        .where('year', '==', Number(year))
        .get();
    } else {
      salarySnap = await firestore.collection('salary')
        .where('userId', '==', user.id)
        .get();
    }
    const salaries = salarySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(salaries);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const { value, month, year } = await req.json();
    if (!value || !month || !year) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    }
    const salarySnap = await firestore.collection('salary')
      .where('userId', '==', user.id)
      .where('month', '==', Number(month))
      .where('year', '==', Number(year))
      .get();
    if (!salarySnap.empty) {
      const salaryDoc = salarySnap.docs[0];
      await firestore.collection('salary').doc(salaryDoc.id).update({ value });
      return NextResponse.json({ success: true, updated: true });
    }
    await firestore.collection('salary').add({ userId: user.id, value, month: Number(month), year: Number(year) });
    return NextResponse.json({ success: true, created: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
