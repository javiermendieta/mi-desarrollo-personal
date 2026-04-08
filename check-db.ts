import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL
});

async function main() {
  console.log('=== VERIFICANDO DATOS EN SUPABASE ===\n');
  
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Usuarios: ${userCount}`);
    
    const eventCount = await prisma.calendarEvent.count();
    console.log(`✅ Eventos: ${eventCount}`);
    
    const goalCount = await prisma.goal.count();
    console.log(`✅ Metas: ${goalCount}`);
    
    const habitCount = await prisma.habit.count();
    console.log(`✅ Hábitos: ${habitCount}`);
    
    const bookCount = await prisma.book.count();
    console.log(`✅ Libros: ${bookCount}`);
    
    const projectCount = await prisma.project.count();
    console.log(`✅ Proyectos: ${projectCount}`);
    
    const transactionCount = await prisma.transaction.count();
    console.log(`✅ Transacciones: ${transactionCount}`);
    
    const diaryCount = await prisma.diaryEntry.count();
    console.log(`✅ Entradas de diario: ${diaryCount}`);
    
    const accountPlanCount = await prisma.accountPlanItem.count();
    console.log(`✅ Plan de Cuentas: ${accountPlanCount}`);
    
    const pnlCount = await prisma.pNLData.count();
    console.log(`✅ P&L Data: ${pnlCount}`);
    
    const healthCount = await prisma.healthEntry.count();
    console.log(`✅ Entradas de Salud: ${healthCount}`);
    
    const sleepCount = await prisma.sleepLog.count();
    console.log(`✅ Registros de Sueño: ${sleepCount}`);
    
    const hydrationCount = await prisma.hydrationLog.count();
    console.log(`✅ Registros de Hidratación: ${hydrationCount}`);
    
    const medicalApptCount = await prisma.medicalAppointment.count();
    console.log(`✅ Citas Médicas: ${medicalApptCount}`);
    
    const medicalTaskCount = await prisma.medicalTask.count();
    console.log(`✅ Tareas Médicas: ${medicalTaskCount}`);
    
    console.log('\n=== RESUMEN ===');
    const total = userCount + eventCount + goalCount + habitCount + bookCount + projectCount + transactionCount + diaryCount + accountPlanCount + pnlCount + healthCount + sleepCount + hydrationCount + medicalApptCount + medicalTaskCount;
    console.log(`📊 Total de registros: ${total}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
      console.log('\n👤 Usuarios:');
      users.forEach(u => console.log(`   - ${u.email} (${u.name}) [ID: ${u.id}]`));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().finally(() => prisma.$disconnect());
