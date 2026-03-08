'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  Flame,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { GOAL_CATEGORIES, GOAL_TIMEFRAMES, HABIT_COLORS } from '@/lib/constants';
import type { Goal, Habit, GoalCategory, GoalTimeframe } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, differenceInDays, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export function GoalsHabitsModule() {
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    logHabit,
  } = useAppStore();

  // Goal state
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isGoalDetailOpen, setIsGoalDetailOpen] = useState(false);

  // Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTimeframe, setGoalTimeframe] = useState<GoalTimeframe>('short');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('personal');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);

  // Habit state
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Habit form
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [habitColor, setHabitColor] = useState(HABIT_COLORS[0]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Goal handlers
  const openGoalDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalDescription(goal.description || '');
      setGoalTimeframe(goal.timeframe);
      setGoalCategory(goal.category);
      setGoalDeadline(goal.deadline || '');
      setGoalProgress(goal.progress);
    } else {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalDescription('');
      setGoalTimeframe('short');
      setGoalCategory('personal');
      setGoalDeadline('');
      setGoalProgress(0);
    }
    setIsGoalDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) return;

    const goal: Partial<Goal> = {
      title: goalTitle,
      description: goalDescription || undefined,
      timeframe: goalTimeframe,
      category: goalCategory,
      deadline: goalDeadline || undefined,
      progress: goalProgress,
      isCompleted: goalProgress >= 100,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, goal);
    } else {
      addGoal({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        milestones: [],
        ...goal,
      } as Goal);
    }

    setIsGoalDialogOpen(false);
    resetGoalForm();
  };

  const resetGoalForm = () => {
    setGoalTitle('');
    setGoalDescription('');
    setGoalTimeframe('short');
    setGoalCategory('personal');
    setGoalDeadline('');
    setGoalProgress(0);
    setEditingGoal(null);
  };

  const openGoalDetail = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalDetailOpen(true);
  };

  // Habit handlers
  const openHabitDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitName(habit.name);
      setHabitDescription(habit.description || '');
      setHabitFrequency(habit.frequency);
      setHabitColor(habit.color);
    } else {
      setEditingHabit(null);
      setHabitName('');
      setHabitDescription('');
      setHabitFrequency('daily');
      setHabitColor(HABIT_COLORS[0]);
    }
    setIsHabitDialogOpen(true);
  };

  const handleSaveHabit = () => {
    if (!habitName.trim()) return;

    const habit: Partial<Habit> = {
      name: habitName,
      description: habitDescription || undefined,
      frequency: habitFrequency,
      color: habitColor,
      icon: 'check',
    };

    if (editingHabit) {
      updateHabit(editingHabit.id, habit);
    } else {
      addHabit({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        isActive: true,
        logs: [],
        ...habit,
      } as Habit);
    }

    setIsHabitDialogOpen(false);
    resetHabitForm();
  };

  const resetHabitForm = () => {
    setHabitName('');
    setHabitDescription('');
    setHabitFrequency('daily');
    setHabitColor(HABIT_COLORS[0]);
    setEditingHabit(null);
  };

  const toggleHabitLog = (habitId: string, completed: boolean) => {
    logHabit(habitId, todayStr, completed);
  };

  const getHabitStreak = (habit: Habit) => {
    let streak = 0;
    let checkDate = startOfDay(new Date());

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

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);
  const activeHabits = habits.filter((h) => h.isActive);

  const habitsCompletedToday = activeHabits.filter((h) =>
    h.logs.some((l) => l.date === todayStr && l.completed)
  );

  const getCategoryLabel = (cat: GoalCategory) => {
    return GOAL_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  };

  const getTimeframeLabel = (tf: GoalTimeframe) => {
    return GOAL_TIMEFRAMES.find((t) => t.value === tf)?.label || tf;
  };

  const getDaysRemaining = (deadline: string) => {
    const days = differenceInDays(parseISO(deadline), new Date());
    return days;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="habits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="habits">Hábitos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Hábitos Diarios
                </CardTitle>
                <Button onClick={() => openHabitDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Hábito
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Progreso de hoy</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{habitsCompletedToday.length}/{activeHabits.length}</span>
                  <Progress
                    value={activeHabits.length > 0 ? (habitsCompletedToday.length / activeHabits.length) * 100 : 0}
                    className="w-24 h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {activeHabits.length > 0 ? (
            <div className="space-y-2">
              {activeHabits.map((habit) => {
                const isCompletedToday = habit.logs.some(
                  (l) => l.date === todayStr && l.completed
                );
                const streak = getHabitStreak(habit);

                return (
                  <Card key={habit.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isCompletedToday
                              ? 'bg-emerald-500 text-white'
                              : 'border-2 border-muted-foreground hover:border-primary'
                          }`}
                          style={{
                            backgroundColor: isCompletedToday ? habit.color : undefined,
                            borderColor: isCompletedToday ? undefined : habit.color,
                          }}
                          onClick={() => toggleHabitLog(habit.id, !isCompletedToday)}
                        >
                          {isCompletedToday && <CheckCircle className="h-5 w-5" />}
                        </button>
                        <div className="flex-1">
                          <p className="font-medium">{habit.name}</p>
                          {habit.description && (
                            <p className="text-sm text-muted-foreground">{habit.description}</p>
                          )}
                        </div>
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-orange-500">
                            <Flame className="h-5 w-5" />
                            <span className="font-bold">{streak}</span>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openHabitDialog(habit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar hábito?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteHabit(habit.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Comienza tus hábitos</h3>
                <p className="text-muted-foreground mb-6">
                  Crea hábitos para construir una rutina diaria positiva
                </p>
                <Button onClick={() => openHabitDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer hábito
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Mis Metas
                </CardTitle>
                <Button onClick={() => openGoalDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Meta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Activas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{completedGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {activeGoals.length > 0
                      ? Math.round(activeGoals.reduce((acc, g) => acc + g.progress, 0) / activeGoals.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-medium text-muted-foreground">Metas activas</h3>
              {activeGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openGoalDetail(goal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{goal.title}</p>
                          <Badge variant="outline">{getCategoryLabel(goal.category)}</Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary">{getTimeframeLabel(goal.timeframe)}</Badge>
                          {goal.deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getDaysRemaining(goal.deadline) > 0
                                ? `${getDaysRemaining(goal.deadline)} días restantes`
                                : getDaysRemaining(goal.deadline) === 0
                                ? '¡Vence hoy!'
                                : 'Vencida'}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Define tus metas</h3>
                <p className="text-muted-foreground mb-6">
                  Establece metas claras para alcanzar tus objetivos
                </p>
                <Button onClick={() => openGoalDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera meta
                </Button>
              </CardContent>
            </Card>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Metas completadas
              </h3>
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="bg-emerald-50 dark:bg-emerald-950/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Completada
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="¿Qué quieres lograr?"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Detalles de tu meta..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plazo</Label>
                <Select value={goalTimeframe} onValueChange={(v) => setGoalTimeframe(v as GoalTimeframe)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={goalCategory} onValueChange={(v) => setGoalCategory(v as GoalCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fecha límite (opcional)</Label>
              <Input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
              />
            </div>
            {editingGoal && (
              <div>
                <Label>Progreso: {goalProgress}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goalProgress}
                  onChange={(e) => setGoalProgress(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal} disabled={!goalTitle.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Detail Dialog */}
      <Dialog open={isGoalDetailOpen} onOpenChange={setIsGoalDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGoal?.title}</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              {selectedGoal.description && (
                <p className="text-muted-foreground">{selectedGoal.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge>{getCategoryLabel(selectedGoal.category)}</Badge>
                <Badge variant="secondary">{getTimeframeLabel(selectedGoal.timeframe)}</Badge>
                {selectedGoal.deadline && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(parseISO(selectedGoal.deadline), 'd MMM yyyy', { locale: es })}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span className="font-medium">{selectedGoal.progress}%</span>
                </div>
                <Progress value={selectedGoal.progress} className="h-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                Creada: {format(parseISO(selectedGoal.createdAt), "d MMM yyyy", { locale: es })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsGoalDetailOpen(false);
                    openGoalDialog(selectedGoal);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        deleteGoal(selectedGoal.id);
                        setIsGoalDetailOpen(false);
                      }}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Habit Dialog */}
      <Dialog open={isHabitDialogOpen} onOpenChange={setIsHabitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="Ej: Meditar 10 minutos"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>
            <div>
              <Label>Frecuencia</Label>
              <Select value={habitFrequency} onValueChange={(v) => setHabitFrequency(v as typeof habitFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Todos los días</SelectItem>
                  <SelectItem value="weekdays">Días laborables</SelectItem>
                  <SelectItem value="weekends">Fines de semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      habitColor === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setHabitColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHabitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveHabit} disabled={!habitName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
