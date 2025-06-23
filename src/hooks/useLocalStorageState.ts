
// src/hooks/useLocalStorageState.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // This function is called only for the initial state.
    // We log this to be clear it's the useState initialization, not from localStorage yet.
    console.log(`[LocalStorage] Initializing useState for key: "${key}" with provided defaultValue. localStorage will be checked in an effect.`);
    const initialVal = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    return initialVal;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load the value from localStorage after the component has mounted on the client.
  useEffect(() => {
    console.log(`[LocalStorage] Attempting to initialize state from localStorage for key: "${key}"`);
    if (typeof window !== 'undefined') {
      try {
        console.log(`[LocalStorage] Reading from localStorage for key: "${key}"`);
        const storedValue = window.localStorage.getItem(key);
        if (storedValue !== null) {
          console.log(`[LocalStorage] Value found for key "${key}":`, storedValue.substring(0, 100) + (storedValue.length > 100 ? '...' : ''));
          setState(JSON.parse(storedValue) as T);
          console.log(`[LocalStorage] State updated from localStorage for key: "${key}"`);
        } else {
          console.log(`[LocalStorage] No value found in localStorage for key: "${key}". Using current state (default or previously set).`);
          // If no value in localStorage, state remains as initialized (with defaultValue).
          // The save effect (below) will persist this default if it's the first time or if it was cleared.
        }
      } catch (error) {
        console.error(`[LocalStorage] Error reading or parsing localStorage key "${key}":`, error);
        // If an error occurs, state remains as initialized with defaultValue.
      } finally {
        setIsInitialized(true);
        console.log(`[LocalStorage] Initialization from localStorage attempt complete for key: "${key}". isInitialized: true.`);
      }
    } else {
      console.log(`[LocalStorage] Not on client (SSR?), skipping localStorage read for key: "${key}". isInitialized will remain false on server.`);
      // On SSR, we can't access localStorage. isInitialized remains false. Save effect won't run.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if key changes.

  // Effect to save the state to localStorage whenever it changes on the client,
  // but only after initialization attempt.
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      console.log(`[LocalStorage] Attempting to save state for key: "${key}". Current state value:`, JSON.stringify(state).substring(0, 100) + (JSON.stringify(state).length > 100 ? '...' : ''));
      try {
        const valueToStore = JSON.stringify(state);
        window.localStorage.setItem(key, valueToStore);
        console.log(`[LocalStorage] Successfully saved state for key: "${key}"`);
      } catch (error) {
        console.error(`[LocalStorage] Error writing to localStorage for key "${key}":`, error);
      }
    } else if (typeof window !== 'undefined' && !isInitialized) {
      console.log(`[LocalStorage] Save skipped for key "${key}": still initializing from localStorage or on server.`);
    } else if (typeof window === 'undefined') {
        // This case should ideally not be reached if isInitialized is false on server.
        console.log(`[LocalStorage] Save skipped for key "${key}": on server (window undefined).`);
    }
  }, [key, state, isInitialized]);

  const stableSetState = useCallback((valueOrFn: React.SetStateAction<T>) => {
    console.log(`[LocalStorage] Custom setState invoked for key: "${key}"`);
    setState(valueOrFn);
  }, [key]); // setState from useState is stable, key dependency for completeness if hook re-instantiated with different key.

  return [state, stableSetState];
}

export default useLocalStorageState;
