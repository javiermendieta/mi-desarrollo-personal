import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const items = await db.meditationSession.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const item = await db.meditationSession.create({ data: { ...data, userId, date: new Date(data.date) } });
  return NextResponse.json({ item });
}
