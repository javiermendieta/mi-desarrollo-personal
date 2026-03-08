import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const diagnostics: {
    status: string;
    databaseUrlHost: string;
    databaseUrlPort: string;
    directUrlHost: string;
    directUrlPort: string;
    error?: string;
    errorCode?: string;
    userCount?: number;
    connectionTest?: string;
    poolerType?: string;
  } = {
    status: 'TESTING',
    databaseUrlHost: 'NO CONFIGURADO',
    databaseUrlPort: 'NO CONFIGURADO',
    directUrlHost: 'NO CONFIGURADO',
    directUrlPort: 'NO CONFIGURADO',
  };

  try {
    // Extraer información de las variables de entorno sin exponer credenciales
    const dbUrl = process.env.DATABASE_URL || '';
    const directUrl = process.env.DIRECT_URL || '';
    
    if (dbUrl) {
      try {
        const url = new URL(dbUrl.replace('?pgbouncer=true', ''));
        diagnostics.databaseUrlHost = url.hostname;
        diagnostics.databaseUrlPort = url.port;
        diagnostics.poolerType = dbUrl.includes('pooler') ? 'SESSION_POOLER' : 'DIRECT';
      } catch {
        diagnostics.databaseUrlHost = 'PARSE_ERROR';
      }
    }
    
    if (directUrl) {
      try {
        const url = new URL(directUrl);
        diagnostics.directUrlHost = url.hostname;
        diagnostics.directUrlPort = url.port;
      } catch {
        diagnostics.directUrlHost = 'PARSE_ERROR';
      }
    }

    // Probar conexión
    diagnostics.connectionTest = 'CONNECTING';
    await db.$connect();
    diagnostics.connectionTest = 'CONNECTED';
    
    // Contar usuarios
    const count = await db.user.count();
    diagnostics.userCount = count;
    diagnostics.status = 'OK';
    
    return NextResponse.json({
      ...diagnostics,
      message: 'Conexión exitosa a la base de datos',
      recommendation: diagnostics.poolerType === 'SESSION_POOLER' 
        ? 'Usando Session Pooler correctamente' 
        : 'RECOMENDACIÓN: Usar Session Pooler (aws-1-us-east-1.pooler.supabase.com:6543) para IPv4',
    });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    diagnostics.status = 'ERROR';
    diagnostics.error = err.message;
    diagnostics.errorCode = err.code;
    diagnostics.connectionTest = 'FAILED';
    
    // Detectar problemas comunes
    let recommendation = '';
    if (err.message.includes('5432') && !err.message.includes('6543')) {
      recommendation = 'ERROR: Está usando conexión directa (puerto 5432). Debe configurar DATABASE_URL con el Session Pooler (puerto 6543) para IPv4.';
    } else if (err.message.includes("Can't reach database server")) {
      recommendation = 'ERROR: No se puede alcanzar el servidor. Verifique que DATABASE_URL use el Session Pooler de Supabase (aws-1-us-east-1.pooler.supabase.com:6543).';
    } else if (err.message.includes('ENOTFOUND')) {
      recommendation = 'ERROR: DNS no puede resolver el host. Verifique la URL de la base de datos.';
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('timeout')) {
      recommendation = 'ERROR: Timeout de conexión. Posible problema de red o firewall.';
    }
    
    return NextResponse.json({
      ...diagnostics,
      recommendation,
      solution: 'Configure las variables de entorno en Vercel Dashboard > Settings > Environment Variables:\n' +
        'DATABASE_URL=postgresql://postgres.rhckmjhtqovfcgfwhpoj:BaTsgtgGNzc9iME8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true\n' +
        'DIRECT_URL=postgresql://postgres.rhckmjhtqovfcgfwhpoj:BaTsgtgGNzc9iME8@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    }, { status: 500 });
  }
}
