import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const entries = await db.healthEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const entry = await db.healthEntry.create({ data: { ...data, userId, date: new Date(data.date) } });
  return NextResponse.json({ entry });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  
  if (!data.id) {
    return NextResponse.json({ error: 'ID requerido para PUT' }, { status: 400 });
  }

  const entry = await db.healthEntry.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      userId,
      date: new Date(data.date),
      weight: data.weight || null,
      steps: data.steps || null,
      calories: data.calories || null,
      notes: data.notes || null,
    },
    update: {
      date: new Date(data.date),
      weight: data.weight,
      steps: data.steps,
      calories: data.calories,
      notes: data.notes,
    }
  });
  
  return NextResponse.json({ entry });
}
