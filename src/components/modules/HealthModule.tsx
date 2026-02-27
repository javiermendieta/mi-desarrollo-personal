'use client';

import { useState } from 'react';
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
import { Plus, Trash2, Droplets, Moon, Scale, Footprints, Heart, Activity, Flame } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { SleepLog, HydrationLog, HealthEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function HealthModule() {
  const {
    sleepLogs, addSleepLog, updateSleepLog, deleteSleepLog,
    hydrationLogs, addHydrationLog, updateHydrationLog, deleteHydrationLog,
    healthEntries, addHealthEntry, updateHealthEntry, deleteHealthEntry,
  } = useAppStore();

  const [sleepDialog, setSleepDialog] = useState(false);
  const [hydrationDialog, setHydrationDialog] = useState(false);
  const [healthDialog, setHealthDialog] = useState(false);

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Today's data
  const todaySleep = sleepLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === today);
  const todayHydration = hydrationLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === today);
  const todayHealth = healthEntries.find((e) => format(new Date(e.date), 'yyyy-MM-dd') === today);

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

  const handleSaveSleep = () => {
    const log: SleepLog = {
      id: uuidv4(),
      date: new Date(sleepDate).toISOString(),
      sleepTime,
      wakeTime,
      quality: sleepQuality as 1 | 2 | 3 | 4 | 5,
      notes: sleepNotes || undefined,
    };
    addSleepLog(log);
    setSleepDialog(false);
    setSleepTime('');
    setWakeTime('');
    setSleepQuality(3);
    setSleepNotes('');
    setSleepDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSaveHydration = () => {
    const log: HydrationLog = {
      id: uuidv4(),
      date: new Date(hydrationDate).toISOString(),
      glasses,
      target: 8,
    };
    addHydrationLog(log);
    setHydrationDialog(false);
    setGlasses(0);
    setHydrationDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSaveHealth = () => {
    const entry: HealthEntry = {
      id: uuidv4(),
      date: new Date(healthDate).toISOString(),
      weight: weight ? parseFloat(weight) : undefined,
      steps: steps ? parseInt(steps) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      notes: healthNotes || undefined,
    };
    addHealthEntry(entry);
    setHealthDialog(false);
    setWeight('');
    setSteps('');
    setCalories('');
    setHealthNotes('');
    setHealthDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const updateTodayHydration = (newGlasses: number) => {
    if (todayHydration) {
      updateHydrationLog(todayHydration.id, { glasses: newGlasses });
    } else {
      const log: HydrationLog = {
        id: uuidv4(),
        date: new Date().toISOString(),
        glasses: newGlasses,
        target: 8,
      };
      addHydrationLog(log);
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

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pasos Hoy</p>
                <p className="text-3xl font-bold text-rose-600">{todayHealth?.steps?.toLocaleString() || '-'}</p>
              </div>
              <Footprints className="h-10 w-10 text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calorías</p>
                <p className="text-3xl font-bold text-orange-600">{todayHealth?.calories || '-'}</p>
                {todayHealth?.weight && (
                  <p className="text-xs text-muted-foreground mt-1">{todayHealth.weight} kg</p>
                )}
              </div>
              <Flame className="h-10 w-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
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
    </div>
  );
}
