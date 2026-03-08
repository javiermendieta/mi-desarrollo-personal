import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuración de Prisma
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// En desarrollo, guardar la instancia para evitar múltiples conexiones
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Función helper para verificar conexión
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await db.$connect()
    await db.$queryRaw`SELECT 1`
    return { success: true }
  } catch (error: unknown) {
    const err = error as Error
    return { success: false, error: err.message }
  }
}
