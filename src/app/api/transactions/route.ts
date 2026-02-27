import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener transacciones
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    const where: { userId: string; date?: { gte: Date; lte: Date } } = { userId };
    
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      where.date = { gte: startDate, lte: endDate };
    }
    
    const transactions = await db.transaction.findMany({ 
      where, 
      orderBy: { date: 'desc' } 
    });
    
    // Formatear fechas para el frontend
    const formatted = transactions.map(t => ({
      ...t,
      date: t.date.toISOString().split('T')[0],
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Error al obtener transacciones' }, { status: 500 });
  }
}

// POST - Crear transacción
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const data = await request.json();
    
    const transaction = await db.transaction.create({ 
      data: { 
        id: data.id || undefined,
        userId,
        type: data.type || 'expense',
        amount: parseFloat(data.amount) || 0,
        category: data.category || data.accountId || 'other',
        description: data.description || '',
        date: new Date(data.date || new Date()),
        accountId: data.accountId || null,
      } 
    });
    
    return NextResponse.json({
      ...transaction,
      date: transaction.date.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Error al crear transacción' }, { status: 500 });
  }
}

// PUT - Actualizar transacción
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const data = await request.json();
    
    const transaction = await db.transaction.update({ 
      where: { id: data.id, userId }, 
      data: {
        type: data.type,
        amount: parseFloat(data.amount) || 0,
        category: data.category || data.accountId,
        description: data.description,
        date: new Date(data.date),
        accountId: data.accountId || null,
      }
    });
    
    return NextResponse.json({
      ...transaction,
      date: transaction.date.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Error al actualizar transacción' }, { status: 500 });
  }
}

// DELETE - Eliminar transacción
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    await db.transaction.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Error al eliminar transacción' }, { status: 500 });
  }
}
