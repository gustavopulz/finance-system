import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const user = verifyToken(authToken);
    const month = req.nextUrl.searchParams.get('month');
    const year = req.nextUrl.searchParams.get('year');
    const userId = req.nextUrl.searchParams.get('userId') || user.id;
    const tipo = req.nextUrl.searchParams.get('tipo') || 'saida';
    let query = firestore.collection('accounts').where('userId', '==', userId).where('tipo', '==', tipo);
    if (month && year) {
      query = query.where('year', '>=', Number(year)).where('month', '>=', Number(month));
    }
    const accountsSnap = await query.get();
    const now = new Date();
    const batch = firestore.batch();
    const accounts = accountsSnap.docs.map((doc) => {
      const data = doc.data();
      // Atualiza status automaticamente se for entrada "A receber" e data passou
      if (
        data.status === 'Pendente' &&
        data.recebimentoPrevisto &&
        new Date(data.recebimentoPrevisto) <= now
      ) {
        data.status = 'quitado';
        batch.update(doc.ref, { status: 'quitado' });
      }
      return { id: doc.id, ...data };
    });
    // Aplica updates em lote se necessário
    if (!accountsSnap.empty) {
      await batch.commit();
    }
    return NextResponse.json(accounts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const user = verifyToken(authToken);
    const {
      collaboratorId,
      description,
      value,
      parcelasTotal,
      month,
      year,
      status,
      userId,
      origem,
      responsavel,
      recebimentoPrevisto,
      tipo,
    } = await req.json();
    const uid = userId || user.id;
    if (!collaboratorId || !description || !value || !month || !year) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios' },
        { status: 400 }
      );
    }
    // Build account data and set defaults
    const accountData: any = {
      collaboratorId,
      description: description.trim(),
      value,
      parcelasTotal: parcelasTotal === undefined ? null : parcelasTotal,
      month,
      year,
      status: status || 'Pendente',
      userId: uid,
      origem: origem || null,
      responsavel: responsavel || null,
      paid: false, // Adiciona coluna paid com valor False
      recebimentoPrevisto: recebimentoPrevisto || null,
      tipo: tipo || 'saida', // padrão: saida
    };
    // Remove any undefined values
    Object.keys(accountData).forEach((key) => {
      if (accountData[key] === undefined) {
        delete accountData[key];
      }
    });
    const accountRef = await firestore.collection('accounts').add(accountData);
    return NextResponse.json({ id: accountRef.id, ...accountData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
