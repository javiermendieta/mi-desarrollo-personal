'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Volume2,
  VolumeX,
  History,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { MEDITATION_TYPES } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { MeditationSession } from '@/types';
import { useAppStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function YogaMeditationModule() {
  const { meditationSessions, addMeditationSession } = useAppStore();

  // Meditation state
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditationTime, setMeditationTime] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(5 * 60); // seconds
  const [selectedMeditationType, setSelectedMeditationType] = useState('mindfulness');
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Meditation session dialog
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

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

  const saveMeditationSession = () => {
    const session: MeditationSession = {
      id: uuidv4(),
      date: new Date().toISOString(),
      duration: meditationTime,
      type: selectedMeditationType as MeditationSession['type'],
      notes: sessionNotes || undefined,
      completed: true,
    };
    
    addMeditationSession(session);
    
    // Track activity
    trackActivity('meditation', 'completed', `Meditación: ${meditationTime} minutos`, undefined, { type: selectedMeditationType, duration: meditationTime });
    
    setIsSessionDialogOpen(false);
    setSessionNotes('');
    resetMeditation();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const recentMeditations = meditationSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Stats
  const totalMinutes = meditationSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalSessions = meditationSessions.length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sesiones Totales</p>
                <p className="text-3xl font-bold text-purple-600">{totalSessions}</p>
              </div>
              <Sparkles className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Minutos Totales</p>
                <p className="text-3xl font-bold text-indigo-600">{totalMinutes}</p>
              </div>
              <Clock className="h-10 w-10 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

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

              <div className="flex gap-2 flex-wrap">
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
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{session.notes}"</p>
                    )}
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
            <Button onClick={saveMeditationSession}>
              Guardar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
