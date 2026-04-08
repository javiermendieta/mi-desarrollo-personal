'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { CheckCircle, Plus, Trash2, Edit, Flame, Loader2 } from 'lucide-react';
import { HABIT_COLORS } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { Habit } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfDay } from 'date-fns';

export function HabitsModule() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [color, setColor] = useState(HABIT_COLORS[0]);

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

  const toggleHabitLog = async (habitId: string, completed: boolean) => {
    console.log('=== toggleHabitLog called ===', { habitId, completed });
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const existingLogIndex = habit.logs.findIndex(l => l.date === todayStr);
    let newLogs;
    
    if (existingLogIndex >= 0) {
      newLogs = [...habit.logs];
      newLogs[existingLogIndex] = { date: todayStr, completed };
    } else {
      newLogs = [...habit.logs, { date: todayStr, completed }];
    }

    // Update locally first
    setHabits(habits.map(h => 
      h.id === habitId ? { ...h, logs: newLogs } : h
    ));

    // Sync to server
    try {
      console.log('=== Syncing habit to server ===');
      await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habitId, logs: newLogs }),
      });
      console.log('=== Habit synced, now tracking activity ===', { completed });

      // Track activity when habit is completed
      if (completed) {
        console.log('=== Calling trackActivity ===');
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

  const activeHabits = habits.filter((h) => h.isActive);
  const habitsCompletedToday = activeHabits.filter((h) => h.logs.some((l) => l.date === todayStr && l.completed));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Hábitos Diarios
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

      {activeHabits.length > 0 ? (
        <div className="space-y-2">
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
                      onClick={() => toggleHabitLog(habit.id, !isCompletedToday)}
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
        </div>
      ) : (
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
      )}

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
