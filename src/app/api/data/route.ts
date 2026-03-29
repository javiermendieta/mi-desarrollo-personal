import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Default accounts for new users
const DEFAULT_ACCOUNTS = [
  { name: 'Ventas de Productos', section: 'gross_sales', type: 'income', order: 1 },
  { name: 'Ventas de Servicios', section: 'gross_sales', type: 'income', order: 2 },
  { name: 'Otros Ingresos', section: 'gross_sales', type: 'income', order: 3 },
  { name: 'Descuentos', section: 'cost_of_sales', type: 'expense', order: 1 },
  { name: 'Devoluciones', section: 'cost_of_sales', type: 'expense', order: 2 },
  { name: 'Materia Prima', section: 'cmv', type: 'expense', order: 1 },
  { name: 'Mano de Obra Directa', section: 'cmv', type: 'expense', order: 2 },
  { name: 'Costos de Producción', section: 'cmv', type: 'expense', order: 3 },
  { name: 'Alquiler', section: 'operating_expenses', type: 'expense', order: 1 },
  { name: 'Sueldos y Salarios', section: 'operating_expenses', type: 'expense', order: 2 },
  { name: 'Servicios (Luz, Agua, Gas)', section: 'operating_expenses', type: 'expense', order: 3 },
  { name: 'Marketing y Publicidad', section: 'operating_expenses', type: 'expense', order: 4 },
  { name: 'Servicios Profesionales', section: 'operating_expenses', type: 'expense', order: 5 },
  { name: 'Impuestos', section: 'operating_expenses', type: 'expense', order: 6 },
  { name: 'Otros Gastos', section: 'operating_expenses', type: 'expense', order: 7 },
];

async function ensureAccountPlan(userId: string) {
  try {
    const existingCount = await db.accountPlanItem.count({
      where: { userId, isActive: true }
    });
    
    if (existingCount === 0) {
      console.log('Creating default account plan for user:', userId);
      for (const account of DEFAULT_ACCOUNTS) {
        await db.accountPlanItem.create({
          data: {
            id: uuidv4(),
            userId,
            name: account.name,
            type: account.type,
            section: account.section,
            category: account.section,
            order: account.order,
            isDefault: true,
            isActive: true,
          }
        });
      }
      console.log('Created', DEFAULT_ACCOUNTS.length, 'default accounts');
    }
  } catch (error) {
    console.error('Error ensuring account plan:', error);
    // Don't throw - continue with the rest of the data loading
  }
}

// GET - Obtener todos los datos del usuario
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    console.log('Loading data for user:', userId);
    
    // Ensure account plan exists (non-blocking)
    await ensureAccountPlan(userId);
    
    // Fetch all data
    const [
      settings,
      aiProfile,
      events,
      sports,
      yogaExercises,
      meditationSessions,
      yogaSessions,
      books,
      diaryEntries,
      limitingBeliefs,
      goals,
      habits,
      transactions,
      savingsGoals,
      budgets,
      accountPlan,
      pnlData,
      sleepLogs,
      hydrationLogs,
      healthEntries,
      medicalAppointments,
      medicalTasks,
      quickNotes,
      conversations,
      projects,
      commercialLeads,
      socialMediaPosts,
      projectAlerts,
    ] = await Promise.all([
      db.settings.findUnique({ where: { userId } }).catch(() => null),
      db.aIProfile.findUnique({ where: { userId } }).catch(() => null),
      db.calendarEvent.findMany({ where: { userId }, orderBy: { startDate: 'asc' } }).catch(() => []),
      db.sport.findMany({ where: { userId } }).catch(() => []),
      db.yogaExercise.findMany({ where: { userId } }).catch(() => []),
      db.meditationSession.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.yogaSession.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.book.findMany({ where: { userId } }).catch(() => []),
      db.diaryEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.limitingBelief.findMany({ where: { userId } }).catch(() => []),
      db.goal.findMany({ where: { userId } }).catch(() => []),
      db.habit.findMany({ where: { userId } }).catch(() => []),
      db.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.savingsGoal.findMany({ where: { userId } }).catch(() => []),
      db.budget.findMany({ where: { userId } }).catch(() => []),
      db.accountPlanItem.findMany({ where: { userId, isActive: true }, orderBy: { order: 'asc' } }).catch(() => []),
      db.pNLData.findMany({ where: { userId }, orderBy: { period: 'desc' } }).catch(() => []),
      db.sleepLog.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.hydrationLog.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.healthEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } }).catch(() => []),
      db.medicalAppointment.findMany({ where: { userId }, orderBy: { date: 'asc' } }).catch(() => []),
      db.medicalTask.findMany({ where: { userId }, orderBy: { dueDate: 'asc' } }).catch(() => []),
      db.quickNote.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.conversation.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }).catch(() => []),
      db.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.commercialLead.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.socialMediaPost.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.projectAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ]);

    console.log('Data loaded:', {
      transactions: transactions?.length || 0,
      accountPlan: accountPlan?.length || 0,
      projects: projects?.length || 0,
    });

    // Safe formatters with null checks
    const safeFormatDate = (date: Date | null | undefined): string | undefined => {
      if (!date) return undefined;
      try {
        return date.toISOString().split('T')[0];
      } catch {
        return undefined;
      }
    };

    const safeFormatISO = (date: Date | null | undefined): string | undefined => {
      if (!date) return undefined;
      try {
        return date.toISOString();
      } catch {
        return undefined;
      }
    };

    // Formatear transacciones con fecha como string
    const formattedTransactions = (transactions || []).map((t: { id: string; type: string; amount: number; category: string; description: string | null; date: Date; accountId: string | null }) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || '',
      date: safeFormatDate(t.date) || '',
      accountId: t.accountId,
      notes: undefined,
    }));

    // Formatear eventos con fechas como strings
    const formattedEvents = (events || []).map((e: { id: string; title: string; description: string | null; startDate: Date; endDate: Date | null; color: string; category: string; isRecurring: boolean; recurrencePattern: string | null; recurrenceEnd: Date | null; createdAt: Date; updatedAt: Date }) => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      startDate: safeFormatISO(e.startDate) || '',
      endDate: safeFormatISO(e.endDate),
      color: e.color,
      category: e.category,
      isRecurring: e.isRecurring,
      recurrencePattern: e.recurrencePattern,
      recurrenceEnd: safeFormatISO(e.recurrenceEnd),
      createdAt: safeFormatISO(e.createdAt) || '',
      updatedAt: safeFormatISO(e.updatedAt) || '',
    }));

    // Formatear proyecto con datos correctos
    const formattedProjects = (projects || []).map((p: { id: string; name: string; description: string | null; client: string | null; status: string; type: string | null; startDate: Date | null; endDate: Date | null; color: string; tasks: unknown; milestones: unknown; documents: unknown; meetings: unknown; createdAt: Date; updatedAt: Date }) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      client: p.client ? { name: p.client } : undefined,
      status: p.status,
      type: p.type || 'client',
      startDate: safeFormatISO(p.startDate),
      deadline: safeFormatISO(p.endDate),
      color: p.color || '#3b82f6',
      progress: 0,
      tasks: (p.tasks as unknown[]) || [],
      milestones: (p.milestones as unknown[]) || [],
      documents: (p.documents as unknown[]) || [],
      meetings: (p.meetings as unknown[]) || [],
      tags: [],
      notes: undefined,
      links: [],
      files: [],
      createdAt: safeFormatISO(p.createdAt) || '',
      updatedAt: safeFormatISO(p.updatedAt) || '',
    }));

    // Formatear account plan
    const formattedAccountPlan = (accountPlan || []).map((a: { id: string; code: string | null; name: string; type: string; section: string; category: string | null; subcategory: string | null; order: number; isDefault: boolean; isActive: boolean; createdAt: Date; updatedAt: Date }) => ({
      id: a.id,
      code: a.code || undefined,
      name: a.name,
      type: a.type,
      section: a.section,
      category: a.category || a.section,
      subcategory: a.subcategory || undefined,
      order: a.order,
      isDefault: a.isDefault,
      isActive: a.isActive,
      createdAt: safeFormatISO(a.createdAt) || '',
      updatedAt: safeFormatISO(a.updatedAt) || '',
    }));

    // Formatear PNL data
    const formattedPnlData = (pnlData || []).map((p: { id: string; period: string; accountPlans: unknown; createdAt: Date; updatedAt: Date }) => ({
      id: p.id,
      period: p.period,
      accountPlans: (p.accountPlans as { accountId: string; theoretical: number }[]) || [],
      createdAt: safeFormatISO(p.createdAt) || '',
      updatedAt: safeFormatISO(p.updatedAt) || '',
    }));

    // Formatear leads comerciales
    const formattedCommercialLeads = (commercialLeads || []).map((l: { id: string; name: string; company: string | null; email: string | null; phone: string | null; source: string | null; status: string; value: number | null; probability: number | null; notes: string | null; createdAt: Date; updatedAt: Date }) => ({
      id: l.id,
      name: l.name,
      company: l.company || undefined,
      email: l.email || undefined,
      phone: l.phone || undefined,
      source: l.source || '',
      status: l.status,
      value: l.value || undefined,
      probability: l.probability || undefined,
      notes: l.notes || undefined,
      nextFollowUp: undefined,
      createdAt: safeFormatISO(l.createdAt) || '',
      updatedAt: safeFormatISO(l.updatedAt) || '',
    }));

    // Formatear social media posts
    const formattedSocialMediaPosts = (socialMediaPosts || []).map((p: { id: string; platform: string; content: string | null; status: string; scheduledAt: Date | null; publishedAt: Date | null; mediaUrl: string | null; tags: unknown; createdAt: Date; updatedAt: Date }) => ({
      id: p.id,
      platform: p.platform,
      content: p.content || '',
      status: p.status,
      scheduledDate: safeFormatDate(p.scheduledAt),
      scheduledTime: p.scheduledAt ? new Date(p.scheduledAt).toTimeString().slice(0, 5) : undefined,
      notes: undefined,
      hashtags: (p.tags as string[]) || [],
      createdAt: safeFormatISO(p.createdAt) || '',
      updatedAt: safeFormatISO(p.updatedAt) || '',
    }));

    // Formatear citas médicas
    const formattedMedicalAppointments = (medicalAppointments || []).map((a: { id: string; title: string; doctor: string | null; specialty: string | null; location: string | null; date: Date; time: string; notes: string | null; status: string; reminder: boolean; createdAt: Date; updatedAt: Date }) => ({
      id: a.id,
      title: a.title,
      doctor: a.doctor || undefined,
      specialty: a.specialty || undefined,
      location: a.location || undefined,
      date: a.date.toISOString().split('T')[0],
      time: a.time,
      notes: a.notes || undefined,
      status: a.status,
      reminder: a.reminder,
      createdAt: safeFormatISO(a.createdAt) || '',
      updatedAt: safeFormatISO(a.updatedAt) || '',
    }));

    // Formatear tareas médicas
    const formattedMedicalTasks = (medicalTasks || []).map((t: { id: string; title: string; category: string; dueDate: Date | null; notes: string | null; completed: boolean; createdAt: Date; updatedAt: Date }) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      dueDate: t.dueDate?.toISOString().split('T')[0] || undefined,
      notes: t.notes || undefined,
      completed: t.completed,
      createdAt: safeFormatISO(t.createdAt) || '',
      updatedAt: safeFormatISO(t.updatedAt) || '',
    }));

    // Formatear conversaciones
    const formattedConversations = (conversations || []).map((c: { id: string; title: string; messages: unknown; createdAt: Date; updatedAt: Date }) => ({
      id: c.id,
      title: c.title,
      messages: (c.messages as { id: string; role: string; content: string; timestamp: string }[]) || [],
      createdAt: safeFormatISO(c.createdAt) || '',
      updatedAt: safeFormatISO(c.updatedAt) || '',
    }));

    return NextResponse.json({
      settings: settings || null,
      aiProfile: aiProfile || null,
      events: formattedEvents,
      sports: sports || [],
      yogaExercises: yogaExercises || [],
      meditationSessions: meditationSessions || [],
      yogaSessions: yogaSessions || [],
      books: books || [],
      diaryEntries: diaryEntries || [],
      limitingBeliefs: limitingBeliefs || [],
      goals: goals || [],
      habits: habits || [],
      transactions: formattedTransactions,
      savingsGoals: savingsGoals || [],
      budgets: budgets || [],
      accountPlan: formattedAccountPlan,
      pnlData: formattedPnlData,
      sleepLogs: sleepLogs || [],
      hydrationLogs: hydrationLogs || [],
      healthEntries: healthEntries || [],
      medicalAppointments: formattedMedicalAppointments,
      medicalTasks: formattedMedicalTasks,
      quickNotes: quickNotes || [],
      conversations: formattedConversations,
      projects: formattedProjects,
      commercialLeads: formattedCommercialLeads,
      socialMediaPosts: formattedSocialMediaPosts,
      projectAlerts: projectAlerts || [],
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ 
      error: 'Error al obtener datos', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
// Force full redeploy - Sun Mar  8 14:20:23 UTC 2026
