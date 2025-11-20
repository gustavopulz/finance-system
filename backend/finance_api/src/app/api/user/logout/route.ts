import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/authCookies';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout realizado com sucesso' }, { status: 200 });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    console.error('Erro no logout:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
