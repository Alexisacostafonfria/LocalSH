// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { AuthState, DEFAULT_AUTH_STATE } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [authState, _, isAuthInitialized] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  useEffect(() => {
    // Wait for the hook to be initialized from localStorage
    if (!isAuthInitialized) {
      return;
    }

    // Once initialized, redirect based on currentUser status
    if (authState.currentUser) {
      console.log("[HomePage] CurrentUser found, redirecting to /dashboard");
      router.replace('/dashboard');
    } else {
      console.log("[HomePage] No currentUser, redirecting to /login");
      router.replace('/login');
    }
  }, [isAuthInitialized, authState.currentUser, router]);

  // Display a loader to prevent screen flicker during the check
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p>Cargando aplicación...</p>
    </div>
  );
}
