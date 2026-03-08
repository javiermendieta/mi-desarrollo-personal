import { PrismaClient } from '@prisma/client';

// Usar conexión directa en lugar del pooler
const DATABASE_URL = "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL
});

async function main() {
  // Usuario
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log('=== USUARIOS ===');
  users.forEach(u => console.log(`ID: ${u.id} - Email: ${u.email}`));
  
  // Verificar userId en proyectos
  const projects = await prisma.project.findMany({ select: { id: true, name: true, userId: true } });
  console.log('\n=== PROYECTOS ===');
  projects.forEach(p => console.log(`UserID: ${p.userId} - ${p.name}`));
  
  // Verificar userId en transacciones
  const transactions = await prisma.transaction.findMany({ select: { id: true, description: true, userId: true, amount: true } });
  console.log('\n=== TRANSACCIONES ===');
  transactions.forEach(t => console.log(`UserID: ${t.userId} - ${t.description}: $${t.amount}`));
  
  // Verificar userId en eventos
  const events = await prisma.calendarEvent.findMany({ select: { id: true, title: true, userId: true } });
  console.log('\n=== EVENTOS ===');
  events.forEach(e => console.log(`UserID: ${e.userId} - ${e.title}`));
  
  // Verificar userId en metas
  const goals = await prisma.goal.findMany({ select: { id: true, title: true, userId: true } });
  console.log('\n=== METAS ===');
  goals.forEach(g => console.log(`UserID: ${g.userId} - ${g.title}`));
  
  // Verificar userId en salud
  const health = await prisma.healthEntry.findMany({ select: { id: true, userId: true, weight: true, date: true } });
  console.log('\n=== SALUD ===');
  health.forEach(h => console.log(`UserID: ${h.userId} - Peso: ${h.weight} (${h.date})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
