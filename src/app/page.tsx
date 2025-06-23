// src/app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { AuthState, DEFAULT_AUTH_STATE, DEFAULT_USERS_STATE, DEFAULT_ADMIN_USER_ID } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [authState, setAuthState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure default users are present if none exist
    if (authState.users.length === 0) {
      console.log("[HomePage] Initializing default users as authState.users is empty.");
      setAuthState(prev => ({ ...prev, users: [...DEFAULT_USERS_STATE] }));
      // Re-check authState in the next render cycle after users are set
      return;
    }

    // If currentUser is not set, redirect to login
    if (!authState.currentUser) {
      console.log("[HomePage] No currentUser found, redirecting to /login");
      router.replace('/login');
    } else {
      console.log("[HomePage] currentUser found, redirecting to /dashboard");
      router.replace('/dashboard');
    }
    // Set loading to false after the logic runs, to avoid premature render if redirecting
    // Minor delay to ensure redirect starts before hiding loader
    const timer = setTimeout(() => setIsLoading(false), 100); 
    return () => clearTimeout(timer);

  }, [authState, router, setAuthState]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  // This part should ideally not be reached if redirection works correctly
  return null;
}
