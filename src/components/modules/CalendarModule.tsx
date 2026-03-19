'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit,
  Move,
  Loader2,
} from 'lucide-react';
import { EVENT_COLORS, EVENT_CATEGORIES } from '@/lib/constants';
import type { CalendarEvent } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  differenceInMinutes,
  addMinutes,
} from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';

interface DragState {
  eventId: string;
  originalStartDate: string;
  originalEndDate: string;
}

export function CalendarModule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const [category, setCategory] = useState(EVENT_CATEGORIES[0]);

  // Load events from server
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events.map((e: any) => ({
          ...e,
          startDate: e.startDate,
          endDate: e.endDate,
        })));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setColor(EVENT_COLORS[0].value);
    setCategory(EVENT_CATEGORIES[0]);
    setEditingEvent(null);
  };

  const openCreateDialog = (date?: Date, hour?: number) => {
    resetForm();
    const targetDate = date || new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    setStartDate(dateStr);
    setEndDate(dateStr);
    const hourValue = hour !== undefined ? hour : 9;
    setStartTime(`${hourValue.toString().padStart(2, '0')}:00`);
    setEndTime(`${(hourValue + 1).toString().padStart(2, '0')}:00`);
    setSelectedDate(targetDate);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    // Extract date and time directly from ISO string to preserve exact time
    // The backend stores times as "fake UTC" (local time with Z suffix)
    const startDateStr = event.startDate.replace('Z', ''); // Remove Z to treat as local
    const endDateStr = event.endDate ? event.endDate.replace('Z', '') : '';
    
    setStartDate(startDateStr.slice(0, 10));
    setStartTime(startDateStr.slice(11, 16));
    setEndDate(endDateStr ? endDateStr.slice(0, 10) : '');
    setEndTime(endDateStr ? endDateStr.slice(11, 16) : '');
    setColor(event.color);
    setCategory(event.category);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !startDate || !startTime) return;
    setIsSaving(true);

    const startDateTime = `${startDate}T${startTime}`;
    const endDateTime = endDate && endTime ? `${endDate}T${endTime}` : startDateTime;

    const eventData = {
      title,
      description,
      startDate: startDateTime,
      endDate: endDateTime,
      color,
      category,
      isRecurring: false,
    };

    try {
      if (editingEvent) {
        await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEvent.id, ...eventData }),
        });
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e));
      } else {
        const newEvent: CalendarEvent = {
          id: uuidv4(),
          ...eventData,
        };
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent),
        });
        setEvents([...events, newEvent]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const updateEventDates = async (eventId: string, newStartDate: string, newEndDate: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          startDate: newStartDate,
          endDate: newEndDate,
        }),
      });
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, startDate: newStartDate, endDate: newEndDate } : e
      ));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Navigation
  const goToToday = () => setCurrentDate(new Date());

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.startDate);
      return isSameDay(eventDate, date);
    });
  };

  // Month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper to get hour from ISO string without timezone conversion
  const getHourFromISO = (isoString: string): number => {
    const timePart = isoString.replace('Z', '').slice(11, 16);
    return parseInt(timePart.split(':')[0], 10);
  };

  // Helper to format time from ISO string for display
  const formatTimeFromISO = (isoString: string): string => {
    return isoString.replace('Z', '').slice(11, 16);
  };

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: es });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;
    } else {
      return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
    }
  };

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    setDragState({
      eventId: event.id,
      originalStartDate: event.startDate,
      originalEndDate: event.endDate,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    setTimeout(() => {
      const element = e.target as HTMLElement;
      element.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const element = e.target as HTMLElement;
    element.style.opacity = '1';
    setDragState(null);
    setDragOverCell(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDropOnDate = useCallback((e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState) return;

    const event = events.find(ev => ev.id === dragState.eventId);
    if (!event) return;

    // Extract hour/minute directly from ISO string to preserve exact time
    const startHour = getHourFromISO(event.startDate);
    const startMinute = parseInt(event.startDate.slice(14, 16), 10);
    const endHour = getHourFromISO(event.endDate || event.startDate);
    const endMinute = parseInt((event.endDate || event.startDate).slice(14, 16), 10);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    const newStart = new Date(targetDate);
    newStart.setHours(startHour);
    newStart.setMinutes(startMinute);
    
    const newEnd = addMinutes(newStart, duration);

    // Format as local datetime without timezone (preserves the hour)
    const newStartStr = format(newStart, "yyyy-MM-dd'T'HH:mm");
    const newEndStr = format(newEnd, "yyyy-MM-dd'T'HH:mm");

    updateEventDates(dragState.eventId, newStartStr, newEndStr);

    setDragState(null);
    setDragOverCell(null);
  }, [dragState, events]);

  const handleDropOnDateTime = useCallback((e: React.DragEvent, targetDate: Date, hour: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState) return;

    const event = events.find(ev => ev.id === dragState.eventId);
    if (!event) return;

    // Calculate duration from ISO string directly
    const startHour = getHourFromISO(event.startDate);
    const startMinute = parseInt(event.startDate.slice(14, 16), 10);
    const endHour = getHourFromISO(event.endDate || event.startDate);
    const endMinute = parseInt((event.endDate || event.startDate).slice(14, 16), 10);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    const newStart = new Date(targetDate);
    newStart.setHours(hour);
    newStart.setMinutes(0);
    newStart.setSeconds(0);
    
    const newEnd = addMinutes(newStart, duration);

    // Format as local datetime without timezone
    const newStartStr = format(newStart, "yyyy-MM-dd'T'HH:mm");
    const newEndStr = format(newEnd, "yyyy-MM-dd'T'HH:mm");

    updateEventDates(dragState.eventId, newStartStr, newEndStr);

    setDragState(null);
    setDragOverCell(null);
  }, [dragState, events]);

  const handleDropOnHour = useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState) return;

    const event = events.find(ev => ev.id === dragState.eventId);
    if (!event) return;

    // Calculate duration from ISO string directly
    const startHour = getHourFromISO(event.startDate);
    const startMinute = parseInt(event.startDate.slice(14, 16), 10);
    const endHour = getHourFromISO(event.endDate || event.startDate);
    const endMinute = parseInt((event.endDate || event.startDate).slice(14, 16), 10);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    const newStart = new Date(currentDate);
    newStart.setHours(hour);
    newStart.setMinutes(0);
    newStart.setSeconds(0);
    
    const newEnd = addMinutes(newStart, duration);

    // Format as local datetime without timezone
    const newStartStr = format(newStart, "yyyy-MM-dd'T'HH:mm");
    const newEndStr = format(newEnd, "yyyy-MM-dd'T'HH:mm");

    updateEventDates(dragState.eventId, newStartStr, newEndStr);

    setDragState(null);
    setDragOverCell(null);
  }, [dragState, events, currentDate]);

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
              <CalendarIcon className="h-5 w-5" />
              Calendario
            </CardTitle>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Instructions */}
          {events.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Move className="h-3 w-3" />
              Arrastra los eventos para moverlos a otra fecha u hora
            </p>
          )}
          
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize ml-2">{getViewTitle()}</h2>
            </div>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Mes
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Día
              </Button>
            </div>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="border rounded-lg overflow-hidden">
              {/* Week day headers */}
              <div className="grid grid-cols-7 bg-muted">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const cellId = format(day, 'yyyy-MM-dd');
                  const isDragOver = dragOverCell === cellId;

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] sm:min-h-[100px] border-t border-r p-1 cursor-pointer transition-colors ${
                        !isCurrentMonth ? 'bg-muted/30' : ''
                      } ${isDragOver ? 'bg-primary/20 ring-2 ring-primary inset-2' : 'hover:bg-muted/50'}`}
                      onClick={() => openCreateDialog(day)}
                      onDragOver={(e) => handleDragOver(e, cellId)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropOnDate(e, day)}
                    >
                      <div
                        className={`text-sm p-1 rounded-full w-7 h-7 flex items-center justify-center ${
                          isToday(day)
                            ? 'bg-primary text-primary-foreground font-bold'
                            : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onDragEnd={handleDragEnd}
                            className="text-xs px-1 py-0.5 rounded truncate cursor-move hover:opacity-80 flex items-center gap-0.5"
                            style={{ backgroundColor: event.color, color: 'white' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(event);
                            }}
                          >
                            <Move className="h-2 w-2 flex-shrink-0" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="border rounded-lg overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header */}
                <div className="grid grid-cols-8 bg-muted">
                  <div className="p-2 text-center text-sm font-medium border-r">
                    Hora
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`p-2 text-center text-sm font-medium border-r ${
                        isToday(day) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div>{format(day, 'EEE', { locale: es })}</div>
                      <div className={`text-lg ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div className="max-h-[500px] overflow-y-auto">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-t">
                      <div className="p-2 text-xs text-muted-foreground border-r text-center">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      {weekDays.map((day) => {
                        const dayEvents = getEventsForDate(day).filter((event) => {
                          const eventHour = getHourFromISO(event.startDate);
                          return eventHour === hour;
                        });
                        const cellId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
                        const isDragOver = dragOverCell === cellId;

                        return (
                          <div
                            key={day.toISOString()}
                            className={`min-h-[40px] border-r p-0.5 cursor-pointer transition-colors ${
                              isDragOver ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => openCreateDialog(day, hour)}
                            onDragOver={(e) => handleDragOver(e, cellId)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDropOnDateTime(e, day, hour)}
                          >
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, event)}
                                onDragEnd={handleDragEnd}
                                className="text-xs px-1 py-0.5 rounded truncate cursor-move flex items-center gap-0.5"
                                style={{ backgroundColor: event.color, color: 'white' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(event);
                                }}
                              >
                                <Move className="h-2 w-2 flex-shrink-0" />
                                <span className="truncate">{event.title}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/50 text-center">
                <div className="text-2xl font-bold">
                  {format(currentDate, 'd')}
                </div>
                <div className="text-muted-foreground capitalize">
                  {format(currentDate, 'EEEE, MMMM', { locale: es })}
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {hours.map((hour) => {
                  const hourEvents = getEventsForDate(currentDate).filter((event) => {
                    const eventHour = getHourFromISO(event.startDate);
                    return eventHour === hour;
                  });
                  const cellId = `day-${hour}`;
                  const isDragOver = dragOverCell === cellId;

                  return (
                    <div
                      key={hour}
                      className={`flex border-t cursor-pointer transition-colors ${
                        isDragOver ? 'bg-primary/20' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => openCreateDialog(currentDate, hour)}
                      onDragOver={(e) => handleDragOver(e, cellId)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropOnHour(e, hour)}
                    >
                      <div className="w-16 p-2 text-xs text-muted-foreground border-r text-center">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 min-h-[40px] p-1">
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onDragEnd={handleDragEnd}
                            className="text-sm px-2 py-1 rounded mb-1 cursor-move flex items-center gap-1"
                            style={{ backgroundColor: event.color, color: 'white' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(event);
                            }}
                          >
                            <Move className="h-3 w-3 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{event.title}</div>
                              {event.description && (
                                <div className="text-xs opacity-80 truncate">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events
                .filter((e) => parseISO(e.startDate) >= new Date())
                .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
                .slice(0, 10)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(() => {
                          // Extract date and time directly from ISO string
                          const dateStr = event.startDate.replace('Z', '');
                          const [datePart, timePart] = dateStr.split('T');
                          const [year, month, day] = datePart.split('-');
                          const [hour, minute] = timePart.slice(0, 5).split(':');
                          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                          return `${parseInt(day)} ${months[parseInt(month) - 1]} a las ${hour}:${minute}`;
                        })()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(event.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay eventos próximos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nombre del evento"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles del evento"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startDate">Fecha inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Hora inicio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="endDate">Fecha fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      color === c.value ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            {editingEvent && (
              <Button variant="destructive" onClick={() => { handleDelete(editingEvent.id); setIsDialogOpen(false); }}>
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!title || !startDate || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingEvent ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
