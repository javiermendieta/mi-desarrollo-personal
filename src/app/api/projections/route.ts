import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Crear proyección
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const data = await request.json();

    const projection = await db.cashFlowProjection.create({
      data: {
        id: data.id || undefined,
        userId,
        description: data.description || '',
        type: data.type || 'income',
        projectedAmount: parseFloat(data.projectedAmount) || 0,
        realAmount: data.realAmount != null && data.realAmount !== '' ? parseFloat(data.realAmount) : null,
        date: new Date(data.date || new Date()),
        status: data.status || 'projected',
        category: data.category || null,
        notes: data.notes || null,
      }
    });

    return NextResponse.json({
      ...projection,
      date: projection.date.toISOString().split('T')[0],
      realAmount: projection.realAmount ?? undefined,
    });
  } catch (error) {
    console.error('Error creating projection:', error);
    return NextResponse.json({ error: 'Error al crear proyección' }, { status: 500 });
  }
}

// PUT - Actualizar proyección
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido para PUT' }, { status: 400 });
    }

    const projection = await db.cashFlowProjection.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId,
        description: data.description || '',
        type: data.type || 'income',
        projectedAmount: parseFloat(data.projectedAmount) || 0,
        realAmount: data.realAmount != null && data.realAmount !== '' ? parseFloat(data.realAmount) : null,
        date: new Date(data.date || new Date()),
        status: data.status || 'projected',
        category: data.category || null,
        notes: data.notes || null,
      },
      update: {
        description: data.description,
        type: data.type,
        projectedAmount: parseFloat(data.projectedAmount) || 0,
        realAmount: data.realAmount != null && data.realAmount !== '' ? parseFloat(data.realAmount) : null,
        date: new Date(data.date),
        status: data.status,
        category: data.category || null,
        notes: data.notes || null,
      }
    });

    return NextResponse.json({
      ...projection,
      date: projection.date.toISOString().split('T')[0],
      realAmount: projection.realAmount ?? undefined,
    });
  } catch (error) {
    console.error('Error upserting projection:', error);
    return NextResponse.json({ error: 'Error al guardar proyección', details: String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar proyección
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.cashFlowProjection.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting projection:', error);
    return NextResponse.json({ error: 'Error al eliminar proyección' }, { status: 500 });
  }
}
