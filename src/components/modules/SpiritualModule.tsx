'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  CheckCircle, Plus, Trash2, Edit, Flame, Loader2, Clock, 
  ChevronLeft, ChevronRight, Heart, AlertTriangle, Settings,
  History, Sparkles, Calendar, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, subDays, subMonths, isSameDay, 
  isToday, getDay, subWeeks, addWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { SpiritualPractice, SpiritualPanicLog, SpiritualSettings, SpiritualLevel, SpiritualPracticeType } from '@/types';

// Catholic Cross Icon Component
function CrossIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      stroke="currentColor"
      strokeWidth="0.5"
    >
      <rect x="10" y="2" width="4" height="20" rx="0.5"/>
      <rect x="4" y="6" width="16" height="4" rx="0.5"/>
    </svg>
  );
}

// Default spiritual phrases
const DEFAULT_PHRASES = [
  "El Señor es mi pastor, nada me falta. - Salmo 23:1",
  "Todo lo puedo en Cristo que me fortalece. - Filipenses 4:13",
  "La fe es la certeza de lo que se espera. - Hebreos 11:1",
  "Dios es nuestro refugio y nuestra fortaleza. - Salmo 46:1",
  "Den gracias al Señor porque es bueno. - Salmo 118:1",
  "El amor es paciente, el amor es bondadoso. - 1 Corintios 13:4",
  "Vengan a mí todos los que están cansados. - Mateo 11:28",
  "Yo soy el camino, la verdad y la vida. - Juan 14:6",
  "Bienaventurados los de limpio corazón. - Mateo 5:8",
  "El Señor bendice al hogar del justo. - Proverbios 3:33",
  "Oren sin cesar. - 1 Tesalonicenses 5:17",
  "Busquen primero el reino de Dios. - Mateo 6:33",
  "El Señor es mi luz y mi salvación. - Salmo 27:1",
  "Confía en el Señor con todo tu corazón. - Proverbios 3:5",
  "Porque donde dos o tres se reúnen en mi nombre, allí estoy yo. - Mateo 18:20",
];

// Default practices based on level
const PRACTICE_TEMPLATES: Record<SpiritualLevel, Array<{name: string; type: SpiritualPracticeType; color: string; suggestedSchedule?: string}>> = {
  beginner: [
    { name: 'Oración matutina', type: 'morning_prayer', color: '#F59E0B', suggestedSchedule: '07:00' },
    { name: 'Oración nocturna', type: 'evening_prayer', color: '#3B82F6', suggestedSchedule: '21:00' },
    { name: 'Lectura bíblica', type: 'bible', color: '#10B981', suggestedSchedule: '08:00' },
  ],
  intermediate: [
    { name: 'Santo Rosario', type: 'rosary', color: '#8B5CF6', suggestedSchedule: '18:00' },
    { name: 'Oración matutina', type: 'morning_prayer', color: '#F59E0B', suggestedSchedule: '07:00' },
    { name: 'Oración nocturna', type: 'evening_prayer', color: '#3B82F6', suggestedSchedule: '21:00' },
    { name: 'Lectura bíblica', type: 'bible', color: '#10B981', suggestedSchedule: '08:00' },
    { name: 'Misa dominical', type: 'mass', color: '#EF4444' },
  ],
  advanced: [
    { name: 'Santo Rosario', type: 'rosary', color: '#8B5CF6', suggestedSchedule: '06:00' },
    { name: 'Oración matutina', type: 'morning_prayer', color: '#F59E0B', suggestedSchedule: '06:30' },
    { name: 'Oración del Angelus', type: 'angelus', color: '#EC4899', suggestedSchedule: '12:00' },
    { name: 'Oración nocturna', type: 'evening_prayer', color: '#3B82F6', suggestedSchedule: '21:00' },
    { name: 'Lectura bíblica', type: 'bible', color: '#10B981', suggestedSchedule: '07:00' },
    { name: 'Misa dominical', type: 'mass', color: '#EF4444' },
    { name: 'Adoración al Santísimo', type: 'adoration', color: '#6366F1' },
    { name: 'Confesión mensual', type: 'confession', color: '#14B8A6' },
  ],
  contemplative: [
    { name: 'Santo Rosario (misterios del día)', type: 'rosary', color: '#8B5CF6', suggestedSchedule: '06:00' },
    { name: 'Oración matutina (Liturgia de las Horas)', type: 'morning_prayer', color: '#F59E0B', suggestedSchedule: '05:30' },
    { name: 'Oración del Angelus', type: 'angelus', color: '#EC4899', suggestedSchedule: '12:00' },
    { name: 'Oración de la tarde (Vísperas)', type: 'liturgy', color: '#F97316', suggestedSchedule: '18:00' },
    { name: 'Oración nocturna (Completas)', type: 'evening_prayer', color: '#3B82F6', suggestedSchedule: '21:00' },
    { name: 'Lectura bíblica', type: 'bible', color: '#10B981', suggestedSchedule: '07:00' },
    { name: 'Misa diaria', type: 'mass', color: '#EF4444', suggestedSchedule: '08:00' },
    { name: 'Adoración al Santísimo', type: 'adoration', color: '#6366F1', suggestedSchedule: '17:00' },
    { name: 'Coronilla de la Divina Misericordia', type: 'chaplet', color: '#A855F7', suggestedSchedule: '15:00' },
    { name: 'Confesión mensual', type: 'confession', color: '#14B8A6' },
    { name: 'Vía Crucis (Cuaresma)', type: 'via_crucis', color: '#78716C' },
    { name: 'Ayuno', type: 'fasting', color: '#64748B' },
  ],
};

const LEVEL_INFO: Record<SpiritualLevel, { name: string; description: string }> = {
  beginner: { name: 'Principiante', description: 'Comenzando tu camino de fe' },
  intermediate: { name: 'Intermedio', description: 'Creciendo en la oración diaria' },
  advanced: { name: 'Avanzado', description: 'Vida de oración establecida' },
  contemplative: { name: 'Contemplativo', description: 'Vida consagrada a la oración' },
};

// Panic messages
const PANIC_MESSAGES = [
  "Recuerda que Dios te ama incondicionalmente. Su misericordia es infinita y siempre está disponible para ti.",
  "Este momento pasará. El Señor está contigo en cada paso del camino. 'No temas, yo estoy contigo' - Isaías 41:10",
  "Respira profundo. El Espíritu Santo habita en ti. Pide su paz y consuelo en este momento.",
  "Eres hijo/a de Dios, amado/a y valioso/a. Nada puede separarte de su amor. - Romanos 8:38-39",
  "María, nuestra Madre, intercede por ti. Confía en su protección maternal.",
  "Jesús dijo: 'La paz les dejo, mi paz les doy'. Acepta esa paz ahora en tu corazón. - Juan 14:27",
  "Dios no nos dio un espíritu de temor, sino de poder, amor y dominio propio. - 2 Timoteo 1:7",
  "Encomienda al Señor tu camino, confía en él, y él hará. - Salmo 37:5",
  "El Señor es bueno con todos; él tiene compasión de todo lo que creó. - Salmo 145:9",
  "Venid a mí todos los que estáis fatigados y sobrecargados, y yo os daré descanso. - Mateo 11:28",
];

export function SpiritualModule() {
  const [practices, setPractices] = useState<SpiritualPractice[]>([]);
  const [panicLogs, setPanicLogs] = useState<SpiritualPanicLog[]>([]);
  const [settings, setSettings] = useState<SpiritualSettings>({ level: 'beginner', phrases: [] });
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [currentPhrase, setCurrentPhrase] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPractice, editingSetPractice] = useState<SpiritualPractice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [isPanicHistoryOpen, setIsPanicHistoryOpen] = useState(false);
  const [panicNotes, setPanicNotes] = useState('');
  
  const [practiceName, setPracticeName] = useState('');
  const [practiceType, setPracticeType] = useState<SpiritualPracticeType>('custom');
  const [practiceColor, setPracticeColor] = useState('#8B5CF6');
  const [practiceSchedule, setPracticeSchedule] = useState('');

  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Set random phrase when data loads
  useEffect(() => {
    const phrases = settings.phrases && settings.phrases.length > 0 
      ? settings.phrases 
      : DEFAULT_PHRASES;
    const randomIndex = Math.floor(Math.random() * phrases.length);
    setCurrentPhrase(phrases[randomIndex]);
  }, [settings.phrases, activeTab]); // Rotate on tab change too

  const loadData = async () => {
    try {
      const res = await fetch('/api/spiritual');
      const data = await res.json();
      if (data.practices) {
        setPractices(data.practices.map((p: any) => ({
          ...p,
          logs: p.logs || [],
          createdAt: p.createdAt?.toString() || new Date().toISOString(),
        })));
      }
      if (data.panicLogs) {
        setPanicLogs(data.panicLogs.map((l: any) => ({
          ...l,
          date: l.date?.toString() || new Date().toISOString(),
          createdAt: l.createdAt?.toString() || new Date().toISOString(),
        })));
      }
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading spiritual data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (practice?: SpiritualPractice) => {
    if (practice) {
      editingSetPractice(practice);
      setPracticeName(practice.name);
      setPracticeType(practice.type);
      setPracticeColor(practice.color);
      setPracticeSchedule(practice.schedule || '');
    } else {
      editingSetPractice(null);
      setPracticeName('');
      setPracticeType('custom');
      setPracticeColor('#8B5CF6');
      setPracticeSchedule('');
    }
    setIsDialogOpen(true);
  };

  const handleSavePractice = async () => {
    if (!practiceName.trim()) return;
    setIsSaving(true);

    try {
      if (editingPractice) {
        const res = await fetch('/api/spiritual', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPractice.id,
            name: practiceName,
            type: practiceType,
            color: practiceColor,
            schedule: practiceSchedule || null,
          }),
        });
        
        if (!res.ok) throw new Error('Error al actualizar');
        
        setPractices(practices.map(p => p.id === editingPractice.id ? { 
          ...p, 
          name: practiceName,
          type: practiceType,
          color: practiceColor,
          schedule: practiceSchedule || undefined,
        } : p));
      } else {
        const newPractice = {
          id: uuidv4(),
          name: practiceName,
          type: practiceType,
          icon: 'cross',
          color: practiceColor,
          schedule: practiceSchedule || null,
          isActive: true,
          logs: [],
        };
        
        const res = await fetch('/api/spiritual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPractice),
        });
        
        if (!res.ok) throw new Error('Error al crear');
        
        const data = await res.json();
        setPractices([...practices, data.practice]);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving practice:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setPracticeName('');
    setPracticeType('custom');
    setPracticeColor('#8B5CF6');
    setPracticeSchedule('');
    editingSetPractice(null);
  };

  const togglePracticeLog = async (practiceId: string, dateStr: string, completed: boolean) => {
    const practice = practices.find(p => p.id === practiceId);
    if (!practice) return;

    const existingLogIndex = practice.logs.findIndex(l => l.date === dateStr);
    let newLogs;
    
    if (existingLogIndex >= 0) {
      newLogs = [...practice.logs];
      newLogs[existingLogIndex] = { date: dateStr, completed };
    } else {
      newLogs = [...practice.logs, { date: dateStr, completed }];
    }

    setPractices(practices.map(p => 
      p.id === practiceId ? { ...p, logs: newLogs } : p
    ));

    try {
      await fetch('/api/spiritual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: practiceId, logs: newLogs }),
      });
    } catch (error) {
      console.error('Error updating practice log:', error);
    }
  };

  const handleDeletePractice = async (id: string) => {
    try {
      await fetch('/api/spiritual', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setPractices(practices.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting practice:', error);
    }
  };

  const handlePanicButton = async () => {
    const randomMessage = PANIC_MESSAGES[Math.floor(Math.random() * PANIC_MESSAGES.length)];
    
    try {
      const res = await fetch('/api/spiritual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          type: 'panic',
          message: randomMessage,
          notes: panicNotes || null,
        }),
      });
      
      const data = await res.json();
      setPanicLogs([data.panicLog, ...panicLogs]);
      setCurrentPhrase(randomMessage);
      setIsPanicOpen(true);
      setPanicNotes('');
    } catch (error) {
      console.error('Error creating panic log:', error);
    }
  };

  const updateLevel = async (level: SpiritualLevel) => {
    try {
      await fetch('/api/spiritual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateType: 'settings',
          level,
          phrases: settings.phrases,
        }),
      });
      setSettings({ ...settings, level });
    } catch (error) {
      console.error('Error updating level:', error);
    }
  };

  const initializeLevelPractices = async () => {
    const templates = PRACTICE_TEMPLATES[settings.level];
    const newPractices = templates.map(t => ({
      id: uuidv4(),
      name: t.name,
      type: t.type,
      icon: 'cross',
      color: t.color,
      schedule: t.suggestedSchedule || null,
      isActive: true,
      logs: [],
    }));

    for (const practice of newPractices) {
      try {
        await fetch('/api/spiritual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(practice),
        });
      } catch (error) {
        console.error('Error creating practice:', error);
      }
    }

    setPractices([...practices, ...newPractices]);
  };

  const getPracticeStreak = (practice: SpiritualPractice) => {
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const log = practice.logs.find(l => l.date === dateStr);
      if (log?.completed) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
    return streak;
  };

  const isPracticeCompletedOnDate = (practice: SpiritualPractice, dateStr: string) => {
    return practice.logs.some(l => l.date === dateStr && l.completed);
  };

  const activePractices = practices.filter(p => p.isActive);
  const practicesCompletedToday = activePractices.filter(p => 
    p.logs.some(l => l.date === todayStr && l.completed)
  );

  // Weekly calculations
  const currentWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  // Monthly calculations
  const currentMonth = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monthly stats
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
      const completedCount = activePractices.filter(p => isPracticeCompletedOnDate(p, dateStr)).length;
      
      stats.totalCompletions += completedCount;
      stats.totalPossible += activePractices.length;

      if (completedCount === activePractices.length && activePractices.length > 0) {
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
  }, [monthDays, activePractices]);

  const getDayIntensity = (dateStr: string) => {
    if (activePractices.length === 0) return 0;
    const completedCount = activePractices.filter(p => isPracticeCompletedOnDate(p, dateStr)).length;
    const ratio = completedCount / activePractices.length;
    if (ratio === 0) return 0;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = [
      'bg-muted/30',
      'bg-violet-200 dark:bg-violet-900/40',
      'bg-violet-300 dark:bg-violet-800/50',
      'bg-violet-400 dark:bg-violet-700/60',
      'bg-violet-500 dark:bg-violet-600',
    ];
    return colors[intensity];
  };

  // Practice colors for picker
  const PRACTICE_COLORS = [
    '#8B5CF6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#A855F7',
    '#64748B', '#78716C', '#84CC16', '#06B6D4', '#D946EF'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card with Catholic Cross */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <CrossIcon className="h-6 w-6 text-violet-500" />
              Vida Espiritual
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-1" />
                Nivel: {LEVEL_INFO[settings.level].name}
              </Button>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Práctica
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Rotating Phrase */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800 mb-4">
            <p className="text-center text-sm italic text-violet-700 dark:text-violet-300">
              "{currentPhrase}"
            </p>
          </div>

          {/* Daily Progress & Panic Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm">Progreso de hoy</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">{practicesCompletedToday.length}/{activePractices.length}</span>
                <Progress value={activePractices.length > 0 ? (practicesCompletedToday.length / activePractices.length) * 100 : 0} className="h-2 flex-1" />
              </div>
            </div>
            
            {/* Panic Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handlePanicButton}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Botón de Pánico
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Paz, el Señor está contigo
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <p className="text-muted-foreground mb-4">{currentPhrase}</p>
                  <div className="text-sm text-muted-foreground">
                    Has usado este botón <strong>{panicLogs.length}</strong> veces.
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cerrar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setIsPanicOpen(false); setIsPanicHistoryOpen(true); }}>
                    <History className="h-4 w-4 mr-2" />
                    Ver historial
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {activePractices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CrossIcon className="h-16 w-16 mx-auto text-violet-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Comienza tu vida espiritual</h3>
            <p className="text-muted-foreground mb-4">
              Nivel actual: <strong>{LEVEL_INFO[settings.level].name}</strong> - {LEVEL_INFO[settings.level].description}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={initializeLevelPractices}>
                <Sparkles className="h-4 w-4 mr-2" />
                Inicializar prácticas sugeridas
              </Button>
              <Button variant="outline" onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear práctica personalizada
              </Button>
            </div>
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
            {activePractices.map((practice) => {
              const isCompletedToday = practice.logs.some(l => l.date === todayStr && l.completed);
              const streak = getPracticeStreak(practice);

              return (
                <Card key={practice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isCompletedToday ? 'text-white' : 'border-2 hover:border-primary'
                        }`}
                        style={{
                          backgroundColor: isCompletedToday ? practice.color : undefined,
                          borderColor: isCompletedToday ? undefined : practice.color,
                        }}
                        onClick={() => togglePracticeLog(practice.id, todayStr, !isCompletedToday)}
                      >
                        {isCompletedToday && <CrossIcon className="h-5 w-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{practice.name}</p>
                          {practice.schedule && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              {practice.schedule}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{practice.type.replace('_', ' ')}</p>
                      </div>
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
                          <Flame className="h-5 w-5" />
                          <span className="font-bold">{streak}</span>
                        </div>
                      )}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(practice)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar práctica?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePractice(practice.id)}>Eliminar</AlertDialogAction>
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

                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      <div className="p-2 text-sm font-medium text-muted-foreground"></div>
                      {weekDays.map(day => (
                        <div key={day.toISOString()} className={cn(
                          "p-2 text-center text-sm font-medium",
                          isToday(day) && "text-violet-600"
                        )}>
                          <div>{format(day, 'EEE', { locale: es })}</div>
                          <div className={cn("text-xs", isToday(day) && "font-bold")}>{format(day, 'd')}</div>
                        </div>
                      ))}
                    </div>

                    {activePractices.map(practice => (
                      <div key={practice.id} className="grid grid-cols-8 gap-1 mb-1">
                        <div className="p-2 flex items-center min-w-0">
                          <div 
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: practice.color }}
                          />
                          <span className="text-sm truncate">{practice.name}</span>
                        </div>
                        {weekDays.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const isCompleted = isPracticeCompletedOnDate(practice, dateStr);
                          const isFuture = day > new Date();
                          const isClickable = !isFuture || isToday(day);
                          
                          return (
                            <button
                              key={dateStr}
                              disabled={!isClickable}
                              onClick={() => isClickable && togglePracticeLog(practice.id, dateStr, !isCompleted)}
                              className={cn(
                                "h-10 rounded-md flex items-center justify-center transition-all",
                                isFuture && !isToday(day) && "bg-muted/20 opacity-50",
                                !isFuture && !isCompleted && "bg-muted/50 hover:bg-muted",
                                isCompleted && "text-white",
                                isClickable && "cursor-pointer hover:scale-105"
                              )}
                              style={isCompleted ? { backgroundColor: practice.color } : {}}
                            >
                              {isCompleted && <CrossIcon className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}

                    <div className="grid grid-cols-8 gap-1 mt-4 pt-4 border-t">
                      <div className="p-2 text-sm font-medium">Total</div>
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const completed = activePractices.filter(p => isPracticeCompletedOnDate(p, dateStr)).length;
                        const isFuture = day > new Date();
                        
                        return (
                          <div key={dateStr} className="p-2 text-center">
                            <span className={cn(
                              "text-sm font-medium",
                              isFuture && "text-muted-foreground/50",
                              !isFuture && completed === activePractices.length && activePractices.length > 0 && "text-violet-600"
                            )}>
                              {completed}/{activePractices.length}
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-violet-600">{monthlyStats.perfectDays}</div>
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

                {/* Heatmap */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Actividad del mes</p>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: (getDay(monthStart) + 6) % 7 }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-6 h-6"></div>
                    ))}
                    
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
                            isToday(day) && "ring-2 ring-violet-500 ring-offset-1"
                          )}
                          title={`${format(day, 'd MMM', { locale: es })}: ${activePractices.filter(p => isPracticeCompletedOnDate(p, dateStr)).length}/${activePractices.length} prácticas`}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1">Menos</span>
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={cn("w-4 h-4 rounded-sm", getIntensityColor(i))} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">Más</span>
                  </div>
                </div>

                {/* Per practice stats */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Desglose por práctica</p>
                  <div className="space-y-2">
                    {activePractices.map(practice => {
                      const completed = monthDays.filter(day => 
                        isPracticeCompletedOnDate(practice, format(day, 'yyyy-MM-dd'))
                      ).length;
                      const percentage = Math.round((completed / monthDays.length) * 100);
                      const streak = getPracticeStreak(practice);
                      
                      return (
                        <div key={practice.id} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: practice.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm truncate">{practice.name}</span>
                              <div className="flex items-center gap-2">
                                {streak > 0 && (
                                  <span className="text-xs text-orange-500 flex items-center">
                                    <Flame className="h-3 w-3 mr-1" />{streak}
                                  </span>
                                )}
                                <span className="text-sm text-muted-foreground ml-2">
                                  {completed}/{monthDays.length} ({percentage}%)
                                </span>
                              </div>
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

      {/* Practice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPractice ? 'Editar Práctica' : 'Nueva Práctica Espiritual'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={practiceName} onChange={(e) => setPracticeName(e.target.value)} placeholder="Ej: Santo Rosario" />
            </div>
            <div>
              <Label>Tipo de práctica</Label>
              <Select value={practiceType} onValueChange={(v) => setPracticeType(v as SpiritualPracticeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rosary">Santo Rosario</SelectItem>
                  <SelectItem value="morning_prayer">Oración matutina</SelectItem>
                  <SelectItem value="evening_prayer">Oración nocturna</SelectItem>
                  <SelectItem value="mass">Misa</SelectItem>
                  <SelectItem value="confession">Confesión</SelectItem>
                  <SelectItem value="bible">Lectura bíblica</SelectItem>
                  <SelectItem value="adoration">Adoración al Santísimo</SelectItem>
                  <SelectItem value="fasting">Ayuno</SelectItem>
                  <SelectItem value="via_crucis">Vía Crucis</SelectItem>
                  <SelectItem value="angelus">Angelus</SelectItem>
                  <SelectItem value="chaplet">Coronilla</SelectItem>
                  <SelectItem value="liturgy">Liturgia de las Horas</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horario sugerido</Label>
              <Input 
                type="time" 
                value={practiceSchedule} 
                onChange={(e) => setPracticeSchedule(e.target.value)} 
                className="w-full"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {PRACTICE_COLORS.map((c) => (
                  <button 
                    key={c} 
                    type="button" 
                    className={`w-8 h-8 rounded-full border-2 ${practiceColor === c ? 'border-foreground' : 'border-transparent'}`} 
                    style={{ backgroundColor: c }} 
                    onClick={() => setPracticeColor(c)} 
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePractice} disabled={!practiceName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración Espiritual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nivel espiritual</Label>
              <Select value={settings.level} onValueChange={(v) => updateLevel(v as SpiritualLevel)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{info.name}</div>
                        <div className="text-xs text-muted-foreground">{info.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">{LEVEL_INFO[settings.level].name}</p>
              <p className="text-xs text-muted-foreground">{LEVEL_INFO[settings.level].description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Prácticas sugeridas: {PRACTICE_TEMPLATES[settings.level].length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cerrar</Button>
            {activePractices.length === 0 && (
              <Button onClick={() => { setIsSettingsOpen(false); initializeLevelPractices(); }}>
                Inicializar prácticas
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Panic History Dialog */}
      <Dialog open={isPanicHistoryOpen} onOpenChange={setIsPanicHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial del Botón de Pánico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {panicLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No hay registros aún</p>
            ) : (
              panicLogs.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{log.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.date), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground italic mt-1">Nota: {log.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPanicHistoryOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
