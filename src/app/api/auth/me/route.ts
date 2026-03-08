import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ user: null });
  }

  // Si es el usuario demo, devolver sin consultar la DB
  if (userId === 'demo-user-123') {
    return NextResponse.json({ 
      user: { 
        id: 'demo-user-123', 
        email: 'demo@example.com', 
        name: 'Usuario Demo' 
      } 
    });
  }

  // Para usuarios reales, intentar conectar a la DB
  try {
    const { db } = await import('@/lib/db');
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    // Si la DB falla, devolver null
    return NextResponse.json({ user: null });
  }
}
