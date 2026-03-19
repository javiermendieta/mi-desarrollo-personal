import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener posts de redes sociales
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const posts = await db.socialMediaPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Format for frontend
    const formattedPosts = posts.map(p => ({
      id: p.id,
      platform: p.platform,
      content: p.content,
      status: p.status,
      scheduledDate: p.scheduledAt ? p.scheduledAt.toISOString().split('T')[0] : undefined,
      scheduledTime: p.scheduledAt ? new Date(p.scheduledAt).toTimeString().slice(0, 5) : undefined,
      hashtags: p.tags || [],
      notes: undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    
    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching social media posts:', error);
    return NextResponse.json({ error: 'Error al obtener posts' }, { status: 500 });
  }
}

// POST - Crear post de red social
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Build scheduledAt from scheduledDate and scheduledTime
    let scheduledAt: Date | null = null;
    if (data.scheduledDate) {
      const time = data.scheduledTime || '09:00';
      scheduledAt = new Date(`${data.scheduledDate}T${time}:00`);
    }
    
    const post = await db.socialMediaPost.create({
      data: {
        id: data.id || undefined, // Use provided id or let Prisma generate one
        userId,
        platform: data.platform || 'instagram',
        content: data.content || '',
        status: data.status || 'idea',
        scheduledAt: scheduledAt,
        tags: data.hashtags || [],
      }
    });
    
    return NextResponse.json({
      id: post.id,
      platform: post.platform,
      content: post.content,
      status: post.status,
      scheduledDate: post.scheduledAt ? post.scheduledAt.toISOString().split('T')[0] : undefined,
      scheduledTime: post.scheduledAt ? new Date(post.scheduledAt).toTimeString().slice(0, 5) : undefined,
      hashtags: post.tags || [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating social media post:', error);
    return NextResponse.json({ error: 'Error al crear post', details: String(error) }, { status: 500 });
  }
}

// PUT - Actualizar o crear post (upsert)
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

    // Build scheduledAt from scheduledDate and scheduledTime
    let scheduledAt: Date | null = null;
    if (data.scheduledDate) {
      const time = data.scheduledTime || '09:00';
      scheduledAt = new Date(`${data.scheduledDate}T${time}:00`);
    }

    const post = await db.socialMediaPost.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId,
        platform: data.platform || 'instagram',
        content: data.content || '',
        status: data.status || 'idea',
        scheduledAt: scheduledAt,
        tags: data.hashtags || [],
      },
      update: {
        platform: data.platform,
        content: data.content,
        status: data.status,
        scheduledAt: scheduledAt,
        tags: data.hashtags || [],
      }
    });
    
    return NextResponse.json({
      id: post.id,
      platform: post.platform,
      content: post.content,
      status: post.status,
      scheduledDate: post.scheduledAt ? post.scheduledAt.toISOString().split('T')[0] : undefined,
      scheduledTime: post.scheduledAt ? new Date(post.scheduledAt).toTimeString().slice(0, 5) : undefined,
      hashtags: post.tags || [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error upserting social media post:', error);
    return NextResponse.json({ error: 'Error al guardar post', details: String(error) }, { status: 500 });
  }
}

// DELETE - Eliminar post
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

    await db.socialMediaPost.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting social media post:', error);
    return NextResponse.json({ error: 'Error al eliminar post' }, { status: 500 });
  }
}
