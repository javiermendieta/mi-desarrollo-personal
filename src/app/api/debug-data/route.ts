import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    const projects = await db.project.findMany({
      select: { id: true, name: true, status: true, userId: true }
    });
    
    const transactions = await db.transaction.findMany({
      select: { id: true, description: true, amount: true, date: true, userId: true }
    });
    
    const accountPlan = await db.accountPlanItem.findMany({
      select: { id: true, name: true, type: true, section: true, userId: true }
    });
    
    return NextResponse.json({
      users,
      projects,
      transactions,
      accountPlan,
      counts: {
        users: users.length,
        projects: projects.length,
        transactions: transactions.length,
        accountPlan: accountPlan.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
