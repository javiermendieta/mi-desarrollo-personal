'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Flower2,
  BookOpen,
  PenLine,
  Target,
  CheckCircle,
  Wallet,
  Heart,
  StickyNote,
  Bot,
  Menu,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  LogOut,
  TrendingUp,
  FolderKanban,
} from 'lucide-react';
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
import { useAppStore } from '@/lib/store';
import { exportData, importData } from '@/hooks/useLocalStorage';
import type { AppData } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'progress', label: 'Progreso', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'projects', label: 'Proyectos', icon: <FolderKanban className="h-5 w-5" /> },
  { id: 'calendar', label: 'Calendario', icon: <Calendar className="h-5 w-5" /> },
  { id: 'sports', label: 'Deportes', icon: <Dumbbell className="h-5 w-5" /> },
  { id: 'yoga', label: 'Yoga & Meditación', icon: <Flower2 className="h-5 w-5" /> },
  { id: 'reading', label: 'Lectura', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'diary', label: 'Diario', icon: <PenLine className="h-5 w-5" /> },
  { id: 'goals', label: 'Metas', icon: <Target className="h-5 w-5" /> },
  { id: 'habits', label: 'Hábitos', icon: <CheckCircle className="h-5 w-5" /> },
  { id: 'finances', label: 'Finanzas', icon: <Wallet className="h-5 w-5" /> },
  { id: 'health', label: 'Salud', icon: <Heart className="h-5 w-5" /> },
  { id: 'notes', label: 'Notas', icon: <StickyNote className="h-5 w-5" /> },
];

const mobileNavItems = navItems.slice(0, 5);

interface AppLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenAI: () => void;
  onLogout?: () => void;
}

export function AppLayout({ children, activeSection, onSectionChange, onOpenAI, onLogout }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings, updateSettings, importAllData, resetAllData } = useAppStore();

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const theme = settings.theme;
    return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, [settings.theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [isDark]);

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const handleExport = () => {
    const data = useAppStore.getState();
    const exportData_: Partial<AppData> = {
      settings: data.settings,
      aiProfile: data.aiProfile,
      events: data.events,
      sports: data.sports,
      yogaExercises: data.yogaExercises,
      meditationSessions: data.meditationSessions,
      yogaSessions: data.yogaSessions,
      books: data.books,
      diaryEntries: data.diaryEntries,
      limitingBeliefs: data.limitingBeliefs,
      goals: data.goals,
      habits: data.habits,
      transactions: data.transactions,
      savingsGoals: data.savingsGoals,
      budgets: data.budgets,
      sleepLogs: data.sleepLogs,
      hydrationLogs: data.hydrationLogs,
      healthEntries: data.healthEntries,
      quickNotes: data.quickNotes,
      conversations: data.conversations,
      projects: data.projects,
    };
    exportData(exportData_);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importData<Partial<AppData>>(file);
      if (data) {
        importAllData(data as AppData);
        alert('Datos importados correctamente');
      }
    } catch {
      alert('Error al importar datos');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Mi Desarrollo
                </h1>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isCollapsed && 'justify-center px-2'
                  )}
                  onClick={() => onSectionChange(item.id)}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-2 border-t space-y-1">
            <Button
              variant="ghost"
              className={cn('w-full justify-start gap-3', isCollapsed && 'justify-center px-2')}
              onClick={onOpenAI}
            >
              <Bot className="h-5 w-5" />
              {!isCollapsed && <span>Asistente AI</span>}
            </Button>

            <Button
              variant="ghost"
              className={cn('w-full justify-start gap-3', isCollapsed && 'justify-center px-2')}
              onClick={handleThemeToggle}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {!isCollapsed && <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
            </Button>

            {!isCollapsed && (
              <>
                <div className="flex gap-1 px-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                  <label className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        Importar
                      </span>
                    </Button>
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>
                </div>

                {onLogout && (
                  <Button variant="ghost" className="w-full justify-start gap-3" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                      <span>Borrar Datos</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará todos tus datos guardados. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={resetAllData} className="bg-destructive text-destructive-foreground">
                        Eliminar todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-card z-40 flex items-center justify-between px-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Mi Desarrollo
                </h1>
              </div>
              <ScrollArea className="flex-1 p-2">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        onSectionChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
              <div className="p-2 border-t space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={onOpenAI}>
                  <Bot className="h-5 w-5" />
                  <span>Asistente AI</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleThemeToggle}>
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </Button>
                {onLogout && (
                  <Button variant="ghost" className="w-full justify-start gap-3" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Mi Desarrollo
        </h1>

        <Button variant="ghost" size="icon" onClick={handleThemeToggle}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden lg:pt-0 pt-14 pb-16 lg:pb-0">
        <ScrollArea className="h-full">
          <div className="p-4 lg:p-6">{children}</div>
        </ScrollArea>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t bg-card z-40">
        <div className="flex h-full">
          {mobileNavItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                'flex-1 flex-col gap-1 h-full rounded-none',
                activeSection === item.id && 'bg-accent'
              )}
              onClick={() => onSectionChange(item.id)}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            className="flex-1 flex-col gap-1 h-full rounded-none"
            onClick={onOpenAI}
          >
            <Bot className="h-5 w-5" />
            <span className="text-xs">AI</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
