import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // Debug: verificar datos crudos
    const rawProjects = await db.project.findMany({ where: { userId } });
    const rawEvents = await db.calendarEvent.findMany({ where: { userId } });
    const rawTransactions = await db.transaction.findMany({ where: { userId } });
    const rawGoals = await db.goal.findMany({ where: { userId } });
    const rawAccountPlan = await db.accountPlanItem.findMany({ where: { userId } });
    const rawHealth = await db.healthEntry.findMany({ where: { userId } });
    
    return NextResponse.json({
      userId,
      counts: {
        projects: rawProjects.length,
        events: rawEvents.length,
        transactions: rawTransactions.length,
        goals: rawGoals.length,
        accountPlan: rawAccountPlan.length,
        health: rawHealth.length,
      },
      rawProjects,
      rawEvents,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
