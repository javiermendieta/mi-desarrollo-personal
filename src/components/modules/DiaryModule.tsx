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
  PenLine,
  Plus,
  Trash2,
  Edit,
  Smile,
  Brain,
  Sparkles,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { MOOD_OPTIONS } from '@/lib/constants';
import { trackActivity } from '@/lib/activity';
import type { DiaryEntry, LimitingBelief, Mood } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function DiaryModule() {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [limitingBeliefs, setLimitingBeliefs] = useState<LimitingBelief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Diary state
  const [isDiaryDialogOpen, setIsDiaryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isEntryDetailOpen, setIsEntryDetailOpen] = useState(false);

  // Diary form
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryMood, setEntryMood] = useState<Mood>('good');
  const [entryTags, setEntryTags] = useState('');
  const [entryGratitude, setEntryGratitude] = useState('');

  // Belief state
  const [isBeliefDialogOpen, setIsBeliefDialogOpen] = useState(false);
  const [editingBelief, setEditingBelief] = useState<LimitingBelief | null>(null);
  const [selectedBelief, setSelectedBelief] = useState<LimitingBelief | null>(null);
  const [isBeliefDetailOpen, setIsBeliefDetailOpen] = useState(false);
  const [isReflectionDialogOpen, setIsReflectionDialogOpen] = useState(false);
  const [reflectionNote, setReflectionNote] = useState('');

  // Belief form
  const [beliefText, setBeliefText] = useState('');
  const [beliefExplanation, setBeliefExplanation] = useState('');
  const [beliefDailyWork, setBeliefDailyWork] = useState('');
  const [beliefProgress, setBeliefProgress] = useState(0);

  // Load data from server
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [diaryRes, beliefsRes] = await Promise.all([
        fetch('/api/diary'),
        fetch('/api/beliefs'),
      ]);
      
      const diaryData = await diaryRes.json();
      const beliefsData = await beliefsRes.json();

      if (diaryData.entries) setDiaryEntries(diaryData.entries);
      if (beliefsData.beliefs) setLimitingBeliefs(beliefsData.beliefs);
    } catch (error) {
      console.error('Error loading diary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Diary handlers
  const openDiaryDialog = (entry?: DiaryEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEntryTitle(entry.title || '');
      setEntryContent(entry.content);
      setEntryMood(entry.mood);
      setEntryTags(entry.tags.join(', '));
      setEntryGratitude(entry.gratitude?.join('\n') || '');
    } else {
      setEditingEntry(null);
      setEntryTitle('');
      setEntryContent('');
      setEntryMood('good');
      setEntryTags('');
      setEntryGratitude('');
    }
    setIsDiaryDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!entryContent.trim()) return;
    setIsSaving(true);

    const entryData: Partial<DiaryEntry> = {
      title: entryTitle || undefined,
      content: entryContent,
      mood: entryMood,
      tags: entryTags.split(',').map((t) => t.trim()).filter(Boolean),
      gratitude: entryGratitude.split('\n').map((g) => g.trim()).filter(Boolean),
    };

    try {
      if (editingEntry) {
        await fetch('/api/diary', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEntry.id, ...entryData }),
        });
        setDiaryEntries(diaryEntries.map(e => e.id === editingEntry.id ? { ...e, ...entryData } : e));
      } else {
        const newEntry: DiaryEntry = {
          id: uuidv4(),
          date: new Date().toISOString(),
          ...entryData,
          createdAt: new Date().toISOString(),
        } as DiaryEntry;
        await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry),
        });
        setDiaryEntries([...diaryEntries, newEntry]);
        // Track activity
        trackActivity('diary', 'created', `Entrada de diario: ${entryTitle || 'Sin título'}`);
      }
      setIsDiaryDialogOpen(false);
      resetDiaryForm();
    } catch (error) {
      console.error('Error saving diary entry:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetDiaryForm = () => {
    setEntryTitle('');
    setEntryContent('');
    setEntryMood('good');
    setEntryTags('');
    setEntryGratitude('');
    setEditingEntry(null);
  };

  const openEntryDetail = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsEntryDetailOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch('/api/diary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setDiaryEntries(diaryEntries.filter(e => e.id !== id));
      setIsEntryDetailOpen(false);
    } catch (error) {
      console.error('Error deleting diary entry:', error);
    }
  };

  // Belief handlers
  const openBeliefDialog = (belief?: LimitingBelief) => {
    if (belief) {
      setEditingBelief(belief);
      setBeliefText(belief.belief);
      setBeliefExplanation(belief.explanation);
      setBeliefDailyWork(belief.dailyWork);
      setBeliefProgress(belief.progress);
    } else {
      setEditingBelief(null);
      setBeliefText('');
      setBeliefExplanation('');
      setBeliefDailyWork('');
      setBeliefProgress(0);
    }
    setIsBeliefDialogOpen(true);
  };

  const handleSaveBelief = async () => {
    if (!beliefText.trim()) return;
    setIsSaving(true);

    const beliefData: Partial<LimitingBelief> = {
      belief: beliefText,
      explanation: beliefExplanation,
      dailyWork: beliefDailyWork,
      progress: beliefProgress,
    };

    try {
      if (editingBelief) {
        await fetch('/api/beliefs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBelief.id, ...beliefData }),
        });
        setLimitingBeliefs(limitingBeliefs.map(b => b.id === editingBelief.id ? { ...b, ...beliefData } : b));
      } else {
        const newBelief: LimitingBelief = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          reflections: [],
          isOvercome: false,
          ...beliefData,
        } as LimitingBelief;
        await fetch('/api/beliefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBelief),
        });
        setLimitingBeliefs([...limitingBeliefs, newBelief]);
      }
      setIsBeliefDialogOpen(false);
      resetBeliefForm();
    } catch (error) {
      console.error('Error saving belief:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetBeliefForm = () => {
    setBeliefText('');
    setBeliefExplanation('');
    setBeliefDailyWork('');
    setBeliefProgress(0);
    setEditingBelief(null);
  };

  const openBeliefDetail = (belief: LimitingBelief) => {
    setSelectedBelief(belief);
    setIsBeliefDetailOpen(true);
  };

  const addReflection = async () => {
    if (!selectedBelief || !reflectionNote.trim()) return;
    setIsSaving(true);
    
    const newReflection = {
      date: new Date().toISOString(),
      note: reflectionNote,
    };
    
    const updatedReflections = [...selectedBelief.reflections, newReflection];
    
    try {
      await fetch('/api/beliefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedBelief.id, 
          reflections: updatedReflections 
        }),
      });
      
      setLimitingBeliefs(limitingBeliefs.map(b => 
        b.id === selectedBelief.id 
          ? { ...b, reflections: updatedReflections } 
          : b
      ));
      
      setSelectedBelief({
        ...selectedBelief,
        reflections: updatedReflections,
      });
      
      setReflectionNote('');
      setIsReflectionDialogOpen(false);
    } catch (error) {
      console.error('Error adding reflection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsOvercome = async (id: string) => {
    try {
      await fetch('/api/beliefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isOvercome: true, progress: 100 }),
      });
      setLimitingBeliefs(limitingBeliefs.map(b => 
        b.id === id ? { ...b, isOvercome: true, progress: 100 } : b
      ));
      setIsBeliefDetailOpen(false);
    } catch (error) {
      console.error('Error marking belief as overcome:', error);
    }
  };

  const handleDeleteBelief = async (id: string) => {
    try {
      await fetch('/api/beliefs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setLimitingBeliefs(limitingBeliefs.filter(b => b.id !== id));
      setIsBeliefDetailOpen(false);
    } catch (error) {
      console.error('Error deleting belief:', error);
    }
  };

  const getMoodEmoji = (mood: Mood) => {
    return MOOD_OPTIONS.find((m) => m.value === mood)?.emoji || '😐';
  };

  const getMoodColor = (mood: Mood) => {
    return MOOD_OPTIONS.find((m) => m.value === mood)?.color || '#eab308';
  };

  const sortedEntries = [...diaryEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activeBeliefs = limitingBeliefs.filter((b) => !b.isOvercome);
  const overcomeBeliefs = limitingBeliefs.filter((b) => b.isOvercome);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="diary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diary">Diario</TabsTrigger>
          <TabsTrigger value="beliefs">Creencias Limitantes</TabsTrigger>
        </TabsList>

        {/* Diary Tab */}
        <TabsContent value="diary" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <PenLine className="h-5 w-5" />
                  Mi Diario
                </CardTitle>
                <Button onClick={() => openDiaryDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Entrada
                </Button>
              </div>
            </CardHeader>
          </Card>

          {sortedEntries.length > 0 ? (
            <div className="space-y-3">
              {sortedEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openEntryDetail(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                          <div>
                            <p className="font-medium">
                              {entry.title || format(parseISO(entry.date), "EEEE, d 'de' MMMM", { locale: es })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(entry.date), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {entry.content}
                        </p>
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <PenLine className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Tu diario está vacío</h3>
                <p className="text-muted-foreground mb-6">
                  Comienza a escribir tus pensamientos y reflexiones
                </p>
                <Button onClick={() => openDiaryDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Escribir primera entrada
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Beliefs Tab */}
        <TabsContent value="beliefs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Creencias Limitantes
                </CardTitle>
                <Button onClick={() => openBeliefDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Creencia
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Identifica y trabaja en las creencias que te limitan. Con dedicación y trabajo diario, puedes superarlas.
              </p>
            </CardContent>
          </Card>

          {/* Active Beliefs */}
          {activeBeliefs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-muted-foreground">En proceso</h3>
              {activeBeliefs.map((belief) => (
                <Card
                  key={belief.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openBeliefDetail(belief)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-destructive">"{belief.belief}"</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {belief.explanation}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{belief.progress}%</span>
                        </div>
                        <Progress value={belief.progress} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {belief.reflections.length} reflexiones
                        </span>
                        <Badge variant="outline">
                          Creada {format(parseISO(belief.createdAt), 'd MMM yyyy', { locale: es })}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Overcome Beliefs */}
          {overcomeBeliefs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-muted-foreground">Superadas 🎉</h3>
              {overcomeBeliefs.map((belief) => (
                <Card key={belief.id} className="bg-emerald-50 dark:bg-emerald-950/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500 rounded-full">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-through opacity-70">"{belief.belief}"</p>
                        <p className="text-xs text-muted-foreground">
                          {belief.reflections.length} reflexiones registradas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {limitingBeliefs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Identifica tus creencias limitantes</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Las creencias limitantes son pensamientos que te impiden alcanzar tu potencial.
                  Identifícalas y trabaja en ellas día a día.
                </p>
                <Button onClick={() => openBeliefDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir primera creencia
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Diary Entry Dialog */}
      <Dialog open={isDiaryDialogOpen} onOpenChange={setIsDiaryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Editar Entrada' : 'Nueva Entrada'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título (opcional)</Label>
              <Input
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="Título de tu entrada..."
              />
            </div>
            <div>
              <Label>¿Cómo te sientes hoy?</Label>
              <div className="flex gap-2 mt-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    className={`p-2 rounded-lg text-2xl transition-all ${
                      entryMood === mood.value
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setEntryMood(mood.value as Mood)}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Contenido *</Label>
              <Textarea
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder="Escribe tus pensamientos, reflexiones, experiencias del día..."
                rows={6}
              />
            </div>
            <div>
              <Label>Etiquetas (separadas por coma)</Label>
              <Input
                value={entryTags}
                onChange={(e) => setEntryTags(e.target.value)}
                placeholder="trabajo, personal, gratitud..."
              />
            </div>
            <div>
              <Label>Gratitud (una por línea)</Label>
              <Textarea
                value={entryGratitude}
                onChange={(e) => setEntryGratitude(e.target.value)}
                placeholder="Hoy estoy agradecido por..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiaryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEntry} disabled={!entryContent.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Detail Dialog */}
      <Dialog open={isEntryDetailOpen} onOpenChange={setIsEntryDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedEntry && getMoodEmoji(selectedEntry.mood)}</span>
              {selectedEntry?.title || 'Entrada de diario'}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {format(parseISO(selectedEntry.date), "EEEE, d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
              </p>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="whitespace-pre-wrap">{selectedEntry.content}</p>
              </div>
              {selectedEntry.gratitude && selectedEntry.gratitude.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Gratitud
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedEntry.gratitude.map((g, i) => (
                      <li key={i} className="text-sm">{g}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => {
                  setIsEntryDetailOpen(false);
                  openDiaryDialog(selectedEntry);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar entrada?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteEntry(selectedEntry.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Belief Dialog */}
      <Dialog open={isBeliefDialogOpen} onOpenChange={setIsBeliefDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBelief ? 'Editar Creencia' : 'Nueva Creencia Limitante'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Creencia limitante *</Label>
              <Input
                value={beliefText}
                onChange={(e) => setBeliefText(e.target.value)}
                placeholder="Ej: No soy lo suficientemente inteligente"
              />
            </div>
            <div>
              <Label>Explicación</Label>
              <Textarea
                value={beliefExplanation}
                onChange={(e) => setBeliefExplanation(e.target.value)}
                placeholder="¿Por qué tienes esta creencia? ¿De dónde viene?"
                rows={3}
              />
            </div>
            <div>
              <Label>Trabajo diario</Label>
              <Textarea
                value={beliefDailyWork}
                onChange={(e) => setBeliefDailyWork(e.target.value)}
                placeholder="¿Qué puedes hacer cada día para superar esta creencia?"
                rows={3}
              />
            </div>
            {editingBelief && (
              <div>
                <Label>Progreso: {beliefProgress}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beliefProgress}
                  onChange={(e) => setBeliefProgress(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBeliefDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBelief} disabled={!beliefText.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Belief Detail Dialog */}
      <Dialog open={isBeliefDetailOpen} onOpenChange={setIsBeliefDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive">"{selectedBelief?.belief}"</DialogTitle>
          </DialogHeader>
          {selectedBelief && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Explicación</h4>
                <p className="text-sm text-muted-foreground">{selectedBelief.explanation}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Trabajo diario</h4>
                <p className="text-sm text-muted-foreground">{selectedBelief.dailyWork}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span className="font-medium">{selectedBelief.progress}%</span>
                </div>
                <Progress value={selectedBelief.progress} className="h-2" />
              </div>

              {/* Reflections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Reflexiones ({selectedBelief.reflections.length})</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReflectionDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
                {selectedBelief.reflections.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedBelief.reflections
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((ref, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm">{ref.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(ref.date), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin reflexiones aún
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBeliefDetailOpen(false);
                    openBeliefDialog(selectedBelief);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => markAsOvercome(selectedBelief.id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como superada
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar creencia?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteBelief(selectedBelief.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reflection Dialog */}
      <Dialog open={isReflectionDialogOpen} onOpenChange={setIsReflectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Reflexión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="¿Qué has aprendido? ¿Cómo has trabajado esta creencia hoy?"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReflectionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addReflection} disabled={!reflectionNote.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
