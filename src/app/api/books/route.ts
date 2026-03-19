import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const books = await db.book.findMany({ where: { userId } });
  return NextResponse.json({ books });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const book = await db.book.create({ data: { ...data, userId, startDate: new Date(data.startDate || Date.now()) } });
  return NextResponse.json({ book });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id, ...data } = await request.json();
  const book = await db.book.update({ where: { id, userId }, data });
  return NextResponse.json({ book });
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id } = await request.json();
  await db.book.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
