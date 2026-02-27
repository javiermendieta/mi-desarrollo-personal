'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Flower2,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Volume2,
  VolumeX,
  History,
  Clock,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';
import { MEDITATION_TYPES, YOGA_CATEGORIES } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { YogaExercise, MeditationSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function YogaMeditationModule() {
  const [yogaExercises, setYogaExercises] = useState<YogaExercise[]>([]);
  const [meditationSessions, setMeditationSessions] = useState<MeditationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Meditation state
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditationTime, setMeditationTime] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(5 * 60); // seconds
  const [selectedMeditationType, setSelectedMeditationType] = useState('mindfulness');
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Yoga dialog state
  const [isYogaDialogOpen, setIsYogaDialogOpen] = useState(false);
  const [editingYoga, setEditingYoga] = useState<YogaExercise | null>(null);
  const [yogaName, setYogaName] = useState('');
  const [yogaDescription, setYogaDescription] = useState('');
  const [yogaDuration, setYogaDuration] = useState('10');
  const [yogaDifficulty, setYogaDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [yogaCategory, setYogaCategory] = useState(YOGA_CATEGORIES[0]);

  // Meditation session dialog
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Load data from server
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [yogaRes, meditationRes] = await Promise.all([
        fetch('/api/yoga'),
        fetch('/api/meditation'),
      ]);
      
      const yogaData = await yogaRes.json();
      const meditationData = await meditationRes.json();

      if (yogaData.exercises) setYogaExercises(yogaData.exercises);
      if (meditationData.sessions) setMeditationSessions(meditationData.sessions);
    } catch (error) {
      console.error('Error loading yoga/meditation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Play bell sound
  const playBell = useCallback(() => {
    if (!soundEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 2);
  }, [soundEnabled]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isMeditating && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMeditating, isPaused, timeLeft]);

  // Handle meditation complete
  useEffect(() => {
    if (isMeditating && timeLeft === 0) {
      playBell();
      const timer = setTimeout(() => {
        setIsMeditating(false);
        setIsSessionDialogOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMeditating, timeLeft, playBell]);

  const startMeditation = () => {
    setTimeLeft(meditationTime * 60);
    setIsMeditating(true);
    setIsPaused(false);
    playBell();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetMeditation = () => {
    setIsMeditating(false);
    setIsPaused(false);
    setTimeLeft(meditationTime * 60);
  };

  const saveMeditationSession = async () => {
    setIsSaving(true);
    const session: MeditationSession = {
      id: uuidv4(),
      date: new Date().toISOString(),
      duration: meditationTime,
      type: selectedMeditationType as MeditationSession['type'],
      notes: sessionNotes || undefined,
      completed: true,
    };
    
    try {
      await fetch('/api/meditation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      setMeditationSessions([...meditationSessions, session]);
      
      // Track activity
      trackActivity('meditation', 'completed', `Meditación: ${meditationTime} minutos`, undefined, { type: selectedMeditationType, duration: meditationTime });
      
      setIsSessionDialogOpen(false);
      setSessionNotes('');
      resetMeditation();
    } catch (error) {
      console.error('Error saving meditation session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Yoga handlers
  const openYogaDialog = (exercise?: YogaExercise) => {
    if (exercise) {
      setEditingYoga(exercise);
      setYogaName(exercise.name);
      setYogaDescription(exercise.description);
      setYogaDuration(exercise.duration.toString());
      setYogaDifficulty(exercise.difficulty);
      setYogaCategory(exercise.category);
    } else {
      setEditingYoga(null);
      setYogaName('');
      setYogaDescription('');
      setYogaDuration('10');
      setYogaDifficulty('beginner');
      setYogaCategory(YOGA_CATEGORIES[0]);
    }
    setIsYogaDialogOpen(true);
  };

  const handleSaveYoga = async () => {
    if (!yogaName.trim()) return;
    setIsSaving(true);

    const exercise: YogaExercise = {
      id: editingYoga?.id || uuidv4(),
      name: yogaName,
      description: yogaDescription,
      duration: parseInt(yogaDuration) || 10,
      difficulty: yogaDifficulty,
      category: yogaCategory,
    };

    try {
      if (editingYoga) {
        await fetch('/api/yoga', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exercise),
        });
        setYogaExercises(yogaExercises.map(e => e.id === editingYoga.id ? exercise : e));
      } else {
        await fetch('/api/yoga', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exercise),
        });
        setYogaExercises([...yogaExercises, exercise]);
      }
      setIsYogaDialogOpen(false);
      resetYogaForm();
    } catch (error) {
      console.error('Error saving yoga exercise:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetYogaForm = () => {
    setYogaName('');
    setYogaDescription('');
    setYogaDuration('10');
    setYogaDifficulty('beginner');
    setYogaCategory(YOGA_CATEGORIES[0]);
    setEditingYoga(null);
  };

  const handleDeleteYoga = async (id: string) => {
    try {
      await fetch('/api/yoga', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setYogaExercises(yogaExercises.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting yoga exercise:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return '';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return difficulty;
    }
  };

  const recentMeditations = meditationSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="meditation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meditation">Meditación</TabsTrigger>
          <TabsTrigger value="yoga">Yoga</TabsTrigger>
        </TabsList>

        {/* Meditation Tab */}
        <TabsContent value="meditation" className="space-y-4">
          {/* Timer Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Flower2 className="h-5 w-5" />
                Timer de Meditación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isMeditating ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de meditación</Label>
                      <Select
                        value={selectedMeditationType}
                        onValueChange={setSelectedMeditationType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDITATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={meditationTime}
                        onChange={(e) => setMeditationTime(parseInt(e.target.value) || 5)}
                        min={1}
                        max={120}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 30].map((mins) => (
                      <Button
                        key={mins}
                        variant={meditationTime === mins ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMeditationTime(mins)}
                      >
                        {mins} min
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                      >
                        {soundEnabled ? (
                          <Volume2 className="h-5 w-5" />
                        ) : (
                          <VolumeX className="h-5 w-5" />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Sonido de campana {soundEnabled ? 'activado' : 'desactivado'}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={startMeditation}>
                    <Play className="h-5 w-5 mr-2" />
                    Comenzar Meditación
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  {/* Timer Display */}
                  <div className="text-center">
                    <div className="text-6xl sm:text-7xl font-bold tracking-tight">
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-muted-foreground mt-2">
                      {MEDITATION_TYPES.find((t) => t.value === selectedMeditationType)?.label}
                    </p>
                  </div>

                  {/* Progress */}
                  <Progress
                    value={((meditationTime * 60 - timeLeft) / (meditationTime * 60)) * 100}
                    className="h-2"
                  />

                  {/* Controls */}
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" size="lg" onClick={togglePause}>
                      {isPaused ? (
                        <Play className="h-5 w-5" />
                      ) : (
                        <Pause className="h-5 w-5" />
                      )}
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetMeditation}>
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Sound indicator */}
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4 mr-1" />
                      ) : (
                        <VolumeX className="h-4 w-4 mr-1" />
                      )}
                      {soundEnabled ? 'Sonido activo' : 'Sin sonido'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meditation History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Meditación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMeditations.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentMeditations.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">
                            {MEDITATION_TYPES.find((t) => t.value === session.type)?.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.date), "d MMM yyyy 'a las' HH:mm", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {session.duration} min
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay sesiones de meditación registradas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yoga Tab */}
        <TabsContent value="yoga" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Flower2 className="h-5 w-5" />
                  Ejercicios de Yoga
                </CardTitle>
                <Button size="sm" onClick={() => openYogaDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {yogaExercises.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {yogaExercises.map((exercise) => (
                    <Card key={exercise.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{exercise.name}</h3>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openYogaDialog(exercise)}
                            >
                              <Flower2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDeleteYoga(exercise.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {exercise.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{exercise.duration} min</Badge>
                          <Badge className={getDifficultyColor(exercise.difficulty)}>
                            {getDifficultyLabel(exercise.difficulty)}
                          </Badge>
                          <Badge variant="secondary">{exercise.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Flower2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Añade ejercicios de yoga para crear tu biblioteca personal
                  </p>
                  <Button onClick={() => openYogaDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir primer ejercicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yoga Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {YOGA_CATEGORIES.map((category) => {
                  const count = yogaExercises.filter((e) => e.category === category).length;
                  return (
                    <Badge key={category} variant="secondary">
                      {category} ({count})
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Yoga Exercise Dialog */}
      <Dialog open={isYogaDialogOpen} onOpenChange={setIsYogaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingYoga ? 'Editar Ejercicio' : 'Nuevo Ejercicio de Yoga'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={yogaName}
                onChange={(e) => setYogaName(e.target.value)}
                placeholder="Ej: Saludo al sol"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={yogaDescription}
                onChange={(e) => setYogaDescription(e.target.value)}
                placeholder="Describe el ejercicio..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={yogaDuration}
                  onChange={(e) => setYogaDuration(e.target.value)}
                  min={1}
                />
              </div>
              <div>
                <Label>Dificultad</Label>
                <Select
                  value={yogaDifficulty}
                  onValueChange={(v) =>
                    setYogaDifficulty(v as 'beginner' | 'intermediate' | 'advanced')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={yogaCategory} onValueChange={setYogaCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YOGA_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYogaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveYoga} disabled={!yogaName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Complete Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              ¡Meditación completada!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Has completado {meditationTime} minutos de{' '}
              {MEDITATION_TYPES.find((t) => t.value === selectedMeditationType)?.label}.
            </p>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="¿Cómo te sientes? ¿Qué pensamientos tuviste?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSessionDialogOpen(false);
                resetMeditation();
              }}
            >
              Omitir
            </Button>
            <Button onClick={saveMeditationSession} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
