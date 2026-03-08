import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const user = await db.user.findUnique({ 
      where: { email },
      include: { settings: true, aiProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      user: { id: user.id, email: user.email, name: user.name }
    });

    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Login error stack:', errorStack);
    return NextResponse.json({ 
      error: 'Error al iniciar sesión',
      details: errorMessage 
    }, { status: 500 });
  }
}
// Force redeploy - Sat Mar  7 20:37:58 UTC 2026
// Deploy fix - Sun Mar  8 14:40:25 UTC 2026
