import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const logs = await db.hydrationLog.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const log = await db.hydrationLog.create({ data: { ...data, userId, date: new Date(data.date) } });
  return NextResponse.json({ log });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  
  if (!data.id) {
    return NextResponse.json({ error: 'ID requerido para PUT' }, { status: 400 });
  }

  const log = await db.hydrationLog.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      userId,
      date: new Date(data.date),
      glasses: data.glasses || 0,
      target: data.target || 8,
    },
    update: {
      date: new Date(data.date),
      glasses: data.glasses,
      target: data.target,
    }
  });
  
  return NextResponse.json({ log });
}
