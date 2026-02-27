'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { debounce } from 'lodash';

// Debounced save functions for each data type
const saveToDB = debounce(async (type: string, data: unknown, userId: string) => {
  try {
    const endpoints: Record<string, string> = {
      events: '/api/events',
      sports: '/api/sports',
      books: '/api/books',
      goals: '/api/goals',
      habits: '/api/habits',
      transactions: '/api/transactions',
      diaryEntries: '/api/diary',
      projects: '/api/projects',
      commercialLeads: '/api/commercial-leads',
      accountPlan: '/api/account-plan',
      pnlData: '/api/pnl',
      sleepLogs: '/api/sleep',
      hydrationLogs: '/api/hydration',
      healthEntries: '/api/health',
      quickNotes: '/api/notes',
      meditationSessions: '/api/meditation',
    };

    const endpoint = endpoints[type];
    if (!endpoint) return;

    // For arrays, we sync the entire array
    // For single items, we sync that item
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sync', data, userId }),
    });

    if (!res.ok) {
      console.error(`Error syncing ${type} to DB`);
    }
  } catch (e) {
    console.error(`Error in saveToDB for ${type}:`, e);
  }
}, 2000); // 2 second debounce

/**
 * Hook que sincroniza automáticamente los cambios del store con la base de datos.
 * Se activa cada vez que hay un cambio en los datos del store.
 */
export function useDBSync() {
  const store = useAppStore();
  const isFirstRender = useRef(true);
  const lastSyncedRef = useRef<string>('');

  // Function to sync all data to DB
  const syncAllToDB = useCallback(async () => {
    // Skip if no user is logged in (check for userId in cookie)
    const userId = document.cookie.match(/userId=([^;]+)/)?.[1];
    if (!userId) return;

    // Create a hash of current state to avoid unnecessary syncs
    const stateHash = JSON.stringify({
      projects: store.projects.length,
      accountPlan: store.accountPlan.length,
      pnlData: store.pnlData.length,
      transactions: store.transactions.length,
      events: store.events.length,
      habits: store.habits.length,
      goals: store.goals.length,
    });

    if (lastSyncedRef.current === stateHash) return;
    lastSyncedRef.current = stateHash;

    // Sync each data type
    const dataToSync = [
      { key: 'projects', data: store.projects },
      { key: 'accountPlan', data: store.accountPlan },
      { key: 'pnlData', data: store.pnlData },
      { key: 'transactions', data: store.transactions },
      { key: 'events', data: store.events },
      { key: 'habits', data: store.habits },
      { key: 'goals', data: store.goals },
      { key: 'sports', data: store.sports },
      { key: 'books', data: store.books },
      { key: 'diaryEntries', data: store.diaryEntries },
      { key: 'commercialLeads', data: store.commercialLeads },
      { key: 'sleepLogs', data: store.sleepLogs },
      { key: 'hydrationLogs', data: store.hydrationLogs },
      { key: 'healthEntries', data: store.healthEntries },
      { key: 'quickNotes', data: store.quickNotes },
      { key: 'meditationSessions', data: store.meditationSessions },
    ];

    for (const { key, data } of dataToSync) {
      if (data && Array.isArray(data) && data.length > 0) {
        await saveToDB(key, data, userId);
      }
    }
  }, [store]);

  // Sync on mount and when data changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Skip first render (data is being loaded)
    }

    // Debounced sync
    const timeoutId = setTimeout(() => {
      syncAllToDB();
    }, 3000); // 3 second delay after change

    return () => clearTimeout(timeoutId);
  }, [
    store.projects,
    store.accountPlan,
    store.pnlData,
    store.transactions,
    store.events,
    store.habits,
    store.goals,
    store.sports,
    store.books,
    store.diaryEntries,
    store.commercialLeads,
    syncAllToDB,
  ]);

  return { syncAllToDB };
}
