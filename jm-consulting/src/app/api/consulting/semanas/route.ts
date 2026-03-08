import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List semanas by fase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const faseId = searchParams.get('faseId')

    if (!faseId) {
      return NextResponse.json([])
    }

    const semanas = await prisma.semana.findMany({
      where: { faseId },
      orderBy: { numero: 'asc' },
      include: {
        tareas: {
          orderBy: { orden: 'asc' }
        }
      },
    })

    return NextResponse.json(semanas)
  } catch (error) {
    console.error('Error fetching semanas:', error)
    return NextResponse.json([])
  }
}

// POST - Create new semana
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const semana = await prisma.semana.create({
      data: {
        faseId: data.faseId,
        numero: data.numero,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: 'pendiente',
        notas: data.notas || null,
      },
    })

    return NextResponse.json(semana)
  } catch (error) {
    console.error('Error creating semana:', error)
    return NextResponse.json({ error: 'Error creating semana' }, { status: 500 })
  }
}
