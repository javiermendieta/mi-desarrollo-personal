import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const habits = await db.habit.findMany({ where: { userId } });
    return NextResponse.json({ habits });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Error al obtener hábitos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const data = await request.json();
    
    const habit = await db.habit.create({
      data: {
        id: data.id,
        userId,
        name: data.name,
        description: data.description || null,
        icon: data.icon || 'check',
        color: data.color || '#22c55e',
        frequency: data.frequency || 'daily',
        customDays: data.customDays || null,
        isActive: data.isActive ?? true,
        logs: data.logs || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({ habit });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Error al crear hábito' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const { id, ...data } = await request.json();
    
    const habit = await db.habit.update({
      where: { id, userId },
      data: {
        ...data,
        name: data.name,
        description: data.description || null,
        color: data.color,
        frequency: data.frequency,
        logs: data.logs,
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({ habit });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Error al actualizar hábito' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const { id } = await request.json();
    await db.habit.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Error al eliminar hábito' }, { status: 500 });
  }
}
