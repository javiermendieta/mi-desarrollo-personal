import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL
});

async function main() {
  console.log('=== DATOS EN SUPABASE ===\n');
  
  try {
    // Usuario
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
    console.log('👤 USUARIOS:', users.length);
    users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
    
    // Proyectos
    const projects = await prisma.project.findMany({ select: { id: true, name: true, client: true, status: true } });
    console.log('\n📁 PROYECTOS:', projects.length);
    projects.forEach(p => console.log(`   - ${p.name} (${p.client}) - ${p.status}`));
    
    // Transacciones
    const transactions = await prisma.transaction.findMany({ select: { id: true, description: true, amount: true, date: true, accountId: true } });
    console.log('\n💰 TRANSACCIONES:', transactions.length);
    transactions.forEach(t => console.log(`   - ${t.description}: $${t.amount} (${t.date})`));
    
    // Plan de cuentas
    const accounts = await prisma.accountPlanItem.findMany({ select: { id: true, name: true, type: true, section: true } });
    console.log('\n📊 PLAN DE CUENTAS:', accounts.length);
    accounts.forEach(a => console.log(`   - ${a.name} (${a.type} / ${a.section})`));
    
    // P&L Data
    const pnl = await prisma.pNLData.findMany({ select: { id: true, period: true } });
    console.log('\n📈 P&L DATA:', pnl.length);
    pnl.forEach(p => console.log(`   - Período: ${p.period}`));
    
    // Salud
    const health = await prisma.healthEntry.findMany({ select: { id: true, date: true, weight: true, steps: true } });
    console.log('\n❤️ ENTRADAS DE SALUD:', health.length);
    health.forEach(h => console.log(`   - ${h.date}: ${h.weight}kg, ${h.steps} pasos`));
    
    // Sueño
    const sleep = await prisma.sleepLog.findMany({ select: { id: true, date: true, quality: true } });
    console.log('\n😴 REGISTROS DE SUEÑO:', sleep.length);
    
    // Hidratación
    const hydration = await prisma.hydrationLog.findMany({ select: { id: true, date: true, glasses: true } });
    console.log('\n💧 REGISTROS DE HIDRATACIÓN:', hydration.length);
    
    // Citas médicas
    const appointments = await prisma.medicalAppointment.findMany({ select: { id: true, title: true, date: true } });
    console.log('\n🏥 CITAS MÉDICAS:', appointments.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main().finally(() => prisma.$disconnect());
