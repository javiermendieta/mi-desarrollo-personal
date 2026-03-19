'use client';

import { useState, useEffect } from 'react';
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
  Dumbbell,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Play,
  History,
  Activity,
  Loader2,
} from 'lucide-react';
import { DEFAULT_SPORTS } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { Sport, WorkoutRoutine, Exercise, WorkoutSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SPORT_COLORS = [
  '#22c55e', '#3b82f6', '#06b6d4', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#ef4444',
];

export function SportsModule() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const [isSportDialogOpen, setIsSportDialogOpen] = useState(false);
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<{
    routineId: string;
    exercises: Exercise[];
    startTime: Date;
  } | null>(null);

  // Sport form
  const [sportName, setSportName] = useState('');
  const [sportIcon, setSportIcon] = useState('dumbbell');
  const [sportColor, setSportColor] = useState(SPORT_COLORS[0]);

  // Routine form
  const [routineName, setRoutineName] = useState('');

  // Exercise form
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseSets, setExerciseSets] = useState('3');
  const [exerciseReps, setExerciseReps] = useState('10');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Load sports from server
  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      const res = await fetch('/api/sports');
      const data = await res.json();
      if (data.sports) {
        setSports(data.sports.map((s: any) => ({
          ...s,
          routines: s.routines || [],
          sessions: s.sessions || [],
        })));
        if (data.sports.length > 0 && !activeSport) {
          setActiveSport(data.sports[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading sports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSport = sports.find((s) => s.id === activeSport);

  // Sport handlers
  const openSportDialog = (sport?: Sport) => {
    if (sport) {
      setEditingSport(sport);
      setSportName(sport.name);
      setSportIcon(sport.icon);
      setSportColor(sport.color);
    } else {
      setEditingSport(null);
      setSportName('');
      setSportIcon('dumbbell');
      setSportColor(SPORT_COLORS[0]);
    }
    setIsSportDialogOpen(true);
  };

  const handleSaveSport = async () => {
    if (!sportName.trim()) return;
    setIsSaving(true);

    const sportData = {
      name: sportName,
      icon: sportIcon,
      color: sportColor,
      isActive: true,
      routines: editingSport?.routines || [],
      sessions: editingSport?.sessions || [],
    };

    try {
      if (editingSport) {
        await fetch('/api/sports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSport.id, ...sportData }),
        });
        setSports(sports.map(s => s.id === editingSport.id ? { ...s, ...sportData } : s));
      } else {
        const newSport: Sport = {
          id: uuidv4(),
          ...sportData,
        };
        await fetch('/api/sports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSport),
        });
        setSports([...sports, newSport]);
        setActiveSport(newSport.id);
      }
      setIsSportDialogOpen(false);
      resetSportForm();
    } catch (error) {
      console.error('Error saving sport:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetSportForm = () => {
    setSportName('');
    setSportIcon('dumbbell');
    setSportColor(SPORT_COLORS[0]);
    setEditingSport(null);
  };

  const handleDeleteSport = async (id: string) => {
    try {
      await fetch('/api/sports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSports(sports.filter(s => s.id !== id));
      if (activeSport === id) {
        setActiveSport(sports.length > 1 ? sports.find(s => s.id !== id)?.id || null : null);
      }
    } catch (error) {
      console.error('Error deleting sport:', error);
    }
  };

  // Routine handlers
  const openRoutineDialog = (routine?: WorkoutRoutine, sportId?: string) => {
    if (routine) {
      setEditingRoutine(routine);
      setRoutineName(routine.name);
    } else {
      setEditingRoutine(null);
      setRoutineName('');
    }
    if (sportId) {
      setActiveSport(sportId);
    }
    setIsRoutineDialogOpen(true);
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim() || !activeSport) return;
    setIsSaving(true);

    const sport = sports.find(s => s.id === activeSport);
    if (!sport) return;

    try {
      if (editingRoutine) {
        const updatedRoutines = sport.routines.map(r =>
          r.id === editingRoutine.id ? { ...r, name: routineName } : r
        );
        await fetch('/api/sports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeSport, routines: updatedRoutines }),
        });
        setSports(sports.map(s => 
          s.id === activeSport ? { ...s, routines: updatedRoutines } : s
        ));
      } else {
        const newRoutine: WorkoutRoutine = {
          id: uuidv4(),
          name: routineName,
          exercises: [],
          createdAt: new Date().toISOString(),
        };
        const updatedRoutines = [...sport.routines, newRoutine];
        await fetch('/api/sports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeSport, routines: updatedRoutines }),
        });
        setSports(sports.map(s => 
          s.id === activeSport ? { ...s, routines: updatedRoutines } : s
        ));
      }
      setIsRoutineDialogOpen(false);
      resetRoutineForm();
    } catch (error) {
      console.error('Error saving routine:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetRoutineForm = () => {
    setRoutineName('');
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = async (sportId: string, routineId: string) => {
    const sport = sports.find(s => s.id === sportId);
    if (!sport) return;
    
    const updatedRoutines = sport.routines.filter(r => r.id !== routineId);
    
    try {
      await fetch('/api/sports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sportId, routines: updatedRoutines }),
      });
      setSports(sports.map(s => 
        s.id === sportId ? { ...s, routines: updatedRoutines } : s
      ));
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  // Exercise handlers
  const openExerciseDialog = (routineId: string, exercise?: Exercise) => {
    setCurrentRoutineId(routineId);
    if (exercise) {
      setEditingExercise(exercise);
      setExerciseName(exercise.name);
      setExerciseSets(exercise.sets.toString());
      setExerciseReps(exercise.reps.toString());
      setExerciseWeight(exercise.weight?.toString() || '');
      setExerciseNotes(exercise.notes || '');
    } else {
      setEditingExercise(null);
      setExerciseName('');
      setExerciseSets('3');
      setExerciseReps('10');
      setExerciseWeight('');
      setExerciseNotes('');
    }
    setIsExerciseDialogOpen(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseName.trim() || !currentRoutineId || !activeSport) return;
    setIsSaving(true);

    const sport = sports.find(s => s.id === activeSport);
    if (!sport) return;

    const routine = sport.routines.find(r => r.id === currentRoutineId);
    if (!routine) return;

    const exercise: Exercise = {
      id: editingExercise?.id || uuidv4(),
      name: exerciseName,
      sets: parseInt(exerciseSets) || 3,
      reps: parseInt(exerciseReps) || 10,
      weight: exerciseWeight ? parseFloat(exerciseWeight) : undefined,
      notes: exerciseNotes || undefined,
      completed: editingExercise?.completed || false,
    };

    let updatedExercises: Exercise[];
    if (editingExercise) {
      updatedExercises = routine.exercises.map(e =>
        e.id === editingExercise.id ? exercise : e
      );
    } else {
      updatedExercises = [...routine.exercises, exercise];
    }

    const updatedRoutines = sport.routines.map(r =>
      r.id === currentRoutineId ? { ...r, exercises: updatedExercises } : r
    );

    try {
      await fetch('/api/sports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeSport, routines: updatedRoutines }),
      });
      setSports(sports.map(s => 
        s.id === activeSport ? { ...s, routines: updatedRoutines } : s
      ));
      setIsExerciseDialogOpen(false);
      resetExerciseForm();
    } catch (error) {
      console.error('Error saving exercise:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetExerciseForm = () => {
    setExerciseName('');
    setExerciseSets('3');
    setExerciseReps('10');
    setExerciseWeight('');
    setExerciseNotes('');
    setEditingExercise(null);
    setCurrentRoutineId(null);
  };

  const deleteExercise = async (routineId: string, exerciseId: string) => {
    if (!activeSport) return;
    const sport = sports.find(s => s.id === activeSport);
    if (!sport) return;

    const routine = sport.routines.find(r => r.id === routineId);
    if (!routine) return;

    const updatedExercises = routine.exercises.filter(e => e.id !== exerciseId);
    const updatedRoutines = sport.routines.map(r =>
      r.id === routineId ? { ...r, exercises: updatedExercises } : r
    );

    try {
      await fetch('/api/sports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeSport, routines: updatedRoutines }),
      });
      setSports(sports.map(s => 
        s.id === activeSport ? { ...s, routines: updatedRoutines } : s
      ));
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  // Workout session handlers
  const startWorkout = (routineId: string) => {
    const routine = currentSport?.routines.find((r) => r.id === routineId);
    if (!routine || !activeSport) return;

    setActiveWorkout({
      routineId,
      exercises: routine.exercises.map((e) => ({ ...e, completed: false })),
      startTime: new Date(),
    });
    setIsWorkoutDialogOpen(true);
  };

  const toggleExerciseComplete = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((e) =>
        e.id === exerciseId ? { ...e, completed: !e.completed } : e
      ),
    });
  };

  const finishWorkout = async () => {
    if (!activeWorkout || !activeSport) return;

    const session: WorkoutSession = {
      id: uuidv4(),
      routineId: activeWorkout.routineId,
      sportId: activeSport,
      date: new Date().toISOString(),
      exercises: activeWorkout.exercises,
      duration: Math.round((new Date().getTime() - activeWorkout.startTime.getTime()) / 60000),
    };

    const sport = sports.find(s => s.id === activeSport);
    if (!sport) return;

    const routine = sport.routines.find(r => r.id === activeWorkout.routineId);
    const updatedSessions = [...sport.sessions, session];

    try {
      await fetch('/api/sports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeSport, sessions: updatedSessions }),
      });
      setSports(sports.map(s => 
        s.id === activeSport ? { ...s, sessions: updatedSessions } : s
      ));
      
      // Track activity
      trackActivity('sport', 'completed', `Entrenamiento: ${routine?.name || 'Rutina'} - ${session.duration} min`);
      
      setActiveWorkout(null);
      setIsWorkoutDialogOpen(false);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const getSportIcon = (icon: string) => {
    return <Dumbbell className="h-5 w-5" />;
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
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Deportes
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openSportDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Deporte
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sports Tabs */}
      {sports.length > 0 ? (
        <Tabs value={activeSport || undefined} onValueChange={setActiveSport}>
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            {sports.map((sport) => (
              <TabsTrigger
                key={sport.id}
                value={sport.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: sport.color,
                  borderLeftStyle: 'solid',
                }}
              >
                <div className="flex items-center gap-2">
                  {getSportIcon(sport.icon)}
                  <span>{sport.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {sports.map((sport) => (
            <TabsContent key={sport.id} value={sport.id} className="mt-4 space-y-4">
              {/* Sport Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openRoutineDialog(undefined, sport.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Rutina
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openSportDialog(sport)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar deporte?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminarán todas las rutinas y sesiones de este deporte.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSport(sport.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Routines */}
              {sport.routines.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {sport.routines.map((routine) => (
                    <Card key={routine.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{routine.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startWorkout(routine.id)}
                            >
                              <Play className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRoutine(sport.id, routine.id)}
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creada {format(new Date(routine.createdAt), 'd MMM yyyy', { locale: es })}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {routine.exercises.length > 0 ? (
                          <div className="space-y-2">
                            {routine.exercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{exercise.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {exercise.sets} series × {exercise.reps} reps
                                    {exercise.weight && ` · ${exercise.weight}kg`}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openExerciseDialog(routine.id, exercise)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => deleteExercise(routine.id, exercise.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Sin ejercicios
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => openExerciseDialog(routine.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Añadir ejercicio
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No tienes rutinas para {sport.name}
                    </p>
                    <Button onClick={() => openRoutineDialog(undefined, sport.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Crear primera rutina
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Session History */}
              {sport.sessions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Historial de sesiones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sport.sessions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map((session) => {
                          const routine = sport.routines.find((r) => r.id === session.routineId);
                          const completedExercises = session.exercises.filter((e) => e.completed).length;
                          return (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium text-sm">{routine?.name || 'Rutina'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(session.date), "d MMM yyyy 'a las' HH:mm", {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{session.duration} min</p>
                                <p className="text-xs text-muted-foreground">
                                  {completedExercises}/{session.exercises.length} ejercicios
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Comienza tu entrenamiento</h3>
            <p className="text-muted-foreground mb-6">
              Añade deportes para crear rutinas y registrar tus entrenamientos
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {DEFAULT_SPORTS.map((sport) => (
                <Button
                  key={sport.name}
                  variant="outline"
                  onClick={() => {
                    setSportName(sport.name);
                    setSportIcon(sport.icon);
                    setSportColor(sport.color);
                    setIsSportDialogOpen(true);
                  }}
                >
                  {sport.name}
                </Button>
              ))}
            </div>
            <Button onClick={() => openSportDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear deporte personalizado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sport Dialog */}
      <Dialog open={isSportDialogOpen} onOpenChange={setIsSportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSport ? 'Editar Deporte' : 'Nuevo Deporte'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={sportName}
                onChange={(e) => setSportName(e.target.value)}
                placeholder="Nombre del deporte"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1">
                {SPORT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      sportColor === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setSportColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSport} disabled={!sportName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Routine Dialog */}
      <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la rutina</Label>
              <Input
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Ej: Día de pecho"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoutineDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRoutine} disabled={!routineName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise Dialog */}
      <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del ejercicio</Label>
              <Input
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="Ej: Press de banca"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Series</Label>
                <Input
                  type="number"
                  value={exerciseSets}
                  onChange={(e) => setExerciseSets(e.target.value)}
                />
              </div>
              <div>
                <Label>Repeticiones</Label>
                <Input
                  type="number"
                  value={exerciseReps}
                  onChange={(e) => setExerciseReps(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Peso (kg) - Opcional</Label>
              <Input
                type="number"
                value={exerciseWeight}
                onChange={(e) => setExerciseWeight(e.target.value)}
                placeholder="Ej: 60"
              />
            </div>
            <div>
              <Label>Notas - Opcional</Label>
              <Textarea
                value={exerciseNotes}
                onChange={(e) => setExerciseNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExerciseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveExercise} disabled={!exerciseName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workout Session Dialog */}
      <Dialog open={isWorkoutDialogOpen} onOpenChange={setIsWorkoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrenamiento en curso</DialogTitle>
          </DialogHeader>
          {activeWorkout && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Iniciado: {format(activeWorkout.startTime, 'HH:mm')}
                </span>
                <span>
                  {Math.round((new Date().getTime() - activeWorkout.startTime.getTime()) / 60000)} min
                </span>
              </div>

              <div className="space-y-2">
                {activeWorkout.exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      exercise.completed ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950' : 'bg-muted/50'
                    }`}
                    onClick={() => toggleExerciseComplete(exercise.id)}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        exercise.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {exercise.completed && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${exercise.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {exercise.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.sets} × {exercise.reps}
                        {exercise.weight && ` · ${exercise.weight}kg`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {activeWorkout.exercises.filter((e) => e.completed).length}/
                  {activeWorkout.exercises.length} completados
                </Badge>
                <Progress
                  value={
                    (activeWorkout.exercises.filter((e) => e.completed).length /
                      activeWorkout.exercises.length) *
                    100
                  }
                  className="w-24"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={finishWorkout}>
              <Check className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
