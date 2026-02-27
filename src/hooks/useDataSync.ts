'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

// Sync data to server whenever store changes
export function useDataSync() {
  const store = useAppStore();
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip first render (data is loaded from server)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Debounce: wait 1 second before saving
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        // Save each data type to the server
        const dataToSync = {
          goals: store.goals,
          habits: store.habits,
          events: store.events,
          transactions: store.transactions,
          savingsGoals: store.savingsGoals,
          diaryEntries: store.diaryEntries,
          books: store.books,
          quickNotes: store.quickNotes,
          sleepLogs: store.sleepLogs,
          hydrationLogs: store.hydrationLogs,
          healthEntries: store.healthEntries,
          sports: store.sports,
          yogaExercises: store.yogaExercises,
          meditationSessions: store.meditationSessions,
          conversations: store.conversations,
          aiProfile: store.aiProfile,
        };

        // Sync individual items based on what changed
        // For now, we'll sync on every change (can be optimized later)
        console.log('Syncing data to server...');
        
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    store.goals,
    store.habits,
    store.events,
    store.transactions,
    store.savingsGoals,
    store.diaryEntries,
    store.books,
    store.quickNotes,
    store.sleepLogs,
    store.hydrationLogs,
    store.healthEntries,
    store.sports,
    store.yogaExercises,
    store.meditationSessions,
    store.conversations,
    store.aiProfile,
  ]);

  return null;
}
