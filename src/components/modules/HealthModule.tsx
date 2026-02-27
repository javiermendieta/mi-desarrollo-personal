'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Droplets, Moon, Scale, Footprints, Loader2 } from 'lucide-react';
import type { SleepLog, HydrationLog, HealthEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export function HealthModule() {
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sleepDialog, setSleepDialog] = useState(false);
  const [hydrationDialog, setHydrationDialog] = useState(false);
  const [healthDialog, setHealthDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3);

  const [glasses, setGlasses] = useState(0);

  const [weight, setWeight] = useState('');
  const [steps, setSteps] = useState('');
  const [calories, setCalories] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sleepRes, hydrationRes, healthRes] = await Promise.all([
        fetch('/api/sleep'),
        fetch('/api/hydration'),
        fetch('/api/health'),
      ]);
      
      const sleepData = await sleepRes.json();
      const hydrationData = await hydrationRes.json();
      const healthData = await healthRes.json();

      if (sleepData.logs) setSleepLogs(sleepData.logs);
      if (hydrationData.logs) setHydrationLogs(hydrationData.logs);
      if (healthData.entries) setHealthEntries(healthData.entries);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const todaySleep = sleepLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === today);
  const todayHydration = hydrationLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === today);
  const todayHealth = healthEntries.find((e) => format(new Date(e.date), 'yyyy-MM-dd') === today);

  const avgQuality = sleepLogs.length > 0 ? Math.round(sleepLogs.reduce((a, l) => a + l.quality, 0) / sleepLogs.length) : 0;
  const avgGlasses = hydrationLogs.length > 0 ? Math.round(hydrationLogs.reduce((a, l) => a + l.glasses, 0) / hydrationLogs.length) : 0;

  const handleSaveSleep = async () => {
    setIsSaving(true);
    try {
      const log = { id: uuidv4(), date: new Date().toISOString(), sleepTime, wakeTime, quality: sleepQuality, notes: '' };
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      setSleepLogs([...sleepLogs, log]);
      setSleepDialog(false);
      setSleepTime(''); setWakeTime(''); setSleepQuality(3);
    } catch (error) {
      console.error('Error saving sleep:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHydration = async () => {
    setIsSaving(true);
    try {
      const log = { id: uuidv4(), date: new Date().toISOString(), glasses, target: 8 };
      await fetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      setHydrationLogs([...hydrationLogs, log]);
      setHydrationDialog(false);
      setGlasses(0);
    } catch (error) {
      console.error('Error saving hydration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHealth = async () => {
    setIsSaving(true);
    try {
      const entry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        weight: weight ? parseFloat(weight) : null,
        steps: steps ? parseInt(steps) : null,
        calories: calories ? parseInt(calories) : null,
        notes: ''
      };
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      setHealthEntries([...healthEntries, entry]);
      setHealthDialog(false);
      setWeight(''); setSteps(''); setCalories('');
    } catch (error) {
      console.error('Error saving health:', error);
    } finally {
      setIsSaving(false);
    }
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Moon className="h-5 w-5 text-indigo-500" />Sueño</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center mb-4"><p className="text-3xl font-bold">{todaySleep?.quality || '-'}</p><p className="text-sm text-muted-foreground">Calidad hoy</p></div>
            <div className="flex justify-between text-sm text-muted-foreground mb-4"><span>Promedio: {avgQuality}/5</span>{todaySleep && <span>{todaySleep.sleepTime} - {todaySleep.wakeTime}</span>}</div>
            <Button className="w-full" onClick={() => setSleepDialog(true)}><Plus className="h-4 w-4 mr-2" /> Registrar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Droplets className="h-5 w-5 text-blue-500" />Hidratación</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center mb-4"><p className="text-3xl font-bold">{todayHydration?.glasses || 0}/8</p><p className="text-sm text-muted-foreground">Vasos hoy</p></div>
            <Progress value={((todayHydration?.glasses || 0) / 8) * 100} className="mb-4" />
            <p className="text-sm text-muted-foreground text-center mb-4">Promedio: {avgGlasses} vasos/día</p>
            <Button className="w-full" onClick={() => setHydrationDialog(true)}><Plus className="h-4 w-4 mr-2" /> Registrar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-rose-500" />Salud</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Peso</span><span className="font-medium">{todayHealth?.weight ? `${todayHealth.weight} kg` : '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1"><Footprints className="h-4 w-4" /> Pasos</span><span className="font-medium">{todayHealth?.steps?.toLocaleString() || '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Calorías</span><span className="font-medium">{todayHealth?.calories || '-'}</span></div>
            </div>
            <Button className="w-full" onClick={() => setHealthDialog(true)}><Plus className="h-4 w-4 mr-2" /> Registrar</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Resumen de la semana</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold">{sleepLogs.length}</p><p className="text-sm text-muted-foreground">Registros de sueño</p></div>
            <div><p className="text-2xl font-bold">{hydrationLogs.length}</p><p className="text-sm text-muted-foreground">Registros de agua</p></div>
            <div><p className="text-2xl font-bold">{healthEntries.length}</p><p className="text-sm text-muted-foreground">Registros de salud</p></div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={sleepDialog} onOpenChange={setSleepDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar sueño</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora de dormir</Label><Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} /></div>
              <div><Label>Hora de despertar</Label><Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} /></div>
            </div>
            <div><Label>Calidad: {sleepQuality}/5</Label><input type="range" min="1" max="5" value={sleepQuality} onChange={(e) => setSleepQuality(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSleepDialog(false)}>Cancelar</Button><Button onClick={handleSaveSleep} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hydrationDialog} onOpenChange={setHydrationDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar hidratación</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Vasos de agua hoy</Label><Input type="number" min="0" max="20" value={glasses} onChange={(e) => setGlasses(parseInt(e.target.value) || 0)} /></div>
            <p className="text-sm text-muted-foreground">Meta: 8 vasos por día</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHydrationDialog(false)}>Cancelar</Button><Button onClick={handleSaveHydration} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={healthDialog} onOpenChange={setHealthDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar salud</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
            <div><Label>Pasos</Label><Input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} /></div>
            <div><Label>Calorías</Label><Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHealthDialog(false)}>Cancelar</Button><Button onClick={handleSaveHealth} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
