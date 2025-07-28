// src/hooks/useLocalStorageState.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

// Helper function to safely get value from localStorage
const getStoredValue = <T>(key: string, defaultValue: T): T => {
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
 * A custom hook to manage state in localStorage, ensuring it's synchronized with the browser's storage.
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
    // We only want to access localStorage on the client, so we start with the default value
    // and let the useEffect handle the hydration.
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isInitialized) {
        const storedValue = getStoredValue(key, typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue);
        setState(storedValue);
        setIsInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isInitialized]); // Only run this once on mount

  // Save to localStorage whenever state changes (client-side only)
  useEffect(() => {
    // We only want to save to localStorage after the initial value has been loaded.
    if (isInitialized) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
      }
    }
  }, [key, state, isInitialized]);

  return [state, setState, isInitialized];
}

export default useLocalStorageState;
