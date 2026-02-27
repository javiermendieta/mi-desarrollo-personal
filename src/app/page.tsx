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
      const data = await res.json();
      
      if (data.user) {
        setIsAuthed(true);
        await loadData();
      }
    } catch {
      console.error('Error checking auth');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/data');
      const data = await res.json();

      if (!data.error) {
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
          sleepLogs: data.sleepLogs || [],
          hydrationLogs: data.hydrationLogs || [],
          healthEntries: data.healthEntries || [],
          quickNotes: data.quickNotes || [],
          conversations: data.conversations || [],
          projects: data.projects || [],
        });
      }
    } catch (e) {
      console.error('Error loading data', e);
    }
  };

  const handleAuth = () => {
    setIsAuthed(true);
    loadData();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
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
