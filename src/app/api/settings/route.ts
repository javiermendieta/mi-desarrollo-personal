import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const settings = await db.settings.findUnique({ where: { userId } });
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  const settings = await db.settings.upsert({
    where: { userId },
    update: data,
    create: { ...data, userId }
  });
  return NextResponse.json({ settings });
}
