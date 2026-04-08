import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres.rhckmjhtqovfcgfwhpoj:PKW5WVJWzbVLWjwK@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

async function main() {
  const userId = "cmm2xwvg30000jp0470hwy0a0";
  
  console.log('Testing with Prisma client...\n');
  
  // Sports
  const sports = await prisma.sport.findMany({ where: { userId } });
  console.log(`🏃 Sports: ${sports.length}`);
  sports.forEach(s => console.log(`   - ${s.name}`));
  
  // Diary
  const diary = await prisma.diaryEntry.findMany({ where: { userId } });
  console.log(`\n📔 Diary: ${diary.length}`);
  
  // Sleep Logs
  const sleep = await prisma.sleepLog.findMany({ where: { userId } });
  console.log(`\n😴 SleepLogs: ${sleep.length}`);
  sleep.forEach(s => console.log(`   - ${s.date} - Quality: ${s.quality}`));
  
  // Hydration
  const hydration = await prisma.hydrationLog.findMany({ where: { userId } });
  console.log(`\n💧 HydrationLogs: ${hydration.length}`);
  hydration.forEach(h => console.log(`   - ${h.date} - Glasses: ${h.glasses}`));
  
  // Health
  const health = await prisma.healthEntry.findMany({ where: { userId } });
  console.log(`\n❤️ HealthEntries: ${health.length}`);
  
  // Transactions
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  console.log(`\n💰 Transactions: ${transactions.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
