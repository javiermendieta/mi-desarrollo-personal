import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    // Limitar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 10MB' }, { status: 400 });
    }

    // Crear cliente Supabase con service role key para storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generar nombre único
    const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Convertir File a ArrayBuffer y luego a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('books')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return NextResponse.json({ error: 'Error al subir archivo a storage' }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('books')
      .getPublicUrl(data.path);

    return NextResponse.json({ 
      url: urlData.publicUrl, 
      name: file.name,
      path: data.path
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
