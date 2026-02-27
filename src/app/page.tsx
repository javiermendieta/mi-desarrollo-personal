'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Dashboard } from '@/components/modules/Dashboard';
import { CalendarModule } from '@/components/modules/CalendarModule';
import { SportsModule } from '@/components/modules/SportsModule';
import { YogaMeditationModule } from '@/components/modules/YogaMeditationModule';
import { ReadingModule } from '@/components/modules/ReadingModule';
import { DiaryModule } from '@/components/modules/DiaryModule';
import { GoalsModule } from '@/components/modules/GoalsModule';
import { HabitsModule } from '@/components/modules/HabitsModule';
import { FinanceModule } from '@/components/modules/FinanceModule';
import { HealthModule } from '@/components/modules/HealthModule';
import { NotesModule } from '@/components/modules/NotesModule';
import { ProgressModule } from '@/components/modules/ProgressModule';
import { ProjectsModule } from '@/components/modules/ProjectsModule';
import { AIAssistant } from '@/components/AIAssistant';
import { AuthForm } from '@/components/AuthForm';
import { useAppStore } from '@/lib/store';

// Helper para verificar si hay datos en localStorage
function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('personal-dev-storage');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    // Verificar si hay algún dato real (no solo defaults)
    const hasData = parsed?.state && (
      (parsed.state.events?.length > 0) ||
      (parsed.state.habits?.length > 0) ||
      (parsed.state.goals?.length > 0) ||
      (parsed.state.transactions?.length > 0) ||
      (parsed.state.sports?.length > 0) ||
      (parsed.state.books?.length > 0) ||
      (parsed.state.projects?.length > 0) ||
      (parsed.state.diaryEntries?.length > 0) ||
      (parsed.state.meditationSessions?.length > 0) ||
      (parsed.state.accountPlan?.length > 0) ||
      (parsed.state.pnlData?.length > 0)
    );
    return hasData;
  } catch {
    return false;
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const importAllData = useAppStore((s) => s.importAllData);

  console.log('=== Home render ===', { isAIOpen, activeSection });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      
      // Manejo seguro de JSON
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      
      if (data.user) {
        setIsAuthed(true);
        // Solo cargar de API si NO hay datos locales
        // Esto permite que localStorage sea la fuente principal
        if (!hasLocalData()) {
          await loadDataFromAPI();
        }
      }
    } catch {
      console.error('Error checking auth');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromAPI = async () => {
    try {
      const res = await fetch('/api/data');
      
      // Manejo seguro de JSON
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Error parsing JSON from API');
        return;
      }

      if (!data.error && Object.keys(data).length > 0) {
        importAllData({
          settings: data.settings || { theme: 'system', language: 'es', notifications: true, weekStartsOn: 1 },
          aiProfile: data.aiProfile || {},
          events: data.events || [],
          sports: data.sports || [],
          yogaExercises: data.yogaExercises || [],
          meditationSessions: data.meditationSessions || [],
          yogaSessions: data.yogaSessions || [],
          books: data.books || [],
          diaryEntries: data.diaryEntries || [],
          limitingBeliefs: data.limitingBeliefs || [],
          goals: data.goals || [],
          habits: data.habits || [],
          transactions: data.transactions || [],
          savingsGoals: data.savingsGoals || [],
          budgets: data.budgets || [],
          accountPlan: data.accountPlan || [],
          pnlData: data.pnlData || [],
          sleepLogs: data.sleepLogs || [],
          hydrationLogs: data.hydrationLogs || [],
          healthEntries: data.healthEntries || [],
          medicalAppointments: data.medicalAppointments || [],
          medicalTasks: data.medicalTasks || [],
          quickNotes: data.quickNotes || [],
          conversations: data.conversations || [],
          projects: data.projects || [],
          commercialLeads: data.commercialLeads || [],
          socialMediaPosts: data.socialMediaPosts || [],
          projectAlerts: data.projectAlerts || [],
        });
      }
    } catch (e) {
      console.error('Error loading data from API', e);
    }
  };

  const handleAuth = () => {
    setIsAuthed(true);
    // No cargar datos de API - usar localStorage como fuente principal
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar errores de logout
    }
    setIsAuthed(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'calendar':
        return <CalendarModule />;
      case 'sports':
        return <SportsModule />;
      case 'yoga':
        return <YogaMeditationModule />;
      case 'reading':
        return <ReadingModule />;
      case 'diary':
        return <DiaryModule />;
      case 'goals':
        return <GoalsModule />;
      case 'habits':
        return <HabitsModule />;
      case 'finances':
        return <FinanceModule />;
      case 'health':
        return <HealthModule />;
      case 'notes':
        return <NotesModule />;
      case 'progress':
        return <ProgressModule key={Date.now()} />;
      case 'projects':
        return <ProjectsModule />;
      default:
        return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthed) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <>
      <AppLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenAI={() => {
          console.log('=== onOpenAI called ===');
          setIsAIOpen(true);
        }}
        onLogout={handleLogout}
      >
        {renderSection()}
      </AppLayout>
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </>
  );
}
