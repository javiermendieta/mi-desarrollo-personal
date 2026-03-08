'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { debounce } from 'lodash';

// Debounced sync function
const syncToDB = debounce(async (data: Record<string, unknown[]>) => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      console.error('Error syncing to DB');
    } else {
      console.log('Data synced to DB successfully');
    }
  } catch (e) {
    console.error('Error in syncToDB:', e);
  }
}, 3000); // 3 second debounce

/**
 * Hook que sincroniza automáticamente los datos con la base de datos.
 * Se activa cuando el usuario cambia datos en cualquier módulo.
 */
export function useDBSync() {
  const store = useAppStore();
  const isFirstRender = useRef(true);
  const lastSyncedRef = useRef<string>('');

  // Create a snapshot of relevant data
  const getDataSnapshot = useCallback(() => {
    return JSON.stringify({
      accountPlan: store.accountPlan.length,
      transactions: store.transactions.length,
      pnlData: store.pnlData.length,
      projects: store.projects.length,
      events: store.events.length,
      habits: store.habits.length,
      goals: store.goals.length,
    });
  }, [store]);

  // Sync function
  const sync = useCallback(() => {
    const snapshot = getDataSnapshot();
    
    // Skip if nothing changed
    if (lastSyncedRef.current === snapshot) return;
    lastSyncedRef.current = snapshot;

    // Prepare data to sync
    const dataToSync: Record<string, unknown[]> = {};

    if (store.accountPlan.length > 0) {
      dataToSync.accountPlan = store.accountPlan;
    }
    if (store.transactions.length > 0) {
      dataToSync.transactions = store.transactions;
    }
    if (store.pnlData.length > 0) {
      dataToSync.pnlData = store.pnlData;
    }
    if (store.projects.length > 0) {
      dataToSync.projects = store.projects;
    }
    if (store.events.length > 0) {
      dataToSync.events = store.events;
    }
    if (store.habits.length > 0) {
      dataToSync.habits = store.habits;
    }
    if (store.goals.length > 0) {
      dataToSync.goals = store.goals;
    }

    // Only sync if there's data
    if (Object.keys(dataToSync).length > 0) {
      syncToDB(dataToSync);
    }
  }, [store, getDataSnapshot]);

  // Sync on data changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    sync();
  }, [
    store.accountPlan,
    store.transactions,
    store.pnlData,
    store.projects,
    store.events,
    store.habits,
    store.goals,
    sync,
  ]);

  return { sync };
}
