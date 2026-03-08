'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Droplets, Moon, Scale, Footprints, Heart, Activity, Flame, Calendar, Clock, User, MapPin, CheckCircle2, Circle, AlertCircle, Stethoscope } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { saveSleepLogToDB, saveHydrationLogToDB, saveHealthEntryToDB, saveMedicalAppointmentToDB, saveMedicalTaskToDB, deleteMedicalAppointmentFromDB, deleteMedicalTaskFromDB } from '@/lib/dbApi';
import type { SleepLog, HydrationLog, HealthEntry, MedicalAppointment, MedicalTask } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isPast, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '@/lib/utils';

const medicalTaskCategoryConfig = {
  checkup: { label: 'Chequeo', color: 'bg-blue-100 text-blue-700' },
  exam: { label: 'Análisis', color: 'bg-purple-100 text-purple-700' },
  medication: { label: 'Medicación', color: 'bg-orange-100 text-orange-700' },
  specialist: { label: 'Especialista', color: 'bg-green-100 text-green-700' },
  other: { label: 'Otro', color: 'bg-gray-100 text-gray-700' },
};

const appointmentStatusConfig = {
  scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

export function HealthModule() {
  const {
    sleepLogs, addSleepLog, updateSleepLog, deleteSleepLog,
    hydrationLogs, addHydrationLog, updateHydrationLog, deleteHydrationLog,
    healthEntries, addHealthEntry, updateHealthEntry, deleteHealthEntry,
    medicalAppointments, addMedicalAppointment, updateMedicalAppointment, deleteMedicalAppointment,
    medicalTasks, addMedicalTask, updateMedicalTask, deleteMedicalTask, toggleMedicalTask,
  } = useAppStore();

  const [sleepDialog, setSleepDialog] = useState(false);
  const [hydrationDialog, setHydrationDialog] = useState(false);
  const [healthDialog, setHealthDialog] = useState(false);
  const [appointmentDialog, setAppointmentDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);

  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepNotes, setSleepNotes] = useState('');
  const [sleepDate, setSleepDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [glasses, setGlasses] = useState(0);
  const [hydrationDate, setHydrationDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [weight, setWeight] = useState('');
  const [steps, setSteps] = useState('');
  const [calories, setCalories] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [healthDate, setHealthDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Medical appointment form
  const [aptTitle, setAptTitle] = useState('');
  const [aptDoctor, setAptDoctor] = useState('');
  const [aptSpecialty, setAptSpecialty] = useState('');
  const [aptLocation, setAptLocation] = useState('');
  const [aptDate, setAptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [aptTime, setAptTime] = useState('10:00');
  const [aptNotes, setAptNotes] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<MedicalAppointment | null>(null);

  // Medical task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<'checkup' | 'exam' | 'medication' | 'specialist' | 'other'>('other');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [editingTask, setEditingTask] = useState<MedicalTask | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Today's data
  const todaySleep = sleepLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === today);
  const todayHydration = hydrationLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === today);
  const todayHealth = healthEntries.find((e) => format(new Date(e.date), 'yyyy-MM-dd') === today);

  // Medical data
  const upcomingAppointments = medicalAppointments
    .filter(a => a.status === 'scheduled')
    .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
  
  const pendingTasks = medicalTasks.filter(t => !t.completed);
  const completedTasks = medicalTasks.filter(t => t.completed);

  // Weekly stats
  const weekSleepLogs = sleepLogs.filter((l) => {
    const date = new Date(l.date);
    return date >= weekStart && date <= weekEnd;
  });
  const weekHydrationLogs = hydrationLogs.filter((l) => {
    const date = new Date(l.date);
    return date >= weekStart && date <= weekEnd;
  });
  const weekHealthEntries = healthEntries.filter((e) => {
    const date = new Date(e.date);
    return date >= weekStart && date <= weekEnd;
  });

  const avgQuality = weekSleepLogs.length > 0 
    ? (weekSleepLogs.reduce((a, l) => a + l.quality, 0) / weekSleepLogs.length).toFixed(1) 
    : '0';
  const avgGlasses = weekHydrationLogs.length > 0 
    ? Math.round(weekHydrationLogs.reduce((a, l) => a + l.glasses, 0) / weekHydrationLogs.length) 
    : 0;
  const totalSteps = weekHealthEntries.reduce((a, e) => a + (e.steps || 0), 0);
  const totalCalories = weekHealthEntries.reduce((a, e) => a + (e.calories || 0), 0);

  // Chart data - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const sleepChartData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = sleepLogs.find(l => format(new Date(l.date), 'yyyy-MM-dd') === dayStr);
    return {
      name: format(day, 'EEE', { locale: es }),
      calidad: log?.quality || 0,
    };
  });

  const hydrationChartData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = hydrationLogs.find(l => format(new Date(l.date), 'yyyy-MM-dd') === dayStr);
    return {
      name: format(day, 'EEE', { locale: es }),
      vasos: log?.glasses || 0,
      meta: 8,
    };
  });

  const weightChartData = healthEntries
    .filter(e => e.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)
    .map(e => ({
      name: format(new Date(e.date), 'd MMM'),
      peso: e.weight,
    }));

  // Calendar data for medical appointments
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleSaveSleep = async () => {
    const log: SleepLog = {
      id: uuidv4(),
      date: new Date(sleepDate).toISOString(),
      sleepTime,
      wakeTime,
      quality: sleepQuality as 1 | 2 | 3 | 4 | 5,
      notes: sleepNotes || undefined,
    };
    addSleepLog(log);
    // Sync to DB
    try {
      await saveSleepLogToDB({
        id: log.id,
        date: log.date,
        sleepTime: log.sleepTime,
        wakeTime: log.wakeTime,
        quality: log.quality,
        notes: log.notes,
      });
    } catch (e) {
      console.error('Error saving sleep log to DB:', e);
    }
    setSleepDialog(false);
    setSleepTime('');
    setWakeTime('');
    setSleepQuality(3);
    setSleepNotes('');
    setSleepDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSaveHydration = async () => {
    const log: HydrationLog = {
      id: uuidv4(),
      date: new Date(hydrationDate).toISOString(),
      glasses,
      target: 8,
    };
    addHydrationLog(log);
    // Sync to DB
    try {
      await saveHydrationLogToDB({
        id: log.id,
        date: log.date,
        glasses: log.glasses,
        target: log.target,
      });
    } catch (e) {
      console.error('Error saving hydration log to DB:', e);
    }
    setHydrationDialog(false);
    setGlasses(0);
    setHydrationDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSaveHealth = async () => {
    const entry: HealthEntry = {
      id: uuidv4(),
      date: new Date(healthDate).toISOString(),
      weight: weight ? parseFloat(weight) : undefined,
      steps: steps ? parseInt(steps) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      notes: healthNotes || undefined,
    };
    addHealthEntry(entry);
    // Sync to DB
    try {
      await saveHealthEntryToDB({
        id: entry.id,
        date: entry.date,
        weight: entry.weight,
        steps: entry.steps,
        calories: entry.calories,
        notes: entry.notes,
      });
    } catch (e) {
      console.error('Error saving health entry to DB:', e);
    }
    setHealthDialog(false);
    setWeight('');
    setSteps('');
    setCalories('');
    setHealthNotes('');
    setHealthDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const updateTodayHydration = async (newGlasses: number) => {
    if (todayHydration) {
      updateHydrationLog(todayHydration.id, { glasses: newGlasses });
      // Sync to DB
      try {
        await saveHydrationLogToDB({
          id: todayHydration.id,
          date: todayHydration.date,
          glasses: newGlasses,
          target: 8,
        });
      } catch (e) {
        console.error('Error updating hydration log in DB:', e);
      }
    } else {
      const log: HydrationLog = {
        id: uuidv4(),
        date: new Date().toISOString(),
        glasses: newGlasses,
        target: 8,
      };
      addHydrationLog(log);
      // Sync to DB
      try {
        await saveHydrationLogToDB({
          id: log.id,
          date: log.date,
          glasses: log.glasses,
          target: log.target,
        });
      } catch (e) {
        console.error('Error saving hydration log to DB:', e);
      }
    }
  };

  const handleSaveAppointment = async () => {
    if (!aptTitle.trim()) return;
    const appointment: MedicalAppointment = {
      id: editingAppointment?.id || uuidv4(),
      title: aptTitle.trim(),
      doctor: aptDoctor.trim() || undefined,
      specialty: aptSpecialty.trim() || undefined,
      location: aptLocation.trim() || undefined,
      date: aptDate,
      time: aptTime,
      notes: aptNotes.trim() || undefined,
      status: editingAppointment?.status || 'scheduled',
      createdAt: editingAppointment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (editingAppointment) {
      updateMedicalAppointment(editingAppointment.id, appointment);
    } else {
      addMedicalAppointment(appointment);
    }
    // Sync to DB
    try {
      await saveMedicalAppointmentToDB({
        id: appointment.id,
        title: appointment.title,
        doctor: appointment.doctor,
        specialty: appointment.specialty,
        location: appointment.location,
        date: appointment.date,
        time: appointment.time,
        notes: appointment.notes,
        status: appointment.status,
      });
    } catch (e) {
      console.error('Error saving medical appointment to DB:', e);
    }
    setAppointmentDialog(false);
    resetAppointmentForm();
  };

  const resetAppointmentForm = () => {
    setAptTitle('');
    setAptDoctor('');
    setAptSpecialty('');
    setAptLocation('');
    setAptDate(format(new Date(), 'yyyy-MM-dd'));
    setAptTime('10:00');
    setAptNotes('');
    setEditingAppointment(null);
  };

  const openEditAppointment = (apt: MedicalAppointment) => {
    setEditingAppointment(apt);
    setAptTitle(apt.title);
    setAptDoctor(apt.doctor || '');
    setAptSpecialty(apt.specialty || '');
    setAptLocation(apt.location || '');
    setAptDate(apt.date);
    setAptTime(apt.time);
    setAptNotes(apt.notes || '');
    setAppointmentDialog(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;
    const task: MedicalTask = {
      id: editingTask?.id || uuidv4(),
      title: taskTitle.trim(),
      category: taskCategory,
      dueDate: taskDueDate || undefined,
      notes: taskNotes.trim() || undefined,
      completed: editingTask?.completed || false,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (editingTask) {
      updateMedicalTask(editingTask.id, task);
    } else {
      addMedicalTask(task);
    }
    // Sync to DB
    try {
      await saveMedicalTaskToDB({
        id: task.id,
        title: task.title,
        category: task.category,
        dueDate: task.dueDate,
        notes: task.notes,
        completed: task.completed,
      });
    } catch (e) {
      console.error('Error saving medical task to DB:', e);
    }
    setTaskDialog(false);
    resetTaskForm();
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskCategory('other');
    setTaskDueDate('');
    setTaskNotes('');
    setEditingTask(null);
  };

  const openEditTask = (task: MedicalTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskDueDate(task.dueDate || '');
    setTaskNotes(task.notes || '');
    setTaskDialog(true);
  };

  // Wrapper functions for DB sync
  const handleCompleteAppointment = async (apt: MedicalAppointment) => {
    updateMedicalAppointment(apt.id, { status: 'completed' });
    try {
      await saveMedicalAppointmentToDB({
        id: apt.id,
        title: apt.title,
        doctor: apt.doctor,
        specialty: apt.specialty,
        location: apt.location,
        date: apt.date,
        time: apt.time,
        notes: apt.notes,
        status: 'completed',
      });
    } catch (e) {
      console.error('Error completing appointment in DB:', e);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    deleteMedicalAppointment(id);
    try {
      await deleteMedicalAppointmentFromDB(id);
    } catch (e) {
      console.error('Error deleting appointment from DB:', e);
    }
  };

  const handleToggleTask = async (task: MedicalTask) => {
    toggleMedicalTask(task.id);
    try {
      await saveMedicalTaskToDB({
        id: task.id,
        title: task.title,
        category: task.category,
        dueDate: task.dueDate,
        notes: task.notes,
        completed: !task.completed,
      });
    } catch (e) {
      console.error('Error toggling task in DB:', e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    deleteMedicalTask(id);
    try {
      await deleteMedicalTaskFromDB(id);
    } catch (e) {
      console.error('Error deleting task from DB:', e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calidad Sueño</p>
                <p className="text-3xl font-bold text-indigo-600">{todaySleep?.quality || '-'}/5</p>
                {todaySleep && (
                  <p className="text-xs text-muted-foreground mt-1">{todaySleep.sleepTime} - {todaySleep.wakeTime}</p>
                )}
              </div>
              <Moon className="h-10 w-10 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hidratación</p>
                <p className="text-3xl font-bold text-blue-600">{todayHydration?.glasses || 0}/8</p>
                <p className="text-xs text-muted-foreground mt-1">vasos de agua</p>
              </div>
              <Droplets className="h-10 w-10 text-blue-400" />
            </div>
            <Progress value={((todayHydration?.glasses || 0) / 8) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas Citas</p>
                <p className="text-3xl font-bold text-teal-600">{upcomingAppointments.length}</p>
                {upcomingAppointments[0] && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{upcomingAppointments[0].title}</p>
                )}
              </div>
              <Stethoscope className="h-10 w-10 text-teal-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes Médicos</p>
                <p className="text-3xl font-bold text-amber-600">{pendingTasks.length}</p>
                {pendingTasks[0] && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{pendingTasks[0].title}</p>
                )}
              </div>
              <AlertCircle className="h-10 w-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="appointments">Citas Médicas</TabsTrigger>
          <TabsTrigger value="tasks">Pendientes</TabsTrigger>
          <TabsTrigger value="sleep">Sueño</TabsTrigger>
          <TabsTrigger value="hydration">Hidratación</TabsTrigger>
          <TabsTrigger value="health">Salud</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Weekly Stats */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Estadísticas de la Semana</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{avgQuality}</p>
                  <p className="text-sm text-muted-foreground">Calidad sueño prom.</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{avgGlasses}</p>
                  <p className="text-sm text-muted-foreground">Vasos prom./día</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-600">{totalSteps.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Pasos totales</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{totalCalories.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Calorías totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming appointments and tasks */}
          {(upcomingAppointments.length > 0 || pendingTasks.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingAppointments.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-500" />
                      Próximas Citas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upcomingAppointments.slice(0, 3).map(apt => (
                        <div key={apt.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                          <div className="text-center">
                            <p className="text-sm font-bold">{format(parseISO(apt.date), 'd')}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(apt.date), 'MMM')}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{apt.title}</p>
                            <p className="text-xs text-muted-foreground">{apt.time} {apt.doctor && `- ${apt.doctor}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {pendingTasks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Pendientes Médicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pendingTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground">{format(parseISO(task.dueDate), 'd MMM yyyy')}</p>
                            )}
                          </div>
                          <Badge className={medicalTaskCategoryConfig[task.category].color}>
                            {medicalTaskCategoryConfig[task.category].label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-500" />Registrar Sueño</CardTitle></CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setSleepDialog(true)}><Plus className="h-4 w-4 mr-2" />Añadir</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />Registrar Agua</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => updateTodayHydration(Math.max(0, (todayHydration?.glasses || 0) - 1))}>-</Button>
                  <span className="flex-1 text-center text-2xl font-bold">{todayHydration?.glasses || 0}</span>
                  <Button variant="outline" size="icon" onClick={() => updateTodayHydration((todayHydration?.glasses || 0) + 1)}>+</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" />Registrar Salud</CardTitle></CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setHealthDialog(true)}><Plus className="h-4 w-4 mr-2" />Añadir</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Citas Médicas
            </h3>
            <Button onClick={() => setAppointmentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />Nueva Cita
            </Button>
          </div>

          {/* Mini Calendar */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div key={i} className="text-xs font-medium text-muted-foreground">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                  const dayAppointments = medicalAppointments.filter(a => a.date === format(day, 'yyyy-MM-dd') && a.status === 'scheduled');
                  const isTodayDate = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "aspect-square p-1 rounded text-sm relative cursor-pointer hover:bg-muted transition-colors",
                        isTodayDate && "ring-2 ring-primary",
                        dayAppointments.length > 0 && "bg-teal-50 dark:bg-teal-950/30"
                      )}
                    >
                      {format(day, 'd')}
                      {dayAppointments.length > 0 && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Todas las Citas</CardTitle></CardHeader>
            <CardContent>
              {medicalAppointments.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {medicalAppointments
                    .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                    .map(apt => (
                      <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted">
                        <div className="text-center min-w-[50px]">
                          <p className="text-lg font-bold">{format(parseISO(apt.date), 'd')}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(apt.date), 'MMM yyyy')}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{apt.title}</p>
                            <Badge className={appointmentStatusConfig[apt.status].color}>
                              {appointmentStatusConfig[apt.status].label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                            {apt.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{apt.time}</span>}
                            {apt.doctor && <span className="flex items-center gap-1"><User className="h-3 w-3" />{apt.doctor}</span>}
                            {apt.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{apt.location}</span>}
                          </div>
                          {apt.notes && <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditAppointment(apt)}>Editar</Button>
                          {apt.status === 'scheduled' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleCompleteAppointment(apt)}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAppointment(apt.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay citas médicas registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pendientes Médicos
            </h3>
            <Button onClick={() => setTaskDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />Nuevo Pendiente
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Circle className="h-4 w-4 text-amber-500" />
                  Pendientes ({pendingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingTasks.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {pendingTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={medicalTaskCategoryConfig[task.category].color}>
                              {medicalTaskCategoryConfig[task.category].label}
                            </Badge>
                            {task.dueDate && (
                              <span className={cn(
                                "text-xs",
                                isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && "text-red-500"
                              )}>
                                {format(parseISO(task.dueDate), 'd MMM yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTask(task)}>
                            <span className="text-xs">✎</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay pendientes</p>
                )}
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Completados ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedTasks.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {completedTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 opacity-60">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-through">{task.title}</p>
                          <Badge className={medicalTaskCategoryConfig[task.category].color}>
                            {medicalTaskCategoryConfig[task.category].label}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay tareas completadas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Moon className="h-5 w-5 text-indigo-500" />Calidad del Sueño</CardTitle>
                  <Button size="sm" onClick={() => setSleepDialog(true)}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sleepChartData}>
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis domain={[0, 5]} fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="calidad" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Historial Reciente</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sleepLogs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <p className="font-medium">{format(new Date(log.date), 'd MMM')}</p>
                        <p className="text-xs text-muted-foreground">{log.sleepTime} - {log.wakeTime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{log.quality}/5</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSleepLog(log.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sleepLogs.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay registros</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hydration" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Droplets className="h-5 w-5 text-blue-500" />Hidratación</CardTitle>
                <Button size="sm" onClick={() => setHydrationDialog(true)}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hydrationChartData}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis domain={[0, 10]} fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="vasos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Line type="monotone" dataKey="meta" stroke="#94a3b8" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => {
                  const log = hydrationLogs.find(l => isSameDay(new Date(l.date), day));
                  const percentage = log ? (log.glasses / 8) * 100 : 0;
                  return (
                    <div key={day.toISOString()} className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{format(day, 'EEE', { locale: es })}</p>
                      <div className="h-16 bg-muted rounded relative">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-blue-400 rounded transition-all"
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs mt-1">{log?.glasses || 0}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-rose-500" />Peso</CardTitle>
                  <Button size="sm" onClick={() => setHealthDialog(true)}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
                </div>
              </CardHeader>
              <CardContent>
                {weightChartData.length > 1 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightChartData}>
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="peso" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Necesitas más registros para ver el gráfico</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Historial Reciente</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {healthEntries.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <p className="font-medium">{format(new Date(entry.date), 'd MMM')}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {entry.weight && <span>{entry.weight} kg</span>}
                          {entry.steps && <span>{entry.steps.toLocaleString()} pasos</span>}
                          {entry.calories && <span>{entry.calories} cal</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteHealthEntry(entry.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {healthEntries.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay registros</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sleep Dialog */}
      <Dialog open={sleepDialog} onOpenChange={setSleepDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Sueño</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha</Label><Input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora de dormir</Label><Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} /></div>
              <div><Label>Hora de despertar</Label><Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} /></div>
            </div>
            <div>
              <Label>Calidad: {sleepQuality}/5</Label>
              <input type="range" min="1" max="5" value={sleepQuality} onChange={(e) => setSleepQuality(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)} className="w-full mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Muy mal</span>
                <span>Excelente</span>
              </div>
            </div>
            <div><Label>Notas (opcional)</Label><Input value={sleepNotes} onChange={(e) => setSleepNotes(e.target.value)} placeholder="Ej: Me desperté varias veces" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSleepDialog(false)}>Cancelar</Button><Button onClick={handleSaveSleep}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hydration Dialog */}
      <Dialog open={hydrationDialog} onOpenChange={setHydrationDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Hidratación</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha</Label><Input type="date" value={hydrationDate} onChange={(e) => setHydrationDate(e.target.value)} /></div>
            <div><Label>Vasos de agua</Label><Input type="number" min="0" max="20" value={glasses} onChange={(e) => setGlasses(parseInt(e.target.value) || 0)} /></div>
            <p className="text-sm text-muted-foreground">Meta: 8 vasos por día</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHydrationDialog(false)}>Cancelar</Button><Button onClick={handleSaveHydration}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Dialog */}
      <Dialog open={healthDialog} onOpenChange={setHealthDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Salud</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha</Label><Input type="date" value={healthDate} onChange={(e) => setHealthDate(e.target.value)} /></div>
            <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
            <div><Label>Pasos</Label><Input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} /></div>
            <div><Label>Calorías</Label><Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} /></div>
            <div><Label>Notas (opcional)</Label><Input value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHealthDialog(false)}>Cancelar</Button><Button onClick={handleSaveHealth}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medical Appointment Dialog */}
      <Dialog open={appointmentDialog} onOpenChange={(open) => { setAppointmentDialog(open); if (!open) resetAppointmentForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAppointment ? 'Editar Cita' : 'Nueva Cita Médica'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={aptTitle} onChange={(e) => setAptTitle(e.target.value)} placeholder="Ej: Consulta con cardiólogo" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha</Label><Input type="date" value={aptDate} onChange={(e) => setAptDate(e.target.value)} /></div>
              <div><Label>Hora</Label><Input type="time" value={aptTime} onChange={(e) => setAptTime(e.target.value)} /></div>
            </div>
            <div><Label>Doctor/Médico</Label><Input value={aptDoctor} onChange={(e) => setAptDoctor(e.target.value)} placeholder="Dr. Pérez" /></div>
            <div><Label>Especialidad</Label><Input value={aptSpecialty} onChange={(e) => setAptSpecialty(e.target.value)} placeholder="Cardiología" /></div>
            <div><Label>Ubicación</Label><Input value={aptLocation} onChange={(e) => setAptLocation(e.target.value)} placeholder="Hospital X, Consultorio Y" /></div>
            <div><Label>Notas</Label><Input value={aptNotes} onChange={(e) => setAptNotes(e.target.value)} placeholder="Llevar estudios previos" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAppointmentDialog(false); resetAppointmentForm(); }}>Cancelar</Button>
            <Button onClick={handleSaveAppointment} disabled={!aptTitle.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medical Task Dialog */}
      <Dialog open={taskDialog} onOpenChange={(open) => { setTaskDialog(open); if (!open) resetTaskForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? 'Editar Pendiente' : 'Nuevo Pendiente Médico'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ej: Ir al dentista" /></div>
            <div>
              <Label>Categoría</Label>
              <Select value={taskCategory} onValueChange={(v) => setTaskCategory(v as typeof taskCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(medicalTaskCategoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fecha límite (opcional)</Label><Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} /></div>
            <div><Label>Notas</Label><Input value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} placeholder="Detalles adicionales" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTaskDialog(false); resetTaskForm(); }}>Cancelar</Button>
            <Button onClick={handleSaveTask} disabled={!taskTitle.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
