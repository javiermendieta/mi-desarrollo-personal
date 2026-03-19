import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener actividades para el calendario de contribución
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const type = searchParams.get('type');

  const startDate = new Date(parseInt(year), 0, 1);
  const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);

  const where: any = {
    userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (type && type !== 'all') {
    where.type = type;
  }

  const activities = await db.activity.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  const formattedActivities = activities.map(a => ({
    id: a.id,
    type: a.type,
    action: a.action,
    title: a.title,
    date: a.date.toISOString(),
    referenceId: a.referenceId,
    details: a.details,
  }));

  return NextResponse.json({
    activities: formattedActivities,
    year: parseInt(year),
  });
}

// POST - Registrar una nueva actividad
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  console.log('POST /api/activities - userId:', userId);
  
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json();
  console.log('POST /api/activities - Body:', body);
  const { type, action, referenceId, title, details } = body;

  if (!type || !action || !title) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const activity = await db.activity.create({
    data: {
      userId,
      type,
      action,
      referenceId,
      title,
      details,
    },
  });

  console.log('POST /api/activities - Created:', activity);
  return NextResponse.json(activity);
}

// DELETE - Eliminar actividades
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    await db.activity.delete({ where: { id, userId } });
  } else {
    return NextResponse.json({ error: 'Se requiere ID de actividad' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
