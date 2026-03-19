import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const items = await db.savingsGoal.findMany({ where: { userId } });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const item = await db.savingsGoal.create({ data: { ...data, userId, deadline: data.deadline ? new Date(data.deadline) : null } });
  return NextResponse.json({ item });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id, ...data } = await request.json();
  const item = await db.savingsGoal.update({ where: { id, userId }, data });
  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id } = await request.json();
  await db.savingsGoal.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
