import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Endpoint para agregar columnas faltantes a las tablas de salud
// Ejecutar una sola vez: GET /api/migrate-health
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // ============ MedicalAppointment ============
    
    // Agregar columna 'title' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "title" TEXT`;
      results.push('✓ Columna title agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• title MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'createdAt' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()`;
      results.push('✓ Columna createdAt agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• createdAt MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'updatedAt' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()`;
      results.push('✓ Columna updatedAt agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• updatedAt MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'time' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "time" TEXT DEFAULT '10:00'`;
      results.push('✓ Columna time agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• time MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'doctor' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "doctor" TEXT`;
      results.push('✓ Columna doctor agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• doctor MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'specialty' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "specialty" TEXT`;
      results.push('✓ Columna specialty agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• specialty MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'location' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "location" TEXT`;
      results.push('✓ Columna location agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• location MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'notes' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "notes" TEXT`;
      results.push('✓ Columna notes agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• notes MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'status' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'scheduled'`;
      results.push('✓ Columna status agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• status MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'reminder' a MedicalAppointment
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ADD COLUMN IF NOT EXISTS "reminder" BOOLEAN DEFAULT false`;
      results.push('✓ Columna reminder agregada a MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`• reminder MedicalAppointment: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // ============ Corregir restricciones NULL ============
    // Alterar columnas para permitir NULL donde corresponde
    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ALTER COLUMN "doctor" DROP NOT NULL`;
      results.push('✓ doctor permite NULL');
    } catch (e) {
      const error = e as Error;
      results.push(`• doctor NULL: ${error.message.includes('does not have') ? 'ya es nullable' : error.message}`);
    }

    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ALTER COLUMN "specialty" DROP NOT NULL`;
      results.push('✓ specialty permite NULL');
    } catch (e) {
      const error = e as Error;
      results.push(`• specialty NULL: ${error.message.includes('does not have') ? 'ya es nullable' : error.message}`);
    }

    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ALTER COLUMN "location" DROP NOT NULL`;
      results.push('✓ location permite NULL');
    } catch (e) {
      const error = e as Error;
      results.push(`• location NULL: ${error.message.includes('does not have') ? 'ya es nullable' : error.message}`);
    }

    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ALTER COLUMN "notes" DROP NOT NULL`;
      results.push('✓ notes permite NULL');
    } catch (e) {
      const error = e as Error;
      results.push(`• notes NULL: ${error.message.includes('does not have') ? 'ya es nullable' : error.message}`);
    }

    try {
      await db.$executeRaw`ALTER TABLE "MedicalAppointment" ALTER COLUMN "title" DROP NOT NULL`;
      results.push('✓ title permite NULL');
    } catch (e) {
      const error = e as Error;
      results.push(`• title NULL: ${error.message.includes('does not have') ? 'ya es nullable' : error.message}`);
    }

    // ============ MedicalTask ============
    
    // Agregar columna 'title' a MedicalTask
    try {
      await db.$executeRaw`ALTER TABLE "MedicalTask" ADD COLUMN IF NOT EXISTS "title" TEXT`;
      results.push('✓ Columna title agregada a MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`• title MedicalTask: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'category' a MedicalTask
    try {
      await db.$executeRaw`ALTER TABLE "MedicalTask" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'other'`;
      results.push('✓ Columna category agregada a MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`• category MedicalTask: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'createdAt' a MedicalTask
    try {
      await db.$executeRaw`ALTER TABLE "MedicalTask" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()`;
      results.push('✓ Columna createdAt agregada a MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`• createdAt MedicalTask: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'updatedAt' a MedicalTask
    try {
      await db.$executeRaw`ALTER TABLE "MedicalTask" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()`;
      results.push('✓ Columna updatedAt agregada a MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`• updatedAt MedicalTask: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'notes' a MedicalTask si no existe
    try {
      await db.$executeRaw`ALTER TABLE "MedicalTask" ADD COLUMN IF NOT EXISTS "notes" TEXT`;
      results.push('✓ Columna notes agregada a MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`• notes MedicalTask: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // Agregar columna 'completed' a MedicalTask si no existe
    try {
      await db.$executeRaw`ALTER TABLE "MedicalTask" ADD COLUMN IF NOT EXISTS "completed" BOOLEAN DEFAULT false`;
      results.push('✓ Columna completed agregada a MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`• completed MedicalTask: ${error.message.includes('already exists') ? 'ya existe' : error.message}`);
    }

    // ============ Actualizar valores existentes ============
    
    try {
      await db.$executeRaw`UPDATE "MedicalAppointment" SET "title" = 'Cita médica' WHERE "title" IS NULL OR "title" = ''`;
      results.push('✓ Valores por defecto actualizados en MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`Nota: ${error.message}`);
    }

    try {
      await db.$executeRaw`UPDATE "MedicalTask" SET "title" = 'Tarea médica' WHERE "title" IS NULL OR "title" = ''`;
      results.push('✓ Valores por defecto actualizados en MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`Nota: ${error.message}`);
    }

    // Actualizar fechas nulas
    try {
      await db.$executeRaw`UPDATE "MedicalAppointment" SET "createdAt" = NOW(), "updatedAt" = NOW() WHERE "createdAt" IS NULL`;
      results.push('✓ Fechas actualizadas en MedicalAppointment');
    } catch (e) {
      const error = e as Error;
      results.push(`Nota: ${error.message}`);
    }

    try {
      await db.$executeRaw`UPDATE "MedicalTask" SET "createdAt" = NOW(), "updatedAt" = NOW() WHERE "createdAt" IS NULL`;
      results.push('✓ Fechas actualizadas en MedicalTask');
    } catch (e) {
      const error = e as Error;
      results.push(`Nota: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migración completada',
      results 
    });

  } catch (error) {
    console.error('Error en migración:', error);
    return NextResponse.json({ 
      error: 'Error en migración', 
      details: error instanceof Error ? error.message : 'Error desconocido',
      results 
    }, { status: 500 });
  }
}
