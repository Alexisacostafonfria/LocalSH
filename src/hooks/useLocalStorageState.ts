// src/hooks/useLocalStorageState.ts
"use client";

import { useState, useEffect } from 'react';

/**
 * A custom hook to manage state in localStorage.
 * It returns the state, a setter function, and a boolean indicating if the state has been initialized from localStorage.
 * @param key The key to use in localStorage.
 * @param defaultValue The default value to use if no value is found in localStorage.
 * @returns A tuple: [state, setState, isInitialized]
 */
function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(() => {
    const initialVal = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    return initialVal;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load the value from localStorage after the component has mounted.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue !== null) {
          setState(JSON.parse(storedValue) as T);
        }
      } catch (error) {
        console.error(`[LocalStorage] Error reading or parsing localStorage key "${key}":`, error);
      } finally {
        setIsInitialized(true);
      }
    }
  }, [key]);

  // Effect to save the state to localStorage whenever it changes, but only after initialization.
  useEffect(() => {
    if (isInitialized) {
      try {
        const valueToStore = JSON.stringify(state);
        window.localStorage.setItem(key, valueToStore);
      } catch (error) {
        console.error(`[LocalStorage] Error writing to localStorage for key "${key}":`, error);
      }
    }
  }, [key, state, isInitialized]);

  return [state, setState, isInitialized];
}

export default useLocalStorageState;
