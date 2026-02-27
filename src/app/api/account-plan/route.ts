import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener plan de cuentas
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const accountPlan = await db.accountPlanItem.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(accountPlan);
  } catch (error) {
    console.error('Error fetching account plan:', error);
    return NextResponse.json({ error: 'Error al obtener plan de cuentas' }, { status: 500 });
  }
}

// POST - Crear item del plan de cuentas
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const account = await db.accountPlanItem.create({
      data: {
        userId,
        code: data.code,
        name: data.name,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        order: data.order || 0,
        isActive: data.isActive ?? true,
      }
    });
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating account plan item:', error);
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 });
  }
}

// PUT - Actualizar item del plan de cuentas
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const account = await db.accountPlanItem.update({
      where: { id: data.id, userId },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        order: data.order,
        isActive: data.isActive,
      }
    });
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating account plan item:', error);
    return NextResponse.json({ error: 'Error al actualizar cuenta' }, { status: 500 });
  }
}

// DELETE - Eliminar item del plan de cuentas
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

    await db.accountPlanItem.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account plan item:', error);
    return NextResponse.json({ error: 'Error al eliminar cuenta' }, { status: 500 });
  }
}
