'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import type { BlueprintTask, BlueprintTaskLog } from '@/types';
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Flame,
  Calendar,
  Target,
  AlertTriangle,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Skull,
  Hourglass,
  Trophy,
  TrendingUp,
  Sparkles,
  Infinity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Frases de choque rotativas
const SHOCK_PHRASES = [
  "Mi cifosis es la falta de liderazgo de mi papá. La falta de musculatura de Dimitri es mi falta de liderazgo.",
  "La mugre de mi casa es mi desorden interno. Como es arriba es abajo, como es adentro es afuera.",
  "El desorden de mi casa es mi desorden interno. Como es arriba es abajo.",
  "La consultoría hoy es el local propio mañana. Regalás tu tiempo ahora para comprar tu libertad después.",
  "¿Querés ser el gerente de otro o el dueño de tu imperio? La diferencia son los Reels de hoy.",
  "El entorno no te ayuda. Sos vos contra el mundo. Aislate y metele rock.",
];

// Citas bíblicas por día
const BIBLICAL_VERSES: Record<number, { verse: string; reference: string }> = {
  1: { verse: "No te he dicho que si crees, verás la gloria de Dios?", reference: "Juan 11:40" },
  2: { verse: "Esfuérzate y sé valiente; no temas ni desmayes.", reference: "Josué 1:9" },
  3: { verse: "El que labra su tierra se saciará de pan.", reference: "Proverbios 12:11" },
  4: { verse: "Todo lo puedo en Cristo que me fortalece.", reference: "Filipenses 4:13" },
  5: { verse: "¿Has visto hombre solícito en su trabajo? Delante de los reyes estará.", reference: "Proverbios 22:29" },
  6: { verse: "El alma de los diligentes será prosperada.", reference: "Proverbios 13:4" },
  0: { verse: "Seis días trabajarás, y harás toda tu obra.", reference: "Éxodo 20:9" },
};

// Principios del Kybalion - Sabiduría Hermética
const KYBALION_PRINCIPLES = [
  {
    name: "Principio del Mentalismo",
    phrase: "EL TODO ES MENTE; el universo es mental.",
    explanation: "Todo lo que existe es creación mental del Todo. Tu mente crea tu realidad."
  },
  {
    name: "Principio de Correspondencia",
    phrase: "Como es arriba, es abajo; como es abajo, es arriba.",
    explanation: "Los mismos patrones se repiten en todos los planos de existencia. Lo que hacés en tu vida diaria se refleja en tu destino."
  },
  {
    name: "Principio de Vibración",
    phrase: "Nada está inmóvil; todo se mueve; todo vibra.",
    explanation: "Todo está en constante movimiento. Tu energía y frecuencia determinan lo que atraés."
  },
  {
    name: "Principio de Polaridad",
    phrase: "Todo es dual; todo tiene dos polos; todo tiene su par de opuestos.",
    explanation: "Los opuestos son lo mismo en naturaleza, solo difieren en grado. Del odio al amor hay un paso."
  },
  {
    name: "Principio del Ritmo",
    phrase: "Todo fluye, afuera y adentro; toda cosa tiene sus ciclos.",
    explanation: "Todo tiene sus ciclos de subida y bajada. Aceptá los ritmos de la vida."
  },
  {
    name: "Principio de Causa y Efecto",
    phrase: "Toda causa tiene su efecto; todo efecto tiene su causa.",
    explanation: "Nada escapa a la Ley. Cada acción que hacés hoy siembra las semillas de tu mañana."
  },
  {
    name: "Principio de Generación",
    phrase: "Todo tiene su principio masculino y femenino.",
    explanation: "En todo hay aspectos yin y yang. El equilibrio entre acción y recepción genera creación."
  }
];

// Aforismos del Kybalion
const KYBALION_APHORISMS = [
  "Como es arriba, es abajo; como es abajo, es arriba.",
  "Dondequiera que se halle la vibración, allí se encuentra el movimiento.",
  "El que comprende el Principio de Vibración, ha tomado la llave del poder.",
  "Todo es dual; todo tiene dos polos; todo tiene su par de opuestos.",
  "Los opuestos son idénticos en naturaleza, pero diferentes en grado.",
  "Todo fluye, afuera y adentro; toda cosa tiene sus ciclos.",
  "La medida de la oscilación hacia la derecha es la misma que hacia la izquierda.",
  "Toda causa tiene su efecto; todo efecto tiene su causa.",
  "Nada escapa a la Ley.",
  "El TODO es MENTE; el universo es mental.",
  "La transmutación es el arte de cambiar una cosa en otra.",
  "El sabio sirve en lo de arriba, pero trabaja en lo de abajo.",
  "El que conoce la ley del ritmo, puede neutralizar sus efectos.",
  "La mente así como los metales y los elementos, puede transmutarse.",
  "Ninguna creación física puede escapar a la Ley de Generación.",
];

// Tareas por defecto del Blueprint
const DEFAULT_TASKS: Omit<BlueprintTask, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { title: "Salto de cama", time: "05:00", description: "Prohibido tocar el celular para ocio", order: 1, isActive: true },
  { title: "Mentalización Cruda + Oración/Meditación", time: "05:10", description: "", order: 2, isActive: true },
  { title: "Paseo Perro + Yoga + Video Deporte", time: "05:30", description: "Marca Personal Social/Círculo", order: 3, isActive: true },
  { title: "LECTURA: 1 Día del Blueprint de Llados", time: "06:30", description: "Foco en mindset y disciplina", order: 4, isActive: true },
  { title: "Grabación de Reel de Consultoría", time: "07:30", description: "Autoridad/Resultados Franquicia", order: 5, isActive: true },
  { title: "Bloque de Cacería", time: "08:30", description: "Llamar a los 9 leads + Seguimiento Franquicia", order: 6, isActive: true },
  { title: "Turno Moto", time: "11:00", description: "Escuchar Mentorías de Ventas/Estrategia", order: 7, isActive: true },
  { title: "Auditoría del día + Planificación Mañana", time: "22:00", description: "", order: 8, isActive: true },
];

interface StreakData {
  [taskId: string]: number;
}

interface TotalCompletedData {
  [taskId: string]: number;
}

interface CompletedDatesData {
  [taskId: string]: string[];
}

// Meta de días para formar el hábito
const HABIT_GOAL_DAYS = 90;

export function BlueprintModule() {
  const {
    blueprintTasks,
    blueprintTaskLogs,
    setBlueprintTasks,
    addBlueprintTask,
    updateBlueprintTask,
    deleteBlueprintTask,
    setBlueprintTaskLogs,
    toggleBlueprintTaskLog,
  } = useAppStore();

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentKybalionIndex, setCurrentKybalionIndex] = useState(0);
  const [streaks, setStreaks] = useState<StreakData>({});
  const [totalCompleted, setTotalCompleted] = useState<TotalCompletedData>({});
  const [completedDates, setCompletedDates] = useState<CompletedDatesData>({});
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showPanicDialog, setShowPanicDialog] = useState(false);
  const [panicLevel, setPanicLevel] = useState(1);
  const [showPanicAction, setShowPanicAction] = useState(false);
  const [editingTask, setEditingTask] = useState<BlueprintTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', time: '06:00', description: '', days: undefined as number[] | undefined });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [lifeCountdown, setLifeCountdown] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
    totalWeeks: 0,
    livedPercentage: 0,
  });

  // Cargar datos desde la API
  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/blueprint');
      const data = await response.json();

      if (data.tasks) {
        setBlueprintTasks(data.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          time: t.time,
          description: t.description || '',
          days: t.days || undefined,
          order: t.order,
          isActive: t.isActive,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })));
      }

      if (data.logs) {
        setBlueprintTaskLogs(data.logs.map((l: any) => ({
          id: l.id,
          taskId: l.taskId,
          // La fecha ya viene como string YYYY-MM-DD del API
          date: typeof l.date === 'string' ? l.date : (l.date.toISOString ? l.date.toISOString().split('T')[0] : l.date),
          completed: l.completed,
          createdAt: l.createdAt,
        })));
      }

      if (data.streaks) {
        setStreaks(data.streaks);
      }

      if (data.totalCompletedDays) {
        setTotalCompleted(data.totalCompletedDays);
      }

      if (data.completedDatesByTask) {
        setCompletedDates(data.completedDatesByTask);
      }

      // Si no hay tareas, crear las por defecto
      if (!data.tasks || data.tasks.length === 0) {
        await createDefaultTasks();
      }
    } catch (error) {
      console.error('Error loading blueprint data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setBlueprintTasks, setBlueprintTaskLogs]);

  const createDefaultTasks = async () => {
    for (const task of DEFAULT_TASKS) {
      try {
        const response = await fetch('/api/blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...task, days: null }),
        });
        const data = await response.json();
        if (data.task) {
          addBlueprintTask({
            id: data.task.id,
            title: data.task.title,
            time: data.task.time,
            description: data.task.description || '',
            days: data.task.days || undefined,
            order: data.task.order,
            isActive: data.task.isActive,
            createdAt: data.task.createdAt,
            updatedAt: data.task.updatedAt,
          });
        }
      } catch (error) {
        console.error('Error creating default task:', error);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Rotar frases cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % SHOCK_PHRASES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotar aforismos del Kybalion cada 20 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentKybalionIndex((prev) => (prev + 1) % KYBALION_APHORISMS.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Contador de vida - Memento Mori
  // Nacimiento: 8 de julio de 1981 - Expectativa: 75 años (8 de julio de 2056)
  useEffect(() => {
    const birthDate = new Date(1981, 6, 8); // 8 de julio de 1981 (mes 6 = julio, 0-indexed)
    const deathDate = new Date(2056, 6, 8); // 75 años después

    const updateCountdown = () => {
      const now = new Date();
      const diff = deathDate.getTime() - now.getTime();

      if (diff <= 0) {
        setLifeCountdown({
          years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
          totalDays: 0, totalWeeks: 0, livedPercentage: 100,
        });
        return;
      }

      // Calcular años, meses, días
      let years = deathDate.getFullYear() - now.getFullYear();
      let months = deathDate.getMonth() - now.getMonth();
      let days = deathDate.getDate() - now.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        days += prevMonth.getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      // Calcular horas, minutos, segundos
      const today = new Date();
      const hours = 23 - today.getHours();
      const minutes = 59 - today.getMinutes();
      const seconds = 59 - today.getSeconds();

      // Total de días y semanas restantes
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);

      // Porcentaje de vida vivida
      const totalLifeMs = deathDate.getTime() - birthDate.getTime();
      const livedMs = now.getTime() - birthDate.getTime();
      const livedPercentage = Math.min(100, (livedMs / totalLifeMs) * 100);

      setLifeCountdown({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        totalDays,
        totalWeeks,
        livedPercentage,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
  const dayOfWeek = selectedDate.getDay();
  const todayVerse = BIBLICAL_VERSES[dayOfWeek];

  // Formatear fecha para comparación (usando fecha local, no UTC)
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Verificar si una tarea está completada en una fecha específica
  const isTaskCompleted = (taskId: string, date: Date): boolean => {
    const dateKey = formatDateKey(date);
    const log = blueprintTaskLogs.find(l => l.taskId === taskId && l.date === dateKey);
    return log?.completed || false;
  };

  // Toggle completado de tarea
  const handleToggleTask = async (taskId: string, date: Date) => {
    const dateKey = formatDateKey(date);
    const currentCompleted = isTaskCompleted(taskId, date);
    const newCompleted = !currentCompleted;

    // Actualizar localmente
    toggleBlueprintTaskLog(taskId, dateKey, newCompleted);

    // Actualizar en el servidor
    try {
      const response = await fetch('/api/blueprint/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, date: dateKey, completed: newCompleted }),
      });
      const data = await response.json();
      if (data.streak !== undefined) {
        setStreaks(prev => ({ ...prev, [taskId]: data.streak }));
      }
      if (data.totalCompleted !== undefined) {
        setTotalCompleted(prev => ({ ...prev, [taskId]: data.totalCompleted }));
      }
      if (data.completedDates) {
        setCompletedDates(prev => ({ ...prev, [taskId]: data.completedDates }));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Agregar nueva tarea
  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          time: newTask.time,
          description: newTask.description,
          days: newTask.days || null,
        }),
      });
      const data = await response.json();
      if (data.task) {
        addBlueprintTask({
          id: data.task.id,
          title: data.task.title,
          time: data.task.time,
          description: data.task.description || '',
          days: data.task.days || undefined,
          order: data.task.order,
          isActive: data.task.isActive,
          createdAt: data.task.createdAt,
          updatedAt: data.task.updatedAt,
        });
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }

    setNewTask({ title: '', time: '06:00', description: '', days: undefined });
    setIsAddingTask(false);
  };

  // Actualizar tarea
  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      await fetch('/api/blueprint', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask),
      });
      updateBlueprintTask(editingTask.id, editingTask);
    } catch (error) {
      console.error('Error updating task:', error);
    }

    setEditingTask(null);
  };

  // Eliminar tarea
  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch('/api/blueprint', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      deleteBlueprintTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Calcular progreso del día
  const calculateDayProgress = (date: Date): number => {
    if (blueprintTasks.length === 0) return 0;
    const completed = blueprintTasks.filter(t => isTaskCompleted(t.id, date)).length;
    return Math.round((completed / blueprintTasks.length) * 100);
  };

  // Obtener días de la semana actual
  const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lunes

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Obtener días del mes
  const getMonthDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  // Navegar entre fechas
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (activeView === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (activeView === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  // Calcular racha máxima
  const maxStreak = Math.max(...Object.values(streaks), 0);
  const totalStreaks = Object.values(streaks).reduce((a, b) => a + b, 0);

  // Formatear fecha para mostrar
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const weekDays = getWeekDays(selectedDate);
  const monthDays = getMonthDays(selectedDate);
  const todayProgress = calculateDayProgress(selectedDate);

  // Filtrar tareas por día seleccionado
  const filteredTasks = blueprintTasks.filter(task => {
    // Si no tiene días definidos, mostrar todos los días
    if (!task.days || task.days.length === 0) return true;
    // Si tiene días definidos, mostrar solo si el día seleccionado está incluido
    return task.days.includes(selectedDate.getDay());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con frase de choque */}
      <Card className="bg-gradient-to-r from-red-900/80 to-orange-900/80 border-red-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/30 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-white leading-tight">
                {SHOCK_PHRASES[currentPhraseIndex]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MEMENTO MORI - Contador de Vida */}
      <Card className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-600 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Icono y Título */}
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gray-700/50 rounded-full animate-pulse">
                <Skull className="h-10 w-10 text-gray-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100">MEMENTO MORI</h3>
                <p className="text-sm text-gray-400">Recuerda que vas a morir</p>
              </div>
            </div>

            {/* Contador Principal */}
            <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl md:text-3xl font-bold text-white">{lifeCountdown.years}</p>
                <p className="text-xs text-gray-400 uppercase">Años</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl md:text-3xl font-bold text-white">{lifeCountdown.months}</p>
                <p className="text-xs text-gray-400 uppercase">Meses</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl md:text-3xl font-bold text-white">{lifeCountdown.days}</p>
                <p className="text-xs text-gray-400 uppercase">Días</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl md:text-3xl font-bold text-white">{String(lifeCountdown.hours).padStart(2, '0')}</p>
                <p className="text-xs text-gray-400 uppercase">Horas</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl md:text-3xl font-bold text-white">{String(lifeCountdown.minutes).padStart(2, '0')}</p>
                <p className="text-xs text-gray-400 uppercase">Min</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl md:text-3xl font-bold text-amber-400">{String(lifeCountdown.seconds).padStart(2, '0')}</p>
                <p className="text-xs text-gray-400 uppercase">Seg</p>
              </div>
            </div>
          </div>

          {/* Barra de progreso y stats */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Vida transcurrida: <span className="text-white font-bold">{lifeCountdown.livedPercentage.toFixed(1)}%</span></span>
              <span className="text-gray-400">
                <Hourglass className="h-4 w-4 inline mr-1" />
                {lifeCountdown.totalWeeks.toLocaleString()} semanas restantes
              </span>
            </div>
            {/* Barra de progreso */}
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-1000"
                style={{ width: `${lifeCountdown.livedPercentage}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-500 italic">
              "No es que tengamos poco tiempo, es que perdemos mucho" — Séneca
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border-emerald-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm text-emerald-300">Racha Máxima</p>
                <p className="text-2xl font-bold text-white">{maxStreak} días</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-blue-300">Progreso Hoy</p>
                <p className="text-2xl font-bold text-white">{todayProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-purple-300">Tareas Activas</p>
                <p className="text-2xl font-bold text-white">{blueprintTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border-pink-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-pink-400" />
              <div>
                <p className="text-sm text-pink-300">Rachas Totales</p>
                <p className="text-2xl font-bold text-white">{totalStreaks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desafío 90 Días - Progreso de Hábitos */}
      <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-600">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-indigo-100">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Desafío 90 Días - Formación de Hábitos
          </CardTitle>
          <p className="text-sm text-indigo-300">Cada hábito requiere 90 días consecutivos. Si fallas un día, la racha vuelve a cero pero conservas el historial.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blueprintTasks.map((task) => {
              const taskStreak = streaks[task.id] || 0;
              const taskTotal = totalCompleted[task.id] || 0;
              const progressPercent = Math.min(100, (taskStreak / HABIT_GOAL_DAYS) * 100);
              const isCompleted = taskStreak >= HABIT_GOAL_DAYS;
              
              return (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.time}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Flame className={cn(
                          "h-4 w-4",
                          taskStreak > 0 ? "text-orange-400" : "text-gray-500"
                        )} />
                        <span className="font-bold text-orange-300">{taskStreak}</span>
                        <span className="text-gray-400">/90</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-300">{taskTotal} días total</span>
                      </div>
                      {isCompleted && (
                        <Trophy className="h-5 w-5 text-yellow-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="relative">
                    <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          isCompleted 
                            ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" 
                            : taskStreak >= 60
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                              : taskStreak >= 30
                                ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                : taskStreak >= 10
                                  ? "bg-gradient-to-r from-purple-500 to-purple-400"
                                  : "bg-gradient-to-r from-gray-500 to-gray-400"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {/* Marcadores de hitos */}
                    <div className="absolute top-0 left-0 w-full h-full flex items-center pointer-events-none">
                      <div className="absolute left-[11%] w-0.5 h-5 bg-gray-600/50" title="10 días" />
                      <div className="absolute left-[33%] w-0.5 h-5 bg-gray-600/50" title="30 días" />
                      <div className="absolute left-[66%] w-0.5 h-5 bg-gray-600/50" title="60 días" />
                    </div>
                  </div>
                  
                  {/* Mensaje de estado */}
                  <div className="flex justify-between text-xs">
                    {isCompleted ? (
                      <span className="text-yellow-300 font-medium">🏆 ¡HÁBITO CONSOLIDADO! Meta de 90 días alcanzada</span>
                    ) : taskStreak === 0 ? (
                      <span className="text-gray-400">Comenzá tu racha hoy</span>
                    ) : taskStreak < 10 ? (
                      <span className="text-purple-300">Fase de inicio: {10 - taskStreak} días para el primer hito</span>
                    ) : taskStreak < 30 ? (
                      <span className="text-blue-300">Fase de adaptación: {30 - taskStreak} días para consolidar</span>
                    ) : taskStreak < 60 ? (
                      <span className="text-emerald-300">Fase de consolidación: {60 - taskStreak} días para avanzar</span>
                    ) : (
                      <span className="text-amber-300">¡Casi llegás! {90 - taskStreak} días para la meta</span>
                    )}
                    <span className="text-gray-500">{progressPercent.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
            
            {blueprintTasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No hay tareas activas. Agregá tareas para comenzar el desafío.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sabiduría Hermética - El Kybalion */}
      <Card className="bg-gradient-to-r from-violet-950/80 to-purple-950/80 border-violet-600 overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-600/30 rounded-full">
                <Infinity className="h-6 w-6 text-violet-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-violet-100">EL KYBALION</h3>
                <p className="text-xs text-violet-400">Enseñanzas Herméticas de Hermes Trismegisto</p>
              </div>
            </div>

            {/* Aforismo rotativo destacado */}
            <div className="bg-violet-900/40 rounded-lg p-4 border border-violet-700/50">
              <p className="text-xl font-semibold text-center text-violet-100 leading-relaxed transition-opacity duration-500">
                "{KYBALION_APHORISMS[currentKybalionIndex]}"
              </p>
            </div>

            {/* Los 7 Principios */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Los 7 Principios Herméticos</h4>
              <div className="grid gap-2">
                {KYBALION_PRINCIPLES.map((principle, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      index === currentKybalionIndex % KYBALION_PRINCIPLES.length
                        ? "bg-violet-800/50 border-violet-500"
                        : "bg-violet-900/20 border-violet-800/30 hover:bg-violet-900/30"
                    )}
                    onClick={() => setCurrentKybalionIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      <span className="font-medium text-violet-200 text-sm">{principle.name}</span>
                    </div>
                    <p className="text-xs text-violet-300 mt-1 italic ml-6">"{principle.phrase}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Principio expandido */}
            <div className="bg-gradient-to-r from-violet-900/60 to-purple-900/60 rounded-lg p-4 border border-violet-600/50">
              <p className="text-sm text-violet-200 leading-relaxed">
                {KYBALION_PRINCIPLES[currentKybalionIndex % KYBALION_PRINCIPLES.length].explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Munición Espiritual */}
      <Card className="bg-gradient-to-r from-amber-900/50 to-yellow-900/30 border-amber-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-amber-400" />
            <div>
              <p className="text-lg italic text-amber-100">"{todayVerse.verse}"</p>
              <p className="text-sm text-amber-300 mt-1">{todayVerse.reference}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="daily">Diaria</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[150px] text-center capitalize">
              {activeView === 'daily' && formatDisplayDate(selectedDate)}
              {activeView === 'weekly' && `Semana del ${weekDays[0].getDate()}`}
              {activeView === 'monthly' && selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Vista Diaria */}
        <TabsContent value="daily">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Checklist del Día
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddingTask(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Tarea
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTasks
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-all",
                        isTaskCompleted(task.id, selectedDate)
                          ? "bg-emerald-900/30 border-emerald-700"
                          : "bg-card border-border hover:border-emerald-600"
                      )}
                    >
                      <Checkbox
                        checked={isTaskCompleted(task.id, selectedDate)}
                        onCheckedChange={() => handleToggleTask(task.id, selectedDate)}
                        className="h-6 w-6"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.time}
                          </Badge>
                          <span className={cn(
                            "font-medium",
                            isTaskCompleted(task.id, selectedDate) && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                          {task.days && task.days.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {task.days.map(d => dayNames[d]).join(', ')}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>

                      {/* Racha y total de esta tarea */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1" title="Racha actual">
                          <Flame className={cn(
                            "h-5 w-5",
                            streaks[task.id] > 0 ? "text-orange-400" : "text-gray-500"
                          )} />
                          <span className="text-sm font-bold text-orange-300">{streaks[task.id] || 0}</span>
                          <span className="text-xs text-gray-500">/90</span>
                        </div>
                        <div className="flex items-center gap-1" title="Total días completados">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-emerald-300">{totalCompleted[task.id] || 0}</span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay tareas programadas para {dayNamesFull[selectedDate.getDay()]}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Semanal */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Vista Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">Tarea</th>
                      {weekDays.map((day) => (
                        <th key={day.toISOString()} className="p-2 text-center text-sm font-medium">
                          <div>{dayNames[day.getDay()]}</div>
                          <div className="text-xs text-muted-foreground">{day.getDate()}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {blueprintTasks
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((task) => (
                        <tr key={task.id} className="border-t">
                          <td className="p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{task.time}</Badge>
                              <span className="truncate max-w-[200px]">{task.title}</span>
                            </div>
                          </td>
                          {weekDays.map((day) => (
                            <td key={day.toISOString()} className="p-2 text-center">
                              <Checkbox
                                checked={isTaskCompleted(task.id, day)}
                                onCheckedChange={() => handleToggleTask(task.id, day)}
                                className="mx-auto"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Mensual - Heatmap */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Progreso - {selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Heatmap de días */}
              <div className="mb-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((d) => (
                    <div key={d} className="text-xs text-center text-muted-foreground p-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day) => {
                    const progress = calculateDayProgress(day);
                    const isToday = formatDateKey(day) === formatDateKey(new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "aspect-square rounded-sm flex items-center justify-center text-xs cursor-pointer transition-all",
                          progress === 100 && "bg-emerald-600 text-white",
                          progress >= 50 && progress < 100 && "bg-emerald-600/50 text-white",
                          progress > 0 && progress < 50 && "bg-emerald-600/25",
                          progress === 0 && "bg-muted",
                          isToday && "ring-2 ring-emerald-400"
                        )}
                        onClick={() => {
                          setSelectedDate(day);
                          setActiveView('daily');
                        }}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted"></div>
                  <span>Sin completar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-600/25"></div>
                  <span>Parcial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-600/50"></div>
                  <span>50%+</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-600"></div>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botón de Pánico */}
      <Card className="bg-gradient-to-r from-red-950 to-red-900 border-red-700">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-red-200 mb-2">Protocolo de Emergencia</h3>
            <p className="text-sm text-red-300 mb-4">
              ¿Tentación de paja, redes o pereza? ¡RESET!
            </p>
            <Button
              size="lg"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8"
              onClick={() => setShowPanicDialog(true)}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              BOTÓN DE PÁNICO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para agregar tarea */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Nombre de la tarea"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horario</label>
              <Input
                type="time"
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Descripción de la tarea"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Días de la semana</label>
              <p className="text-xs text-muted-foreground">Deja todos sin marcar para que aplique todos los días</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {dayNamesFull.map((day, index) => {
                  const isSelected = newTask.days?.includes(index) ?? false;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const currentDays = newTask.days || [];
                        if (isSelected) {
                          const newDays = currentDays.filter(d => d !== index);
                          setNewTask({ ...newTask, days: newDays.length > 0 ? newDays : undefined });
                        } else {
                          setNewTask({ ...newTask, days: [...currentDays, index] });
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm transition-colors",
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar tarea */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horario</label>
                <Input
                  type="time"
                  value={editingTask.time}
                  onChange={(e) => setEditingTask({ ...editingTask, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Días de la semana</label>
                <p className="text-xs text-muted-foreground">Deja todos sin marcar para que aplique todos los días</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dayNamesFull.map((day, index) => {
                    const isSelected = editingTask.days?.includes(index) ?? false;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const currentDays = editingTask.days || [];
                          if (isSelected) {
                            const newDays = currentDays.filter(d => d !== index);
                            setEditingTask({ ...editingTask, days: newDays.length > 0 ? newDays : undefined });
                          } else {
                            setEditingTask({ ...editingTask, days: [...currentDays, index] });
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm transition-colors",
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTask}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pánico */}
      <AlertDialog open={showPanicDialog} onOpenChange={setShowPanicDialog}>
        <AlertDialogContent className="bg-red-950 border-red-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-200 text-2xl text-center">
              ¡PROTOCOLO DE EMERGENCIA ACTIVADO!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-300 text-center text-lg">
              {panicLevel === 1 ? (
                <span className="font-bold">¡50 BURPEES AHORA MISMO!</span>
              ) : (
                <span className="font-bold">¡DUCHA DE AGUA FRÍA (3 MINUTOS)!</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2">
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (panicLevel === 1) {
                  setPanicLevel(2);
                } else {
                  setShowPanicDialog(false);
                  setPanicLevel(1);
                  setShowPanicAction(true);
                }
              }}
            >
              {panicLevel === 1 ? "SIGUIENTE NIVEL" : "ENTENDIDO"}
            </AlertDialogAction>
            <Button
              variant="outline"
              className="border-red-600 text-red-300"
              onClick={() => {
                setShowPanicDialog(false);
                setPanicLevel(1);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mensaje final del pánico */}
      <AlertDialog open={showPanicAction} onOpenChange={setShowPanicAction}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡BIEN HECHO!</AlertDialogTitle>
            <AlertDialogDescription>
              "No seas la empleada que se queja. Sé el hombre que cambia la cultura."
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowPanicAction(false)}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
