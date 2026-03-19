import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

async function main() {
  const userId = "cmm2xwvg30000jp0470hwy0a0";
  
  console.log('=== DEPORTES ===');
  const sports = await prisma.sport.findMany({ where: { userId } });
  console.log(`Cantidad: ${sports.length}`);
  sports.forEach(s => console.log(`  - ${s.name}`));
  
  console.log('\n=== DIARIO ===');
  const diary = await prisma.diaryEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  console.log(`Cantidad: ${diary.length}`);
  diary.forEach(d => console.log(`  - ${d.date}: ${d.title || d.content?.substring(0, 50)}...`));
  
  console.log('\n=== FINANZAS - TRANSACCIONES ===');
  const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  console.log(`Cantidad: ${transactions.length}`);
  transactions.forEach(t => console.log(`  - ${t.date}: ${t.description} - $${t.amount}`));
  
  console.log('\n=== FINANZAS - PLAN DE CUENTAS ===');
  const accounts = await prisma.accountPlanItem.findMany({ where: { userId }, orderBy: { section: 'asc' } });
  console.log(`Cantidad: ${accounts.length}`);
  
  console.log('\n=== FINANZAS - P&L DATA ===');
  const pnl = await prisma.pNLData.findMany({ where: { userId } });
  console.log(`Cantidad: ${pnl.length}`);
  pnl.forEach(p => console.log(`  - Período: ${p.period}`));
  
  console.log('\n=== SALUD ===');
  const health = await prisma.healthEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  console.log(`Cantidad: ${health.length}`);
  health.forEach(h => console.log(`  - ${h.date}: Peso=${h.weight}kg, Pasos=${h.steps}`));
  
  console.log('\n=== SALUD - SUEÑO ===');
  const sleep = await prisma.sleepLog.findMany({ where: { userId } });
  console.log(`Cantidad: ${sleep.length}`);
  
  console.log('\n=== SALUD - HIDRATACIÓN ===');
  const hydration = await prisma.hydrationLog.findMany({ where: { userId } });
  console.log(`Cantidad: ${hydration.length}`);
  
  console.log('\n=== SALUD - CITAS MÉDICAS ===');
  const appointments = await prisma.medicalAppointment.findMany({ where: { userId } });
  console.log(`Cantidad: ${appointments.length}`);
  appointments.forEach(a => console.log(`  - ${a.date}: ${a.title}`));
  
  console.log('\n=== SALUD - TAREAS MÉDICAS ===');
  const medTasks = await prisma.medicalTask.findMany({ where: { userId } });
  console.log(`Cantidad: ${medTasks.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
