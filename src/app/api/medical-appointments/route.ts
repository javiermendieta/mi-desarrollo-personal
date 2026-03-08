import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - Obtener todas las citas médicas del usuario
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // @ts-expect-error - MedicalAppointment puede no existir en Prisma Client
    const appointments = await db.medicalAppointment.findMany({
      where: { userId },
      orderBy: { date: 'asc' as const },
    });

    // Formatear fechas
    const formatted = (appointments || []).map((a: { id: string; title: string; doctor: string | null; specialty: string | null; location: string | null; date: Date; time: string; notes: string | null; status: string; reminder: boolean }) => ({
      id: a.id,
      title: a.title,
      doctor: a.doctor || undefined,
      specialty: a.specialty || undefined,
      location: a.location || undefined,
      date: a.date.toISOString().split('T')[0],
      time: a.time,
      notes: a.notes || undefined,
      status: a.status,
      reminder: a.reminder,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching medical appointments:', error);
    return NextResponse.json([]);
  }
}

// POST - Crear una nueva cita médica
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('[Medical Appointments API] Received body:', JSON.stringify(body, null, 2));
    
    const { id, title, doctor, specialty, location, date, time, notes, status, reminder } = body;

    if (!title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
    }

    const appointmentId = id || uuidv4();
    const now = new Date();

    const appointmentData = {
      id: appointmentId,
      userId,
      title,
      doctor: doctor || null,
      specialty: specialty || null,
      location: location || null,
      date: date ? new Date(date) : new Date(),
      time: time || '10:00',
      notes: notes || null,
      status: status || 'scheduled',
      reminder: reminder || false,
      createdAt: now,
      updatedAt: now,
    };

    console.log('[Medical Appointments API] Creating appointment with data:', JSON.stringify(appointmentData, null, 2));

    // @ts-expect-error - MedicalAppointment puede no existir en Prisma Client
    const appointment = await db.medicalAppointment.create({
      data: appointmentData,
    });

    console.log('[Medical Appointments API] Created appointment:', JSON.stringify(appointment, null, 2));
    
    return NextResponse.json({
      id: appointment.id,
      title: appointment.title,
      doctor: appointment.doctor || undefined,
      specialty: appointment.specialty || undefined,
      location: appointment.location || undefined,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      notes: appointment.notes || undefined,
      status: appointment.status,
      reminder: appointment.reminder,
    });
  } catch (error) {
    console.error('[Medical Appointments API] Error detallado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Medical Appointments API] Stack:', errorStack);
    
    return NextResponse.json({ 
      error: 'Error al guardar cita médica',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

// DELETE - Eliminar una cita médica
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // @ts-expect-error - MedicalAppointment puede no existir en Prisma Client
    await db.medicalAppointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medical appointment:', error);
    return NextResponse.json({ error: 'Error al eliminar cita médica' }, { status: 500 });
  }
}
