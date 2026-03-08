import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List fases by proyecto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proyectoId = searchParams.get('proyectoId')

    if (!proyectoId) {
      return NextResponse.json([])
    }

    const fases = await prisma.fase.findMany({
      where: { proyectoId },
      orderBy: { orden: 'asc' },
      include: {
        semanas: {
          orderBy: { numero: 'asc' },
        },
      },
    })

    return NextResponse.json(fases)
  } catch (error) {
    console.error('Error fetching fases:', error)
    return NextResponse.json([])
  }
}

// POST - Create new fase
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const fase = await prisma.fase.create({
      data: {
        proyectoId: data.proyectoId,
        nombre: data.nombre,
        orden: data.orden || 1,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: 'planificado',
      },
    })

    return NextResponse.json(fase)
  } catch (error) {
    console.error('Error creating fase:', error)
    return NextResponse.json({ error: 'Error creating fase' }, { status: 500 })
  }
}
