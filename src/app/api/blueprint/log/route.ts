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

// POST - Toggle completado de una tarea en una fecha
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { taskId, date, completed } = await request.json();

  // Crear fecha usando parseLocalDate para evitar problemas de timezone
  const logDate = parseLocalDate(date);

  // Verificar si ya existe un log para esta tarea y fecha
  const existingLog = await db.blueprintTaskLog.findUnique({
    where: {
      taskId_date: {
        taskId,
        date: logDate
      }
    }
  });

  let log;
  if (existingLog) {
    // Actualizar el log existente
    log = await db.blueprintTaskLog.update({
      where: { id: existingLog.id },
      data: { completed }
    });
  } else {
    // Crear nuevo log
    log = await db.blueprintTaskLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        taskId,
        date: logDate,
        completed
      }
    });
  }

  // Calcular nueva racha para esta tarea
  const allLogs = await db.blueprintTaskLog.findMany({
    where: { userId, taskId }
  });

  const taskLogs = allLogs
    .filter(l => l.completed)
    .map(l => getLocalDateString(l.date))
    .sort()
    .reverse();

  // Total de días completados (histórico)
  const totalCompleted = taskLogs.length;

  const today = new Date();
  const todayStr = getLocalDateString(today);

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

  // Obtener fechas completadas para el historial
  const completedDates = taskLogs;

  return NextResponse.json({ log, streak, totalCompleted, completedDates });
}

// GET - Obtener logs por rango de fechas
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 });
  }

  const logs = await db.blueprintTaskLog.findMany({
    where: {
      userId,
      date: {
        gte: parseLocalDate(startDate),
        lte: parseLocalDate(endDate)
      }
    }
  });

  return NextResponse.json({ logs });
}
