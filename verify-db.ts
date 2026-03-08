import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL
});

async function main() {
  console.log('=== DATOS EN SUPABASE ===\n');
  
  // Usuario
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, password: true } });
  console.log('👤 USUARIOS:', users.length);
  users.forEach(u => console.log(`   - Email: ${u.email}`));
  console.log('');
  
  // Proyectos
  const projects = await prisma.project.findMany({ select: { id: true, name: true, status: true } });
  console.log('📁 PROYECTOS:', projects.length);
  projects.forEach(p => console.log(`   - ${p.name} (${p.status})`));
  console.log('');
  
  // Transacciones
  const transactions = await prisma.transaction.findMany({ select: { description: true, amount: true, date: true } });
  console.log('💰 TRANSACCIONES:', transactions.length);
  transactions.forEach(t => console.log(`   - ${t.description}: $${t.amount}`));
  console.log('');
  
  // Plan de cuentas
  const accounts = await prisma.accountPlanItem.count();
  console.log('📊 PLAN DE CUENTAS:', accounts, 'cuentas');
  console.log('');
  
  // Salud
  const health = await prisma.healthEntry.count();
  console.log('❤️ ENTRADAS DE SALUD:', health);
  
  // Eventos
  const events = await prisma.calendarEvent.count();
  console.log('📅 EVENTOS:', events);
  
  // Metas
  const goals = await prisma.goal.count();
  console.log('🎯 METAS:', goals);
  
  // Hábitos
  const habits = await prisma.habit.count();
  console.log('✅ HÁBITOS:', habits);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
