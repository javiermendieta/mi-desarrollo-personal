import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const events = await db.calendarEvent.findMany({ where: { userId }, orderBy: { startDate: 'asc' } });
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const event = await db.calendarEvent.create({
    data: { ...data, userId, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null }
  });
  return NextResponse.json({ event });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id, ...data } = await request.json();
  const event = await db.calendarEvent.update({
    where: { id, userId },
    data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : null }
  });
  return NextResponse.json({ event });
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id } = await request.json();
  await db.calendarEvent.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
