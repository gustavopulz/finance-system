import { NextResponse } from 'next/server';

export async function POST() {
  // Limpa o cookie de autenticação
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Set-Cookie': 'token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
  });
}
