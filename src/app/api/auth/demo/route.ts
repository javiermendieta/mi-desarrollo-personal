import { NextResponse } from 'next/server';

// Demo login SIN base de datos - para emergencias cuando Supabase no está disponible
export async function POST() {
  try {
    // Usuario demo hardcodeado - NO depende de la base de datos
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: 'Usuario Demo'
    };

    const response = NextResponse.json({ 
      user: demoUser,
      message: 'Login demo exitoso - modo sin base de datos',
      success: true
    });

    response.cookies.set('userId', demoUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Error en login demo', success: false }, { status: 500 });
  }
}
