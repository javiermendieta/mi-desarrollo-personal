'use client';

import { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Search,
  BookMarked,
  FileText,
  ChevronRight,
  Loader2,
  FileUp,
  ExternalLink,
  X,
} from 'lucide-react';
import { trackActivity } from '@/lib/activity';
import type { Book, BookNote } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ReadingModule() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingNote, setEditingNote] = useState<BookNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reading' | 'completed' | 'paused'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Book form
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookTotalPages, setBookTotalPages] = useState('');
  const [bookCurrentPage, setBookCurrentPage] = useState('');
  const [bookStatus, setBookStatus] = useState<'reading' | 'completed' | 'paused'>('reading');
  const [bookPdfUrl, setBookPdfUrl] = useState('');
  const [bookPdfName, setBookPdfName] = useState('');

  // Note form
  const [notePage, setNotePage] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Load books from server
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      if (data.books) {
        setBooks(data.books.map((b: any) => ({
          ...b,
          startDate: b.startDate || new Date().toISOString(),
          notes: b.notes || [],
          pdfUrl: b.pdfUrl || null,
          pdfName: b.pdfName || null,
        })));
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openBookDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setBookTitle(book.title);
      setBookAuthor(book.author || '');
      setBookTotalPages(book.totalPages.toString());
      setBookCurrentPage(book.currentPage.toString());
      setBookStatus(book.status);
      setBookPdfUrl(book.pdfUrl || '');
      setBookPdfName(book.pdfName || '');
    } else {
      setEditingBook(null);
      setBookTitle('');
      setBookAuthor('');
      setBookTotalPages('');
      setBookCurrentPage('0');
      setBookStatus('reading');
      setBookPdfUrl('');
      setBookPdfName('');
    }
    setIsBookDialogOpen(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setBookPdfUrl(data.url);
        setBookPdfName(data.name);
      } else {
        alert('Error al subir el PDF');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error al subir el PDF');
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePdf = () => {
    setBookPdfUrl('');
    setBookPdfName('');
  };

  const handleSaveBook = async () => {
    if (!bookTitle.trim() || !bookTotalPages) return;
    setIsSaving(true);

    const bookData: Partial<Book> = {
      title: bookTitle,
      author: bookAuthor,
      totalPages: parseInt(bookTotalPages) || 0,
      currentPage: parseInt(bookCurrentPage) || 0,
      status: bookStatus,
      startDate: editingBook?.startDate || new Date().toISOString(),
      notes: editingBook?.notes || [],
      pdfUrl: bookPdfUrl || null,
      pdfName: bookPdfName || null,
    };

    if (parseInt(bookCurrentPage || '0') >= parseInt(bookTotalPages || '0')) {
      bookData.status = 'completed';
      bookData.finishDate = new Date().toISOString();
    }

    try {
      if (editingBook) {
        await fetch('/api/books', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBook.id, ...bookData }),
        });
        setBooks(books.map(b => b.id === editingBook.id ? { ...b, ...bookData } : b));
      } else {
        const newBook: Book = {
          id: uuidv4(),
          ...bookData,
          notes: [],
        } as Book;
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBook),
        });
        setBooks([...books, newBook]);
        // Track activity
        trackActivity('reading', 'created', `Nuevo libro: ${bookTitle}`);
      }
      setIsBookDialogOpen(false);
      resetBookForm();
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetBookForm = () => {
    setBookTitle('');
    setBookAuthor('');
    setBookTotalPages('');
    setBookCurrentPage('0');
    setBookStatus('reading');
    setBookPdfUrl('');
    setBookPdfName('');
    setEditingBook(null);
  };

  const openNoteDialog = (book: Book, note?: BookNote) => {
    setSelectedBook(book);
    if (note) {
      setEditingNote(note);
      setNotePage(note.page.toString());
      setNoteContent(note.content);
    } else {
      setEditingNote(null);
      setNotePage(book.currentPage.toString());
      setNoteContent('');
    }
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !selectedBook) return;
    setIsSaving(true);

    const note: BookNote = {
      id: editingNote?.id || uuidv4(),
      page: parseInt(notePage) || 0,
      content: noteContent,
      createdAt: editingNote?.createdAt || new Date().toISOString(),
    };

    let updatedNotes: BookNote[];
    if (editingNote) {
      updatedNotes = selectedBook.notes.map(n => n.id === editingNote.id ? note : n);
    } else {
      updatedNotes = [...selectedBook.notes, note];
    }

    try {
      await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBook.id, notes: updatedNotes }),
      });
      
      setBooks(books.map(b => 
        b.id === selectedBook.id ? { ...b, notes: updatedNotes } : b
      ));
      
      if (isDetailOpen) {
        setSelectedBook({ ...selectedBook, notes: updatedNotes });
      }
      
      setIsNoteDialogOpen(false);
      resetNoteForm();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetNoteForm = () => {
    setNotePage('');
    setNoteContent('');
    setEditingNote(null);
  };

  const openBookDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
  };

  const openPdfViewer = (book: Book) => {
    if (book.pdfUrl) {
      setPdfViewerUrl(book.pdfUrl);
      setIsPdfViewerOpen(true);
    }
  };

  const updateCurrentPage = async (bookId: string, newPage: number) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const updates: Partial<Book> = {
      currentPage: Math.min(newPage, book.totalPages),
    };

    const isCompleted = newPage >= book.totalPages;
    if (isCompleted) {
      updates.status = 'completed';
      updates.finishDate = new Date().toISOString();
    }

    try {
      await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookId, ...updates }),
      });
      setBooks(books.map(b => b.id === bookId ? { ...b, ...updates } : b));
      
      // Track activity
      if (isCompleted) {
        trackActivity('reading', 'completed', `Libro terminado: ${book.title}`, bookId);
      } else {
        trackActivity('reading', 'progress', `Lectura: ${book.title} (${newPage}/${book.totalPages})`, bookId);
      }
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await fetch('/api/books', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setBooks(books.filter(b => b.id !== id));
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleDeleteNote = async (bookId: string, noteId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const updatedNotes = book.notes.filter(n => n.id !== noteId);
    
    try {
      await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookId, notes: updatedNotes }),
      });
      
      setBooks(books.map(b => 
        b.id === bookId ? { ...b, notes: updatedNotes } : b
      ));
      
      if (selectedBook?.id === bookId) {
        setSelectedBook({ ...selectedBook, notes: updatedNotes });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredBooks = books
    .filter((book) => {
      if (filterStatus !== 'all' && book.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(query) ||
          book.author?.toLowerCase().includes(query) ||
          book.notes.some((n) => n.content.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.status === 'reading' && b.status !== 'reading') return -1;
      if (a.status !== 'reading' && b.status === 'reading') return 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  const readingBooks = books.filter((b) => b.status === 'reading');
  const completedBooks = books.filter((b) => b.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'reading':
        return 'Leyendo';
      case 'completed':
        return 'Completado';
      case 'paused':
        return 'Pausado';
      default:
        return status;
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
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Biblioteca
            </CardTitle>
            <Button onClick={() => openBookDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Libro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{readingBooks.length}</p>
              <p className="text-xs text-muted-foreground">Leyendo</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{completedBooks.length}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{books.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar libros o notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reading">Leyendo</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books List */}
      {filteredBooks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const progress = Math.round((book.currentPage / book.totalPages) * 100);
            return (
              <Card key={book.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{book.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {book.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openPdfViewer(book)}
                          title="Ver PDF"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      <Badge className={getStatusColor(book.status)}>
                        {getStatusLabel(book.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Página {book.currentPage} de {book.totalPages}</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {book.status === 'reading' && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={book.currentPage}
                          onChange={(e) => updateCurrentPage(book.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                          min={0}
                          max={book.totalPages}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCurrentPage(book.id, book.currentPage + 10)}
                        >
                          +10
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {book.notes.length} notas
                        {book.pdfUrl && ' · PDF'}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openNoteDialog(book)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openBookDetail(book)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openBookDialog(book)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar libro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminarán también todas las notas y el PDF asociado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBook(book.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookMarked className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Tu biblioteca está vacía</h3>
            <p className="text-muted-foreground mb-6">
              Añade libros para hacer seguimiento de tu lectura
            </p>
            <Button onClick={() => openBookDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir primer libro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Book Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBook ? 'Editar Libro' : 'Nuevo Libro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Nombre del libro"
              />
            </div>
            <div>
              <Label>Autor</Label>
              <Input
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="Nombre del autor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total de páginas *</Label>
                <Input
                  type="number"
                  value={bookTotalPages}
                  onChange={(e) => setBookTotalPages(e.target.value)}
                  min={1}
                />
              </div>
              <div>
                <Label>Página actual</Label>
                <Input
                  type="number"
                  value={bookCurrentPage}
                  onChange={(e) => setBookCurrentPage(e.target.value)}
                  min={0}
                />
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={bookStatus}
                onValueChange={(v) => setBookStatus(v as 'reading' | 'completed' | 'paused')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Leyendo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* PDF Upload */}
            <div>
              <Label>Archivo PDF (opcional)</Label>
              {bookPdfUrl ? (
                <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-red-500" />
                  <span className="flex-1 truncate text-sm">{bookPdfName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={removePdf}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPdf}
                  >
                    {uploadingPdf ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4 mr-2" />
                    )}
                    {uploadingPdf ? 'Subiendo...' : 'Subir PDF'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Máximo 10MB</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBook} disabled={!bookTitle.trim() || !bookTotalPages || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Editar Nota' : 'Nueva Nota'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Página</Label>
              <Input
                type="number"
                value={notePage}
                onChange={(e) => setNotePage(e.target.value)}
                min={1}
                max={selectedBook?.totalPages}
              />
            </div>
            <div>
              <Label>Nota *</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escribe tu nota o cita..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote} disabled={!noteContent.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(selectedBook.status)}>
                  {getStatusLabel(selectedBook.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  por {selectedBook.author}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progreso</span>
                  <span>
                    {selectedBook.currentPage} / {selectedBook.totalPages} páginas
                  </span>
                </div>
                <Progress
                  value={(selectedBook.currentPage / selectedBook.totalPages) * 100}
                  className="h-2"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Iniciado: {format(new Date(selectedBook.startDate), 'd MMM yyyy', { locale: es })}</p>
                {selectedBook.finishDate && (
                  <p>Completado: {format(new Date(selectedBook.finishDate), 'd MMM yyyy', { locale: es })}</p>
                )}
              </div>

              {/* PDF Button */}
              {selectedBook.pdfUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openPdfViewer(selectedBook)}
                >
                  <FileText className="h-4 w-4 mr-2 text-red-500" />
                  Leer PDF
                </Button>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Notas</h4>
                  <Button variant="ghost" size="sm" onClick={() => openNoteDialog(selectedBook)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedBook.notes.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedBook.notes
                      .sort((a, b) => a.page - b.page)
                      .map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">Pág. {note.page}</Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6"
                                onClick={() => openNoteDialog(selectedBook, note)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleDeleteNote(selectedBook.id, note.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(note.createdAt), 'd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin notas aún
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Visor de PDF</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfViewerUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir en nueva pestaña
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30">
            <iframe
              src={pdfViewerUrl}
              className="w-full h-[70vh]"
              title="PDF Viewer"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
