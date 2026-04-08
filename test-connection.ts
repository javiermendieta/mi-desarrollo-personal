import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@db.rhckmjhtqovfcgfwhpoj.supabase.co:5432/postgres"
});

async function main() {
  console.log('Probando conexión directa...');
  
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Conexión exitosa! Usuarios: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({ select: { email: true, name: true } });
      console.log('Usuarios:', users);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().finally(() => prisma.$disconnect());
