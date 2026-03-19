'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { StickyNote, Plus, Trash2, Edit, Pin, Loader2 } from 'lucide-react';
import type { QuickNote } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const NOTE_COLORS = ['#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff'];

export function NotesModule() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<QuickNote | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Otros');
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.notes) setNotes(data.notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (note?: QuickNote) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content || '');
      setCategory(note.category);
      setColor(note.color);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setCategory('Otros');
      setColor('#ffffff');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      if (editingNote) {
        await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingNote.id, title, content, category, color }),
        });
        setNotes(notes.map(n => n.id === editingNote.id ? { ...n, title, content, category, color } : n));
      } else {
        const note = {
          id: uuidv4(),
          title,
          content,
          category,
          color,
          isPinned: false,
        };
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note),
        });
        setNotes([...notes, note]);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPinned: !note.isPinned }),
      });
      setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const pinnedNotes = notes.filter(n => n.isPinned);
  const otherNotes = notes.filter(n => !n.isPinned);

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2"><StickyNote className="h-5 w-5" />Notas Rápidas</CardTitle>
            <Button onClick={() => openDialog()}><Plus className="h-4 w-4 mr-2" />Nueva</Button>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Crea tu primera nota</p>
              <Button onClick={() => openDialog()}><Plus className="h-4 w-4 mr-2" />Crear nota</Button>
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><Pin className="h-3 w-3" />Fijadas</h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {pinnedNotes.map((note) => (
                      <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow" style={{ backgroundColor: note.color }}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{note.title}</h3>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(note.id)}><Pin className="h-3 w-3 fill-current" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDialog(note)}><Edit className="h-3 w-3" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(note.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {note.content && <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {otherNotes.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {otherNotes.map((note) => (
                    <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow" style={{ backgroundColor: note.color }}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{note.title}</h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(note.id)}><Pin className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDialog(note)}><Edit className="h-3 w-3" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(note.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {note.content && <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingNote ? 'Editar Nota' : 'Nueva Nota'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la nota" /></div>
            <div><Label>Contenido</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escribe tu nota..." rows={4} /></div>
            <div><Label>Categoría</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Trabajo, Personal" /></div>
            <div><Label>Color</Label><div className="flex gap-2 mt-1">{NOTE_COLORS.map((c) => (<button key={c} type="button" className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />))}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={!title.trim() || isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
