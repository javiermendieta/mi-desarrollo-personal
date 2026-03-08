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
    
    // Format for frontend
    const formattedLeads = leads.map(l => ({
      id: l.id,
      name: l.name,
      company: l.company || undefined,
      email: l.email || undefined,
      phone: l.phone || undefined,
      source: l.source || '',
      status: l.status,
      value: l.value || undefined,
      probability: l.probability || undefined,
      notes: l.notes || undefined,
      nextFollowUp: undefined, // Schema doesn't have this field
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
    
    return NextResponse.json(formattedLeads);
  } catch (error) {
    console.error('Error fetching commercial leads:', error);
    return NextResponse.json({ error: 'Error al obtener leads', details: String(error) }, { status: 500 });
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
        id: data.id || undefined, // Use provided id or let Prisma generate one
        userId,
        name: data.name || 'Sin nombre',
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        status: data.status || 'new',
        value: data.value ? parseFloat(String(data.value)) : null,
        probability: data.probability ? parseInt(String(data.probability)) : null,
        notes: data.notes || null,
      }
    });
    
    return NextResponse.json({
      id: lead.id,
      name: lead.name,
      company: lead.company || undefined,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      source: lead.source || '',
      status: lead.status,
      value: lead.value || undefined,
      probability: lead.probability || undefined,
      notes: lead.notes || undefined,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating commercial lead:', error);
    return NextResponse.json({ error: 'Error al crear lead', details: String(error) }, { status: 500 });
  }
}

// PUT - Actualizar o crear lead comercial (upsert)
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido para PUT' }, { status: 400 });
    }

    const lead = await db.commercialLead.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId,
        name: data.name || 'Sin nombre',
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        status: data.status || 'new',
        value: data.value ? parseFloat(String(data.value)) : null,
        probability: data.probability ? parseInt(String(data.probability)) : null,
        notes: data.notes || null,
      },
      update: {
        name: data.name,
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        status: data.status,
        value: data.value ? parseFloat(String(data.value)) : null,
        probability: data.probability ? parseInt(String(data.probability)) : null,
        notes: data.notes || null,
      }
    });
    
    return NextResponse.json({
      id: lead.id,
      name: lead.name,
      company: lead.company || undefined,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      source: lead.source || '',
      status: lead.status,
      value: lead.value || undefined,
      probability: lead.probability || undefined,
      notes: lead.notes || undefined,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error upserting commercial lead:', error);
    return NextResponse.json({ error: 'Error al guardar lead', details: String(error) }, { status: 500 });
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
