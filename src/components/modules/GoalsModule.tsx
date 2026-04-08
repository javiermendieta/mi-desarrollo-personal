'use client';

import { useState, useEffect } from 'react';
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
  Target,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  Calendar,
  TrendingUp,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { GOAL_CATEGORIES, GOAL_TIMEFRAMES } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { Goal, GoalCategory, GoalTimeframe } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function GoalsModule() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('short');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);

  // Load goals from server
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      if (data.goals) {
        setGoals(data.goals.map((g: any) => ({
          ...g,
          deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : null,
          createdAt: g.createdAt?.toString() || new Date().toISOString(),
        })));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setTitle(goal.title);
      setDescription(goal.description || '');
      setTimeframe(goal.timeframe);
      setCategory(goal.category);
      setDeadline(goal.deadline || '');
      setProgress(goal.progress);
    } else {
      setEditingGoal(null);
      setTitle('');
      setDescription('');
      setTimeframe('short');
      setCategory('personal');
      setDeadline('');
      setProgress(0);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);

    const goalData: Partial<Goal> = {
      title,
      description: description || undefined,
      timeframe,
      category,
      deadline: deadline || undefined,
      progress,
      isCompleted: progress >= 100,
    };

    try {
      if (editingGoal) {
        await fetch('/api/goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingGoal.id, ...goalData }),
        });
        setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g));
        // Track activity if goal is completed
        if (progress >= 100 && editingGoal.progress < 100) {
          trackActivity('goal', 'completed', `Meta completada: ${title}`, editingGoal.id);
        } else if (progress > editingGoal.progress) {
          trackActivity('goal', 'progress', `Meta: ${title} (${progress}%)`, editingGoal.id);
        }
      } else {
        const newGoal: Goal = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          milestones: [],
          ...goalData,
        } as Goal;
        
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGoal),
        });
        setGoals([...goals, newGoal]);
        // Track activity
        trackActivity('goal', 'created', `Nueva meta: ${title}`);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setGoals(goals.filter(g => g.id !== id));
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTimeframe('short');
    setCategory('personal');
    setDeadline('');
    setProgress(0);
    setEditingGoal(null);
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const getCategoryLabel = (cat: GoalCategory) => GOAL_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  const getTimeframeLabel = (tf: GoalTimeframe) => GOAL_TIMEFRAMES.find((t) => t.value === tf)?.label || tf;
  const getDaysRemaining = (d: string) => differenceInDays(parseISO(d), new Date());

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
              <Target className="h-5 w-5" />
              Mis Metas
            </CardTitle>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Meta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{completedGoals.length}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {activeGoals.length > 0 ? Math.round(activeGoals.reduce((acc, g) => acc + g.progress, 0) / activeGoals.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Progreso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeGoals.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Metas activas</h3>
          {activeGoals.map((goal) => (
            <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedGoal(goal); setIsDetailOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{goal.title}</p>
                      <Badge variant="outline">{getCategoryLabel(goal.category)}</Badge>
                    </div>
                    {goal.description && <p className="text-sm text-muted-foreground line-clamp-1">{goal.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary">{getTimeframeLabel(goal.timeframe)}</Badge>
                      {goal.deadline && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getDaysRemaining(goal.deadline) > 0 ? `${getDaysRemaining(goal.deadline)} días` : getDaysRemaining(goal.deadline) === 0 ? '¡Hoy!' : 'Vencida'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Define tus metas</h3>
            <p className="text-muted-foreground mb-6">Establece metas claras para alcanzar tus objetivos</p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera meta
            </Button>
          </CardContent>
        </Card>
      )}

      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Metas completadas
          </h3>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="bg-emerald-50 dark:bg-emerald-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-full">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">Completada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué quieres lograr?" /></div>
            <div><Label>Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plazo</Label>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as GoalTimeframe)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GOAL_TIMEFRAMES.map((tf) => (<SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GOAL_CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Fecha límite</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
            {editingGoal && (
              <div><Label>Progreso: {progress}%</Label><input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(parseInt(e.target.value))} className="w-full" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{selectedGoal?.title}</DialogTitle></DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              {selectedGoal.description && <p className="text-muted-foreground">{selectedGoal.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Badge>{getCategoryLabel(selectedGoal.category)}</Badge>
                <Badge variant="secondary">{getTimeframeLabel(selectedGoal.timeframe)}</Badge>
                {selectedGoal.deadline && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{format(parseISO(selectedGoal.deadline), 'd MMM yyyy', { locale: es })}</Badge>}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span>Progreso</span><span className="font-medium">{selectedGoal.progress}%</span></div>
                <Progress value={selectedGoal.progress} className="h-3" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setIsDetailOpen(false); openDialog(selectedGoal); }}><Edit className="h-4 w-4 mr-2" />Editar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(selectedGoal.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
