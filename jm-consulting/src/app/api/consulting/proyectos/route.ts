import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List all proyectos
export async function GET() {
  try {
    const proyectos = await prisma.proyectoConsultoria.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        fases: {
          orderBy: { orden: 'asc' },
          include: {
            semanas: {
              orderBy: { numero: 'asc' },
              include: {
                tareas: {
                  orderBy: { orden: 'asc' }
                }
              }
            }
          }
        },
        entregables: true,
      },
    })
    return NextResponse.json(proyectos)
  } catch (error) {
    console.error('Error fetching proyectos:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST - Create new proyecto
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const proyecto = await prisma.proyectoConsultoria.create({
      data: {
        nombre: data.nombre,
        cliente: data.cliente,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        valorContrato: data.valorContrato || null,
        notas: data.notas || null,
        estado: 'activo',
      },
    })

    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error creating proyecto:', error)
    return NextResponse.json({ error: 'Error creating proyecto' }, { status: 500 })
  }
}
