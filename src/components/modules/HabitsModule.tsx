'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  CheckCircle, Plus, Trash2, Edit, Flame, Loader2, 
  Calendar, TrendingUp, Target, ChevronLeft, ChevronRight
} from 'lucide-react';
import { HABIT_COLORS } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { Habit } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { 
  format, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, eachDayOfInterval as eachDayOfMonth,
  subDays, subMonths, isSameDay, isToday, getDay, addMonths, subWeeks, addWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function HabitsModule() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [color, setColor] = useState(HABIT_COLORS[0]);

  // For weekly/monthly navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Load habits from server
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (data.habits) {
        setHabits(data.habits.map((h: any) => ({
          ...h,
          logs: h.logs || [],
          createdAt: h.createdAt?.toString() || new Date().toISOString(),
        })));
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setName(habit.name);
      setDescription(habit.description || '');
      setFrequency(habit.frequency);
      setColor(habit.color);
    } else {
      setEditingHabit(null);
      setName('');
      setDescription('');
      setFrequency('daily');
      setColor(HABIT_COLORS[0]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    const habitData: Partial<Habit> = {
      name,
      description: description || undefined,
      frequency,
      color,
      icon: 'check',
    };

    try {
      if (editingHabit) {
        await fetch('/api/habits', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingHabit.id, ...habitData }),
        });
        setHabits(habits.map(h => h.id === editingHabit.id ? { ...h, ...habitData } : h));
      } else {
        const newHabit: Habit = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          isActive: true,
          logs: [],
          ...habitData,
        } as Habit;
        
        await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newHabit),
        });
        setHabits([...habits, newHabit]);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving habit:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setFrequency('daily');
    setColor(HABIT_COLORS[0]);
    setEditingHabit(null);
  };

  const toggleHabitLog = async (habitId: string, dateStr: string, completed: boolean) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const existingLogIndex = habit.logs.findIndex(l => l.date === dateStr);
    let newLogs;
    
    if (existingLogIndex >= 0) {
      newLogs = [...habit.logs];
      newLogs[existingLogIndex] = { date: dateStr, completed };
    } else {
      newLogs = [...habit.logs, { date: dateStr, completed }];
    }

    // Update locally first
    setHabits(habits.map(h => 
      h.id === habitId ? { ...h, logs: newLogs } : h
    ));

    // Sync to server
    try {
      await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habitId, logs: newLogs }),
      });

      // Track activity when habit is completed
      if (completed && dateStr === todayStr) {
        trackActivity('habit', 'completed', `Hábito completado: ${habit.name}`, habitId);
      }
    } catch (error) {
      console.error('Error updating habit log:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setHabits(habits.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
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

  const isHabitCompletedOnDate = (habit: Habit, dateStr: string) => {
    return habit.logs.some(l => l.date === dateStr && l.completed);
  };

  const activeHabits = habits.filter((h) => h.isActive);
  const habitsCompletedToday = activeHabits.filter((h) => 
    h.logs.some((l) => l.date === todayStr && l.completed)
  );

  // Weekly view calculations
  const currentWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  // Monthly view calculations
  const currentMonth = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfMonth({ start: monthStart, end: monthEnd });

  // Calculate weekly stats per habit
  const getWeeklyStats = (habit: Habit) => {
    let completed = 0;
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (isHabitCompletedOnDate(habit, dateStr)) completed++;
    });
    return {
      completed,
      total: 7,
      percentage: Math.round((completed / 7) * 100)
    };
  };

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats = {
      perfectDays: 0,
      totalCompletions: 0,
      totalPossible: 0,
      bestStreak: 0,
      currentStreak: 0,
    };

    let currentStreak = 0;
    let bestStreak = 0;

    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const completedCount = activeHabits.filter(h => isHabitCompletedOnDate(h, dateStr)).length;
      
      stats.totalCompletions += completedCount;
      stats.totalPossible += activeHabits.length;

      if (completedCount === activeHabits.length && activeHabits.length > 0) {
        stats.perfectDays++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    stats.bestStreak = bestStreak;
    stats.currentStreak = currentStreak;

    return stats;
  }, [monthDays, activeHabits]);

  // Get day intensity for monthly heatmap (0-4)
  const getDayIntensity = (dateStr: string) => {
    if (activeHabits.length === 0) return 0;
    const completedCount = activeHabits.filter(h => isHabitCompletedOnDate(h, dateStr)).length;
    const ratio = completedCount / activeHabits.length;
    if (ratio === 0) return 0;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = [
      'bg-muted/30',
      'bg-emerald-200 dark:bg-emerald-900/40',
      'bg-emerald-300 dark:bg-emerald-800/50',
      'bg-emerald-400 dark:bg-emerald-700/60',
      'bg-emerald-500 dark:bg-emerald-600',
    ];
    return colors[intensity];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Hábitos
            </CardTitle>
            <Button onClick={() => openDialog()}>
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
              <Progress value={activeHabits.length > 0 ? (habitsCompletedToday.length / activeHabits.length) * 100 : 0} className="w-24 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {activeHabits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Comienza tus hábitos</h3>
            <p className="text-muted-foreground mb-6">Crea hábitos para construir una rutina diaria positiva</p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer hábito
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Hoy</TabsTrigger>
            <TabsTrigger value="weekly">Semana</TabsTrigger>
            <TabsTrigger value="monthly">Mes</TabsTrigger>
          </TabsList>

          {/* DAILY VIEW */}
          <TabsContent value="daily" className="space-y-2 mt-4">
            {activeHabits.map((habit) => {
              const isCompletedToday = habit.logs.some((l) => l.date === todayStr && l.completed);
              const streak = getHabitStreak(habit);

              return (
                <Card key={habit.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isCompletedToday ? 'text-white' : 'border-2 hover:border-primary'
                        }`}
                        style={{
                          backgroundColor: isCompletedToday ? habit.color : undefined,
                          borderColor: isCompletedToday ? undefined : habit.color,
                        }}
                        onClick={() => toggleHabitLog(habit.id, todayStr, !isCompletedToday)}
                      >
                        {isCompletedToday && <CheckCircle className="h-5 w-5" />}
                      </button>
                      <div className="flex-1">
                        <p className="font-medium">{habit.name}</p>
                        {habit.description && <p className="text-sm text-muted-foreground">{habit.description}</p>}
                      </div>
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-5 w-5" />
                          <span className="font-bold">{streak}</span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(habit)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar hábito?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(habit.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* WEEKLY VIEW */}
          <TabsContent value="weekly" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <p className="font-medium">
                      {weekOffset === 0 ? 'Esta semana' : weekOffset === 1 ? 'Semana pasada' : `Hace ${weekOffset} semanas`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(currentWeekStart, 'd MMM', { locale: es })} - {format(currentWeekEnd, 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Weekly Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                    {/* Day Headers */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      <div className="p-2 text-sm font-medium text-muted-foreground"></div>
                      {weekDays.map(day => (
                        <div key={day.toISOString()} className={cn(
                          "p-2 text-center text-sm font-medium",
                          isToday(day) && "text-primary"
                        )}>
                          <div>{format(day, 'EEE', { locale: es })}</div>
                          <div className={cn(
                            "text-xs",
                            isToday(day) && "font-bold"
                          )}>{format(day, 'd')}</div>
                        </div>
                      ))}
                    </div>

                    {/* Habits Rows */}
                    {activeHabits.map(habit => {
                      const stats = getWeeklyStats(habit);
                      return (
                        <div key={habit.id} className="grid grid-cols-8 gap-1 mb-1">
                          <div className="p-2 flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                              style={{ backgroundColor: habit.color }}
                            />
                            <span className="text-sm truncate">{habit.name}</span>
                          </div>
                          {weekDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isCompleted = isHabitCompletedOnDate(habit, dateStr);
                            const isFuture = day > new Date();
                            const isClickable = !isFuture || isToday(day);
                            
                            return (
                              <button
                                key={dateStr}
                                disabled={!isClickable}
                                onClick={() => isClickable && toggleHabitLog(habit.id, dateStr, !isCompleted)}
                                className={cn(
                                  "h-10 rounded-md flex items-center justify-center transition-all",
                                  isFuture && !isToday(day) && "bg-muted/20 opacity-50",
                                  !isFuture && !isCompleted && "bg-muted/50 hover:bg-muted",
                                  isCompleted && "text-white",
                                  isClickable && "cursor-pointer hover:scale-105"
                                )}
                                style={isCompleted ? { backgroundColor: habit.color } : {}}
                              >
                                {isCompleted && <CheckCircle className="h-4 w-4" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Weekly Summary */}
                    <div className="grid grid-cols-8 gap-1 mt-4 pt-4 border-t">
                      <div className="p-2 text-sm font-medium">Total</div>
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const completed = activeHabits.filter(h => isHabitCompletedOnDate(h, dateStr)).length;
                        const isFuture = day > new Date();
                        
                        return (
                          <div key={dateStr} className="p-2 text-center">
                            <span className={cn(
                              "text-sm font-medium",
                              isFuture && "text-muted-foreground/50",
                              !isFuture && completed === activeHabits.length && activeHabits.length > 0 && "text-emerald-600"
                            )}>
                              {completed}/{activeHabits.length}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MONTHLY VIEW */}
          <TabsContent value="monthly" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setMonthOffset(monthOffset + 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <p className="font-medium">
                      {monthOffset === 0 ? 'Este mes' : format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))} disabled={monthOffset === 0}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Monthly Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{monthlyStats.perfectDays}</div>
                    <div className="text-xs text-muted-foreground">Días perfectos</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-orange-500">{monthlyStats.bestStreak}</div>
                    <div className="text-xs text-muted-foreground">Mejor racha</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {monthlyStats.totalPossible > 0 
                        ? Math.round((monthlyStats.totalCompletions / monthlyStats.totalPossible) * 100) 
                        : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Cumplimiento</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-purple-600">{monthlyStats.totalCompletions}</div>
                    <div className="text-xs text-muted-foreground">Completados</div>
                  </div>
                </div>

                {/* Monthly Heatmap (GitHub style) */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Actividad del mes</p>
                  {/* Day labels */}
                  <div className="flex gap-1 mb-1">
                    <div className="w-8"></div>
                    {['L', '', 'X', '', 'V', '', 'D'].map((label, i) => (
                      <div key={i} className="w-6 text-xs text-muted-foreground text-center">{label}</div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid - by weeks */}
                  <div className="flex gap-1 flex-wrap">
                    {/* Add empty cells for days before month start */}
                    {Array.from({ length: (getDay(monthStart) + 6) % 7 }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-6 h-6"></div>
                    ))}
                    
                    {/* Month days */}
                    {monthDays.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const intensity = getDayIntensity(dateStr);
                      const isFuture = day > new Date();
                      
                      return (
                        <button
                          key={dateStr}
                          disabled
                          className={cn(
                            "w-6 h-6 rounded-sm transition-colors",
                            getIntensityColor(intensity),
                            isFuture && "opacity-40",
                            isToday(day) && "ring-2 ring-primary ring-offset-1"
                          )}
                          title={`${format(day, 'd MMM', { locale: es })}: ${activeHabits.filter(h => isHabitCompletedOnDate(h, dateStr)).length}/${activeHabits.length} hábitos`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1">Menos</span>
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={cn("w-4 h-4 rounded-sm", getIntensityColor(i))} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">Más</span>
                  </div>
                </div>

                {/* Habits breakdown */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Desglose por hábito</p>
                  <div className="space-y-2">
                    {activeHabits.map(habit => {
                      const completed = monthDays.filter(day => 
                        isHabitCompletedOnDate(habit, format(day, 'yyyy-MM-dd'))
                      ).length;
                      const percentage = Math.round((completed / monthDays.length) * 100);
                      
                      return (
                        <div key={habit.id} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: habit.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm truncate">{habit.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {completed}/{monthDays.length} días ({percentage}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-1.5 mt-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog for creating/editing habits */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Meditar 10 minutos" /></div>
            <div><Label>Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles..." rows={2} /></div>
            <div>
              <Label>Frecuencia</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <button key={c} type="button" className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
