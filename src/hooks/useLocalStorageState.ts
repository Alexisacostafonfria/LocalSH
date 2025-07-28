
// src/hooks/useLocalStorageState.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

type StorageType = 'local' | 'db';

// Helper to get value from localStorage
const getStoredLocalValue = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * A custom hook to manage state, with persistence to either localStorage or a database via API.
 * @param key The key for localStorage or the API endpoint path segment.
 * @param defaultValue The default value to use initially.
 * @param storageType 'local' for localStorage, 'db' for database.
 * @returns A tuple: [state, setState, isInitialized]
 */
function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T),
  storageType: StorageType = 'local'
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  
  const { toast } = useToast();
  const [state, setState] = useState<T>(() => 
    typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect for initial data fetching (from localStorage or DB)
  useEffect(() => {
    if (!isInitialized) {
      if (storageType === 'local') {
        const storedValue = getStoredLocalValue(key, typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue);
        setState(storedValue);
        setIsInitialized(true);
      } else if (storageType === 'db') {
        const fetchFromDb = async () => {
          try {
            const response = await fetch(`/api/settings/${key}`);
            if (response.ok) {
              const data = await response.json();
              setState(data.value);
            } else if (response.status === 404) {
              // If not found, use default value
              setState(typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue);
            } else {
              throw new Error(`Failed to fetch setting: ${response.statusText}`);
            }
          } catch (error) {
            console.error(`Error fetching DB setting for key "${key}":`, error);
            toast({ title: `Error al Cargar Configuración (${key})`, description: (error as Error).message, variant: 'destructive' });
          } finally {
            setIsInitialized(true);
          }
        };
        fetchFromDb();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isInitialized, storageType]);

  // Effect for saving data back to the chosen storage
  useEffect(() => {
    if (!isInitialized) {
      return; // Do not save until initialized
    }

    if (storageType === 'local') {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
      }
    } else if (storageType === 'db') {
      const saveToDb = async () => {
        try {
          await fetch(`/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: state }),
          });
        } catch (error) {
          console.error(`Error saving DB setting for key "${key}":`, error);
          toast({ title: `Error al Guardar Configuración (${key})`, description: (error as Error).message, variant: 'destructive' });
        }
      };
      // Debounce or use a specific trigger to avoid excessive writes
      // For simplicity here, we save on every state change after initialization
      // A more complex app might want to add a "Save" button to trigger this.
      saveToDb();
    }
  }, [key, state, isInitialized, storageType, toast]);

  return [state, setState, isInitialized];
}

export default useLocalStorageState;
