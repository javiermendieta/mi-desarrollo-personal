import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener leads comerciales
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const leads = await db.commercialLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching commercial leads:', error);
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 });
  }
}

// POST - Crear lead comercial
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const lead = await db.commercialLead.create({
      data: {
        userId,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        source: data.source,
        status: data.status || 'new',
        value: data.value,
        probability: data.probability,
        notes: data.notes,
      }
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error creating commercial lead:', error);
    return NextResponse.json({ error: 'Error al crear lead' }, { status: 500 });
  }
}

// PUT - Actualizar lead comercial
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const lead = await db.commercialLead.update({
      where: { id: data.id, userId },
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        source: data.source,
        status: data.status,
        value: data.value,
        probability: data.probability,
        notes: data.notes,
      }
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating commercial lead:', error);
    return NextResponse.json({ error: 'Error al actualizar lead' }, { status: 500 });
  }
}

// DELETE - Eliminar lead comercial
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.commercialLead.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting commercial lead:', error);
    return NextResponse.json({ error: 'Error al eliminar lead' }, { status: 500 });
  }
}
