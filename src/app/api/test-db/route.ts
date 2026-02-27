import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Probar conexión
    await db.$connect();
    
    // Contar usuarios
    const count = await db.user.count();
    
    return NextResponse.json({ 
      status: 'OK',
      message: 'Conexión exitosa a la base de datos',
      userCount: count,
      databaseUrl: process.env.DATABASE_URL ? 'CONFIGURADO' : 'NO CONFIGURADO'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'ERROR',
      message: error.message,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'CONFIGURADO' : 'NO CONFIGURADO'
    }, { status: 500 });
  }
}
