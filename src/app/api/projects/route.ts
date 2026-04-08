import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener proyectos
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
  }
}

// POST - Crear proyecto
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const project = await db.project.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        client: data.client,
        status: data.status || 'active',
        type: data.type || 'client',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        tasks: data.tasks || [],
        milestones: data.milestones || [],
        documents: data.documents || [],
        meetings: data.meetings || [],
      }
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
  }
}

// PUT - Crear o actualizar proyecto (upsert)
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

    const project = await db.project.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId,
        name: data.name,
        description: data.description,
        client: data.client,
        status: data.status || 'active',
        type: data.type || 'client',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        tasks: data.tasks || [],
        milestones: data.milestones || [],
        documents: data.documents || [],
        meetings: data.meetings || [],
      },
      update: {
        name: data.name,
        description: data.description,
        client: data.client,
        status: data.status,
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color,
        tasks: data.tasks,
        milestones: data.milestones,
        documents: data.documents,
        meetings: data.meetings,
      }
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error upserting project:', error);
    return NextResponse.json({ error: 'Error al guardar proyecto', details: String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar proyecto
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

    await db.project.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
  }
}
