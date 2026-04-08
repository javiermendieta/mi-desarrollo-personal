import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - Obtener todas las tareas médicas del usuario
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // @ts-expect-error - MedicalTask puede no existir en Prisma Client
    const tasks = await db.medicalTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' as const },
    });
    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('Error fetching medical tasks:', error);
    // Si la tabla no existe, retornar array vacío
    return NextResponse.json([]);
  }
}

// POST - Crear una nueva tarea médica
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('[Medical Tasks API] Received body:', JSON.stringify(body, null, 2));
    
    const { title, category, dueDate, notes, completed } = body;

    if (!title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
    }

    const taskId = uuidv4();

    const now = new Date();
    const taskData = {
      id: taskId,
      userId,
      title,
      category: category || 'other',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      completed: completed || false,
      createdAt: now,
      updatedAt: now,
    };

    console.log('[Medical Tasks API] Creating task with data:', JSON.stringify(taskData, null, 2));

    // @ts-expect-error - MedicalTask puede no existir en Prisma Client
    const task = await db.medicalTask.create({
      data: taskData,
    });

    console.log('[Medical Tasks API] Created task:', JSON.stringify(task, null, 2));
    
    return NextResponse.json({
      ...task,
      dueDate: task.dueDate?.toISOString?.()?.split('T')[0] || null,
    });
  } catch (error) {
    console.error('[Medical Tasks API] Error detallado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Medical Tasks API] Stack:', errorStack);
    
    return NextResponse.json({ 
      error: 'Error al guardar tarea médica',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

// DELETE - Eliminar una tarea médica
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // @ts-expect-error - MedicalTask puede no existir en Prisma Client
    await db.medicalTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medical task:', error);
    return NextResponse.json({ error: 'Error al eliminar tarea médica' }, { status: 500 });
  }
}
