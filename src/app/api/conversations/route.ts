import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - Obtener todas las conversaciones del usuario
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const conversations = await db.conversation.findMany({ 
      where: { userId }, 
      orderBy: { updatedAt: 'desc' } 
    });
    
    // Formatear conversaciones para el frontend
    const formattedConversations = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      messages: (c.messages as { id: string; role: string; content: string; timestamp: string }[]) || [],
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ conversations: [] });
  }
}

// POST - Crear una nueva conversación
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const data = await request.json();
    const { id, title, messages } = data;
    
    const conversation = await db.conversation.create({ 
      data: { 
        id: id || uuidv4(),
        userId, 
        title: title || 'Nueva conversación',
        messages: messages || [],
      } 
    });
    
    return NextResponse.json({ 
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 });
  }
}

// PUT - Actualizar una conversación existente (usar upsert)
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const { id, title, messages } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    // Usar upsert para crear o actualizar
    const conversation = await db.conversation.upsert({
      where: { id },
      create: {
        id,
        userId,
        title: title || 'Nueva conversación',
        messages: messages || [],
      },
      update: {
        title: title || undefined,
        messages: messages || undefined,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ 
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Error al actualizar conversación' }, { status: 500 });
  }
}

// DELETE - Eliminar una conversación
export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    // Verificar que la conversación pertenece al usuario
    const existing = await db.conversation.findFirst({
      where: { id, userId },
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }
    
    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Error al eliminar conversación' }, { status: 500 });
  }
}
