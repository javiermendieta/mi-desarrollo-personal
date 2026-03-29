import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NO CONFIGURADO';
  const directUrl = process.env.DIRECT_URL || 'NO CONFIGURADO';
  
  // Ocultar contraseña para seguridad
  const safeDbUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  const safeDirectUrl = directUrl.replace(/:([^:@]+)@/, ':****@');
  
  return NextResponse.json({
    DATABASE_URL: safeDbUrl,
    DIRECT_URL: safeDirectUrl,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
