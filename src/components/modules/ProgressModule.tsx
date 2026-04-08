'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Flame, Trophy, Calendar, TrendingUp, Target, Loader2, RefreshCw } from 'lucide-react';
import { format, startOfYear, endOfYear, startOfWeek, eachDayOfInterval, parseISO, isToday, differenceInDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  id: string;
  type: string;
  action: string;
  title: string;
  date: string;
}

interface ActivityData {
  date: string;
  count: number;
  types: Record<string, number>;
}

interface DayDetail {
  date: Date;
  activities: Activity[];
}

const ACTIVITY_COLORS = [
  '#ebedf0', // 0 actividad
  '#9be9a6', // 2 actividades
  '#40c463', // 3 actividades
  '#30a14e', // 4 actividades
  '#216e39', // 5+ actividades
];

const TYPE_LABELS: Record<string, string> = {
  habit: 'Hábitos',
  sport: 'Deporte',
  yoga: 'Yoga',
  meditation: 'Meditación',
  reading: 'Lectura',
  diary: 'Diario',
  goal: 'Metas',
  health: 'Salud',
  finance: 'Finanzas',
};

const TYPE_COLORS: Record<string, string> = {
  habit: '#22c55e',
  sport: '#3b82f6',
  yoga: '#8b5cf6',
  meditation: '#ec4899',
  reading: '#f97316',
  diary: '#eab308',
  goal: '#06b6d4',
  health: '#ef4444',
  finance: '#14b8a6',
};

export function ProgressModule() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [stats, setStats] = useState({
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalActivities: 0,
  });

  useEffect(() => {
    loadActivities();
  }, [selectedYear]);

  // Reload activities when component gets focus (user navigates to this section)
  useEffect(() => {
    const handleFocus = () => {
      loadActivities();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedYear]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/activities?year=${selectedYear}`);
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
        processActivityData(data.activities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processActivityData = (activities: Activity[]) => {
    const dataMap = new Map<string, ActivityData>();

    activities.forEach(activity => {
      const dateKey = activity.date.split('T')[0];
      const existing = dataMap.get(dateKey) || { date: dateKey, count: 0, types: {} };
      existing.count++;
      const type = activity.type;
      existing.types[type] = (existing.types[type] || 0) + 1;
      dataMap.set(dateKey, existing);
    });

    setActivityData(Array.from(dataMap.values()));

    // Calculate stats
    const dates = [...new Set(activities.map(a => a.date.split('T')[0]))];
    const totalDays = dates.length;
    const totalActivities = activities.length;

    // Calculate streaks
    const sortedDates = dates.sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const diff = differenceInDays(current, prev);
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Check if current streak continues to today
    const lastActivityDate = sortedDates[sortedDates.length - 1];
    const daysSinceLastActivity = differenceInDays(new Date(today), new Date(lastActivityDate));
    currentStreak = daysSinceLastActivity <= 1 ? tempStreak : 0;

    setStats({ totalDays, currentStreak, longestStreak, totalActivities });
  };

  const getActivityLevel = (date: string): number => {
    const data = activityData.find(d => d.date === date);
    if (!data) return 0;
    if (data.count >= 5) return 4;
    if (data.count >= 4) return 3;
    if (data.count >= 3) return 2;
    if (data.count >= 1) return 1;
    return 0;
  };

  const getActivityColor = (date: string): string => {
    const level = getActivityLevel(date);
    if (level === 0) return '#ebedf0';
    return ACTIVITY_COLORS[level];
  };

  const getYearDays = () => {
    const year = selectedYear;
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    return eachDayOfInterval({ start, end });
  };

  const getWeeks = () => {
    const year = selectedYear;
    const firstDay = startOfYear(new Date(year, 0, 1));
    const lastDay = endOfYear(new Date(year, 11, 31));
    const weeks: Date[][] = [];
    
    let currentWeekStart = startOfWeek(firstDay, { weekStartsOn: 1 });
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const week = eachDayOfInterval({
        start: currentWeekStart,
        end: weekEnd > lastDay ? lastDay : weekEnd
      });
      weeks.push(week);
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const getDayActivities = (date: Date): Activity[] => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.filter(a => a.date.split('T')[0] === dateStr);
  };

  const openDayDetail = (date: Date) => {
    setSelectedDate(date);
    setIsDetailOpen(true);
  };

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const filteredActivityData = selectedType === 'all' 
    ? activityData 
    : activityData.map(d => ({
        ...d,
        count: d.types[selectedType] || 0
      }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.totalDays}</p>
            <p className="text-xs text-muted-foreground">Días activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-3xl font-bold text-orange-500">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Racha actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Mejor racha</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-3xl font-bold text-purple-500">{stats.totalActivities}</p>
            <p className="text-xs text-muted-foreground">Actividades</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadActivities} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contribution Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Actividad {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month labels */}
          <div className="flex mb-2">
            <div className="w-8" /> {/* Day labels space */}
            <div className="flex-1 flex justify-between text-xs text-muted-foreground px-1">
              {months.map(m => <span key={m} className="w-8 text-center">{m}</span>)}
            </div>
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {days.map(d => (
                <div key={d} className="h-3 w-6 flex items-center justify-center text-xs text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
                {getWeeks().map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const dateStr = day.toISOString().split('T')[0];
                      const level = getActivityLevel(dateStr);
                      const isCurrentYear = day.getFullYear() === selectedYear;
                      
                      return (
                        <button
                          key={dateStr}
                          className={`w-3 h-3 rounded-sm cursor-pointer transition-colors hover:ring-2 hover:ring-primary ${!isCurrentYear ? 'opacity-30' : ''}`}
                          style={{ backgroundColor: getActivityColor(dateStr) }}
                          onClick={() => openDayDetail(day)}
                          title={`${level} actividades - ${format(day, 'd MMM', { locale: es })}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Menos</span>
            {ACTIVITY_COLORS.map((color, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span>Más</span>
          </div>
        </CardContent>
      </Card>

      {/* Activity Types Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Resumen por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = activities.filter(a => a.type === type).length;
              return (
                <div 
                  key={type} 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => setSelectedType(type)}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                  <span className="flex-1 text-sm">{label}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </DialogTitle>
          </DialogHeader>
          {selectedDate && (
            <div className="space-y-3">
              {getDayActivities(selectedDate).length > 0 ? (
                getDayActivities(selectedDate).map(activity => (
                  <div 
                    key={activity.id} 
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[activity.type] || '#888' }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[activity.type] || activity.type} • {format(parseISO(activity.date), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Sin actividad este día
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
