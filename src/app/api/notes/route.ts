import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const notes = await db.quickNote.findMany({ where: { userId }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const note = await db.quickNote.create({ data: { ...data, userId } });
  return NextResponse.json({ note });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id, ...data } = await request.json();
  const note = await db.quickNote.update({ where: { id, userId }, data });
  return NextResponse.json({ note });
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id } = await request.json();
  await db.quickNote.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
