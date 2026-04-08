'use client';

import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

/**
 * Hook para verificar si el store de Zustand se ha hidratado desde localStorage.
 * Esto es necesario porque Zustand con persist middleware puede tardar un momento
 * en hidratarse en el cliente, especialmente durante SSR.
 * 
 * Usamos el patrón recomendado por Zustand para verificar hidratación.
 */
export function useHydration() {
  // Usamos el estado de hidratación directamente desde el store
  // Zustand persist expone _hasHydrated como una función
  const store = useAppStore;
  
  // Verificar hidratación de forma segura
  // Durante SSR, esto será false
  if (typeof window === 'undefined') {
    return false;
  }
  
  // En el cliente, verificar si el store tiene el método hasHydrated
  if (store.persist?.hasHydrated) {
    return store.persist.hasHydrated();
  }
  
  // Si no hay persist middleware, asumimos que está hidratado
  return true;
}

/**
 * Hook alternativo que re-renderiza cuando la hidratación se completa
 */
export function useHydrationState() {
  // Este hook causa un re-render cuando la hidratación se completa
  const hydrated = useAppStore(
    useShallow((state) => (state as unknown as { _hydrated?: boolean })._hydrated ?? false)
  );
  
  return hydrated;
}
