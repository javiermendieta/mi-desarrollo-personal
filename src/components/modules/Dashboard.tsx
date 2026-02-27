'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Dumbbell,
  BookOpen,
  Target,
  CheckCircle,
  Wallet,
  Heart,
  PenLine,
  TrendingUp,
  Flame,
  Droplets,
  Bed,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format, startOfDay, isToday, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const {
    events,
    sports,
    books,
    goals,
    habits,
    transactions,
    accountPlan,
    pnlData,
    hydrationLogs,
    sleepLogs,
    diaryEntries,
    meditationSessions,
    projects,
    commercialLeads,
  } = useAppStore();

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const currentMonth = format(today, 'yyyy-MM');

  // Today's events
  const todayEvents = events.filter((e) => {
    const eventDate = format(parseISO(e.startDate), 'yyyy-MM-dd');
    return eventDate === todayStr;
  });

  // Reading progress
  const currentBooks = books.filter((b) => b.status === 'reading');
  const completedBooks = books.filter((b) => b.status === 'completed');

  // Goals progress
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);
  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((acc, g) => acc + g.progress, 0) / activeGoals.length)
    : 0;

  // Habits today
  const habitsToday = habits.filter((h) => h.isActive);
  const completedHabitsToday = habitsToday.filter((h) =>
    h.logs.some((l) => l.date === todayStr && l.completed)
  );

  // Calculate streaks
  const getHabitStreak = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const log = habit.logs.find((l) => l.date === dateStr);
      if (log?.completed) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
    return streak;
  };

  const maxStreak = habits.length > 0
    ? Math.max(...habits.map((h) => getHabitStreak(h.id)))
    : 0;

  // Finance summary - usar el nuevo sistema con accountPlan
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(currentMonth)
  );
  
  // Calcular ingresos y gastos usando accountPlan o type (compatibilidad)
  const monthIncome = monthTransactions
    .filter((t) => {
      // Si tiene accountId, usar accountPlan
      if (t.accountId) {
        const account = accountPlan.find(a => a.id === t.accountId);
        return account?.type === 'income';
      }
      // Si no, usar el type directo (compatibilidad con datos antiguos)
      return t.type === 'income';
    })
    .reduce((acc, t) => acc + t.amount, 0);
    
  const monthExpenses = monthTransactions
    .filter((t) => {
      // Si tiene accountId, usar accountPlan
      if (t.accountId) {
        const account = accountPlan.find(a => a.id === t.accountId);
        return account?.type === 'expense';
      }
      // Si no, usar el type directo (compatibilidad con datos antiguos)
      return t.type === 'expense';
    })
    .reduce((acc, t) => acc + t.amount, 0);

  // P&L data for dashboard
  const currentPNL = pnlData.find(p => p.period === currentMonth);
  
  // Hydration today
  const hydrationToday = hydrationLogs.find((l) => l.date === todayStr);

  // Sleep last night
  const lastSleep = sleepLogs.length > 0
    ? sleepLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  // Meditation this week
  const weekMeditations = meditationSessions.filter((m) => {
    const sessionDate = parseISO(m.date);
    return differenceInDays(today, sessionDate) <= 7;
  });

  // Recent workouts
  let recentWorkouts = 0;
  sports.forEach((s) => {
    s.sessions.forEach((session) => {
      const sessionDate = parseISO(session.date);
      if (differenceInDays(today, sessionDate) <= 7) {
        recentWorkouts++;
      }
    });
  });

  // Last diary entry
  const lastDiaryEntry = diaryEntries.length > 0
    ? diaryEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  // Projects summary
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  
  // Commercial pipeline summary
  const activeLeads = commercialLeads.filter(l => !['won', 'lost'].includes(l.status));
  const wonLeads = commercialLeads.filter(l => l.status === 'won');
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            ¡Hola! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedHabitsToday.length}/{habitsToday.length}</p>
                <p className="text-xs text-muted-foreground">Hábitos hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Flame className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{maxStreak}</p>
                <p className="text-xs text-muted-foreground">Mejor racha</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Dumbbell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentWorkouts}</p>
                <p className="text-xs text-muted-foreground">Entrenamientos semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgGoalProgress}%</p>
                <p className="text-xs text-muted-foreground">Progreso metas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Hoy
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>
                Ver calendario
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(event.startDate), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay eventos para hoy
              </p>
            )}
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Hábitos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('habits')}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {habitsToday.length > 0 ? (
              <div className="space-y-2">
                {habitsToday.slice(0, 4).map((habit) => {
                  const isCompleted = habit.logs.some(
                    (l) => l.date === todayStr && l.completed
                  );
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-500' : 'bg-muted'
                        }`}
                      >
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="flex-1">{habit.name}</span>
                      {getHabitStreak(habit.id) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          🔥 {getHabitStreak(habit.id)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Añade hábitos para comenzar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('goals')}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeGoals.length > 0 ? (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1">
                        {goal.title}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {goal.progress}%
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <span className="text-xs text-muted-foreground">
                    {completedGoals.length} completadas
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Define tus metas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reading */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lectura
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('reading')}>
                Ver biblioteca
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentBooks.length > 0 ? (
              <div className="space-y-3">
                {currentBooks.slice(0, 2).map((book) => {
                  const progress = Math.round(
                    (book.currentPage / book.totalPages) * 100
                  );
                  return (
                    <div key={book.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate flex-1">
                          {book.title}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {book.currentPage}/{book.totalPages}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
                <div className="pt-2 text-center">
                  <span className="text-xs text-muted-foreground">
                    {completedBooks.length} libros completados
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Añade un libro para comenzar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Health Quick View */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Salud
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('health')}>
                Ver más
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">
                    {hydrationToday?.glasses || 0}/8
                  </p>
                  <p className="text-xs text-muted-foreground">Agua</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Bed className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">
                    {lastSleep ? `${lastSleep.quality}/5` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Sueño</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Finanzas
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('finances')}>
                Ver detalles
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="text-lg font-bold text-emerald-600">
                  ${monthIncome.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="text-lg font-bold text-red-600">
                  ${monthExpenses.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 p-2 rounded-lg bg-muted/50 text-center">
              <span className="text-xs text-muted-foreground">Balance mensual: </span>
              <span className={`text-sm font-bold ${
                monthIncome - monthExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                ${(monthIncome - monthExpenses).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => onNavigate('diary')}
            >
              <PenLine className="h-5 w-5" />
              <span className="text-xs">Nueva entrada</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => onNavigate('sports')}
            >
              <Dumbbell className="h-5 w-5" />
              <span className="text-xs">Entrenar</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => onNavigate('yoga')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Meditar</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => onNavigate('notes')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Nota rápida</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {(lastDiaryEntry || weekMeditations.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastDiaryEntry && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <PenLine className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">
                      Última entrada de diario: {format(parseISO(lastDiaryEntry.date), 'd MMM', { locale: es })}
                    </p>
                  </div>
                </div>
              )}
              {weekMeditations.length > 0 && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">
                      {weekMeditations.length} sesiones de meditación esta semana
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
