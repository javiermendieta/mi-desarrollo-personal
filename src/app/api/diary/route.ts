import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const entries = await db.diaryEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const entry = await db.diaryEntry.create({ data: { ...data, userId, date: new Date(data.date) } });
  return NextResponse.json({ entry });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id, ...data } = await request.json();
  const entry = await db.diaryEntry.update({ where: { id, userId }, data });
  return NextResponse.json({ entry });
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id } = await request.json();
  await db.diaryEntry.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
