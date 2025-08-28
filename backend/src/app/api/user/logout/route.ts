import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = new NextResponse(
      JSON.stringify({ message: 'Logout realizado com sucesso' }),
      { status: 200 }
    );

    // 🔒 Limpa access token
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    // 🔒 Limpa refresh token
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error('Erro no logout:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
