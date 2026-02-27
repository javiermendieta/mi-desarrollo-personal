import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener todos los datos del usuario
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
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
      db.settings.findUnique({ where: { userId } }),
      db.aIProfile.findUnique({ where: { userId } }),
      db.calendarEvent.findMany({ where: { userId }, orderBy: { startDate: 'asc' } }),
      db.sport.findMany({ where: { userId } }),
      db.yogaExercise.findMany({ where: { userId } }),
      db.meditationSession.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.yogaSession.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.book.findMany({ where: { userId } }),
      db.diaryEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.limitingBelief.findMany({ where: { userId } }),
      db.goal.findMany({ where: { userId } }),
      db.habit.findMany({ where: { userId } }),
      db.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.savingsGoal.findMany({ where: { userId } }),
      db.budget.findMany({ where: { userId } }),
      db.accountPlanItem.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
      db.pNLData.findMany({ where: { userId }, orderBy: { period: 'desc' } }),
      db.sleepLog.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.hydrationLog.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.healthEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      db.medicalAppointment.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      db.medicalTask.findMany({ where: { userId }, orderBy: { dueDate: 'asc' } }),
      db.quickNote.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.conversation.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      db.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.commercialLead.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.socialMediaPost.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.projectAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
