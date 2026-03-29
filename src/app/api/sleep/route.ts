import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const logs = await db.sleepLog.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const log = await db.sleepLog.create({ data: { ...data, userId, date: new Date(data.date) } });
  return NextResponse.json({ log });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  
  if (!data.id) {
    return NextResponse.json({ error: 'ID requerido para PUT' }, { status: 400 });
  }

  const log = await db.sleepLog.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      userId,
      date: new Date(data.date),
      sleepTime: data.sleepTime || '',
      wakeTime: data.wakeTime || '',
      quality: data.quality || 3,
      notes: data.notes || null,
    },
    update: {
      date: new Date(data.date),
      sleepTime: data.sleepTime,
      wakeTime: data.wakeTime,
      quality: data.quality,
      notes: data.notes,
    }
  });
  
  return NextResponse.json({ log });
}
