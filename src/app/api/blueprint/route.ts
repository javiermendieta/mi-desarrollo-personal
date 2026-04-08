import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper para parsear fecha local sin problemas de timezone
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper para obtener fecha local como string YYYY-MM-DD
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET - Obtener todas las tareas y logs del usuario
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const tasks = await db.blueprintTask.findMany({
    where: { userId, isActive: true },
    orderBy: { time: 'asc' },
    include: { logs: true }
  });

  const logs = await db.blueprintTaskLog.findMany({
    where: { userId }
  });

  // Mapear tasks para incluir days como array
  const mappedTasks = tasks.map(t => ({
    ...t,
    days: t.days as number[] | null
  }));

  // Mapear logs con fecha como string YYYY-MM-DD para evitar problemas de timezone
  const mappedLogs = logs.map(l => ({
    ...l,
    date: getLocalDateString(l.date)
  }));

  // Calcular racha y total de días completados por tarea
  const streaks: Record<string, number> = {};
  const totalCompletedDays: Record<string, number> = {};
  const completedDatesByTask: Record<string, string[]> = {};
  const today = new Date();
  const todayStr = getLocalDateString(today);

  for (const task of tasks) {
    const taskLogs = logs
      .filter(l => l.taskId === task.id && l.completed)
      .map(l => getLocalDateString(l.date))
      .sort()
      .reverse();

    // Total de días completados (histórico)
    totalCompletedDays[task.id] = taskLogs.length;
    
    // Fechas completadas para historial
    completedDatesByTask[task.id] = taskLogs;

    let streak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDateString(checkDate);
      if (taskLogs.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = getLocalDateString(checkDate);
        if (taskLogs.includes(yesterdayStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    streaks[task.id] = streak;
  }

  return NextResponse.json({ tasks: mappedTasks, logs: mappedLogs, streaks, totalCompletedDays, completedDatesByTask });
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const data = await request.json();

  // Obtener el máximo order
  const maxOrder = await db.blueprintTask.aggregate({
    where: { userId },
    _max: { order: true }
  });

  const task = await db.blueprintTask.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      title: data.title,
      time: data.time || '00:00',
      description: data.description,
      days: data.days || null,
      order: (maxOrder._max.order || 0) + 1,
      isActive: true,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({ task: { ...task, days: task.days as number[] | null } });
}

// PUT - Actualizar tarea
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id, ...data } = await request.json();

  const task = await db.blueprintTask.update({
    where: { id, userId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({ task });
}

// DELETE - Eliminar tarea
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await request.json();

  // Eliminar logs asociados primero
  await db.blueprintTaskLog.deleteMany({ where: { taskId: id, userId } });

  // Eliminar la tarea
  await db.blueprintTask.delete({ where: { id, userId } });

  return NextResponse.json({ success: true });
}
