import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    console.log('Intentando registrar:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    // Verificar conexión a la base de datos
    try {
      await db.$connect();
      console.log('Conexión a DB exitosa');
    } catch (connError) {
      console.error('Error conectando a DB:', connError);
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);
    
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    console.log('Usuario creado:', user.id);

    const response = NextResponse.json({ user });
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Register error completo:', error);
    return NextResponse.json({ 
      error: 'Error al registrar',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
