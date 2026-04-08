import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener datos P&L
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const pnlData = await db.pNLData.findMany({
      where: { userId },
      orderBy: { period: 'desc' }
    });
    return NextResponse.json(pnlData);
  } catch (error) {
    console.error('Error fetching P&L data:', error);
    return NextResponse.json({ error: 'Error al obtener datos P&L' }, { status: 500 });
  }
}

// POST - Crear o actualizar datos P&L
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Upsert: crear o actualizar según el período
    const pnl = await db.pNLData.upsert({
      where: {
        userId_period: {
          userId,
          period: data.period
        }
      },
      update: {
        accountPlans: data.accountPlans
      },
      create: {
        userId,
        period: data.period,
        accountPlans: data.accountPlans
      }
    });
    return NextResponse.json(pnl);
  } catch (error) {
    console.error('Error saving P&L data:', error);
    return NextResponse.json({ error: 'Error al guardar datos P&L' }, { status: 500 });
  }
}

// DELETE - Eliminar datos P&L
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.pNLData.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting P&L data:', error);
    return NextResponse.json({ error: 'Error al eliminar datos P&L' }, { status: 500 });
  }
}
