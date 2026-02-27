import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// POST - Demo login (crea usuario demo si no existe)
export async function POST(request: NextRequest) {
  try {
    // Buscar o crear usuario demo
    let user = await db.user.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (!user) {
      const hashedPassword = await hash('demo123', 10);
      user = await db.user.create({
        data: {
          email: 'demo@example.com',
          password: hashedPassword,
          name: 'Usuario Demo',
        }
      });
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
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Error en login demo' }, { status: 500 });
  }
}
