import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = new NextResponse(
      JSON.stringify({ message: 'Logout realizado com sucesso' }),
      { status: 200 }
    );

    const isProd = process.env.NODE_ENV === 'production';

    // 🔒 Limpa access token
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
    });

    // 🔒 Limpa refresh token
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error('Erro no logout:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
