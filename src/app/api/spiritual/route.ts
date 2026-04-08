import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all spiritual data
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const [practices, panicLogs, settings] = await Promise.all([
      db.spiritualPractice.findMany({ where: { userId } }),
      db.spiritualPanicLog.findMany({ 
        where: { userId },
        orderBy: { date: 'desc' },
        take: 50
      }),
      db.spiritualSettings.findUnique({ where: { userId } })
    ]);

    return NextResponse.json({ 
      practices,
      panicLogs,
      settings: settings || { level: 'beginner', phrases: [] }
    });
  } catch (error) {
    console.error('Error fetching spiritual data:', error);
    return NextResponse.json({ error: 'Error al obtener datos espirituales' }, { status: 500 });
  }
}

// POST - Create new spiritual practice
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const data = await request.json();

    // Handle different types of creations
    if (data.type === 'panic') {
      // Create panic log entry
      const panicLog = await db.spiritualPanicLog.create({
        data: {
          id: data.id,
          userId,
          message: data.message,
          notes: data.notes || null,
        }
      });
      return NextResponse.json({ panicLog });
    }

    if (data.type === 'settings') {
      // Create or update settings
      const settings = await db.spiritualSettings.upsert({
        where: { userId },
        create: {
          id: data.id,
          userId,
          level: data.level || 'beginner',
          phrases: data.phrases || [],
        },
        update: {
          level: data.level,
          phrases: data.phrases,
          updatedAt: new Date(),
        }
      });
      return NextResponse.json({ settings });
    }

    // Create spiritual practice
    const practice = await db.spiritualPractice.create({
      data: {
        id: data.id,
        userId,
        name: data.name,
        type: data.type || 'custom',
        icon: data.icon || 'cross',
        color: data.color || '#8B5CF6',
        schedule: data.schedule || null,
        isActive: data.isActive ?? true,
        logs: data.logs || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ practice });
  } catch (error) {
    console.error('Error creating spiritual practice:', error);
    return NextResponse.json({ error: 'Error al crear práctica espiritual' }, { status: 500 });
  }
}

// PUT - Update spiritual practice or settings
export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id, ...data } = await request.json();

    // Handle settings update
    if (data.updateType === 'settings') {
      const settings = await db.spiritualSettings.upsert({
        where: { userId },
        create: {
          id: `settings-${userId}`,
          userId,
          level: data.level || 'beginner',
          phrases: data.phrases || [],
        },
        update: {
          level: data.level,
          phrases: data.phrases,
          updatedAt: new Date(),
        }
      });
      return NextResponse.json({ settings });
    }

    // Update practice
    const practice = await db.spiritualPractice.update({
      where: { id, userId },
      data: {
        ...data,
        name: data.name,
        type: data.type,
        color: data.color,
        schedule: data.schedule,
        logs: data.logs,
        isActive: data.isActive,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ practice });
  } catch (error) {
    console.error('Error updating spiritual practice:', error);
    return NextResponse.json({ error: 'Error al actualizar práctica espiritual' }, { status: 500 });
  }
}

// DELETE - Delete spiritual practice
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await request.json();
    await db.spiritualPractice.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting spiritual practice:', error);
    return NextResponse.json({ error: 'Error al eliminar práctica espiritual' }, { status: 500 });
  }
}
