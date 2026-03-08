import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Sincronizar datos específicos
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const results: Record<string, number> = {};

    // Sync Account Plan
    if (data.accountPlan && Array.isArray(data.accountPlan)) {
      for (const account of data.accountPlan) {
        try {
          await db.accountPlanItem.upsert({
            where: { id: account.id },
            create: {
              id: account.id,
              userId,
              code: account.code || '',
              name: account.name,
              type: account.type || 'expense',
              section: account.section || 'operating_expenses',
              category: account.section || account.category || 'operating_expenses',
              order: account.order || 0,
              isDefault: account.isDefault || false,
              isActive: true,
            },
            update: {
              name: account.name,
              type: account.type,
              section: account.section,
              category: account.section || account.category,
              order: account.order,
            },
          });
        } catch (e) {
          console.error('Error upserting account:', e);
        }
      }
      results.accountPlan = data.accountPlan.length;
    }

    // Sync Transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      for (const tx of data.transactions) {
        try {
          await db.transaction.upsert({
            where: { id: tx.id },
            create: {
              id: tx.id,
              userId,
              type: tx.type || 'expense',
              amount: tx.amount || 0,
              category: tx.category || tx.accountId || 'other',
              description: tx.description || '',
              date: new Date(tx.date),
              accountId: tx.accountId || null,
            },
            update: {
              type: tx.type,
              amount: tx.amount,
              category: tx.category || tx.accountId,
              description: tx.description,
              date: new Date(tx.date),
              accountId: tx.accountId || null,
            },
          });
        } catch (e) {
          console.error('Error upserting transaction:', e);
        }
      }
      results.transactions = data.transactions.length;
    }

    // Sync PNL Data
    if (data.pnlData && Array.isArray(data.pnlData)) {
      for (const pnl of data.pnlData) {
        try {
          await db.pNLData.upsert({
            where: {
              userId_period: {
                userId,
                period: pnl.period,
              }
            },
            create: {
              id: pnl.id,
              userId,
              period: pnl.period,
              accountPlans: pnl.accountPlans || [],
            },
            update: {
              accountPlans: pnl.accountPlans || [],
            },
          });
        } catch (e) {
          console.error('Error upserting PNL:', e);
        }
      }
      results.pnlData = data.pnlData.length;
    }

    // Sync Projects
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        try {
          await db.project.upsert({
            where: { id: project.id },
            create: {
              id: project.id,
              userId,
              name: project.name,
              description: project.description || '',
              client: project.client?.name || project.client || '',
              status: project.status || 'active',
              type: project.type || 'client',
              startDate: project.startDate ? new Date(project.startDate) : null,
              endDate: project.deadline ? new Date(project.deadline) : null,
              color: project.color || '#3b82f6',
              tasks: project.tasks || [],
              milestones: project.milestones || [],
              documents: project.documents || [],
              meetings: project.meetings || [],
            },
            update: {
              name: project.name,
              description: project.description,
              client: project.client?.name || project.client,
              status: project.status,
              startDate: project.startDate ? new Date(project.startDate) : null,
              endDate: project.deadline ? new Date(project.deadline) : null,
              color: project.color,
              tasks: project.tasks,
              milestones: project.milestones,
              documents: project.documents,
              meetings: project.meetings,
            },
          });
        } catch (e) {
          console.error('Error upserting project:', e);
        }
      }
      results.projects = data.projects.length;
    }

    return NextResponse.json({ success: true, synced: results });
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json({ error: 'Error al sincronizar datos' }, { status: 500 });
  }
}
