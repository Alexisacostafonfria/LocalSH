// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { AuthState, DEFAULT_AUTH_STATE, DEFAULT_USERS_STATE } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [authState, setAuthState, isAuthInitialized] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  useEffect(() => {
    // Wait until the auth state has been loaded from localStorage
    if (!isAuthInitialized) {
      return;
    }

    // Ensure default users are present if none exist. This should run only once.
    if (authState.users.length === 0) {
      console.log("[HomePage] Initializing default users.");
      setAuthState(prev => ({ ...prev, users: [...DEFAULT_USERS_STATE] }));
      // Let the next effect cycle handle the redirect after state update.
      return;
    }

    // Now, perform the redirect based on the loaded state.
    if (!authState.currentUser) {
      console.log("[HomePage] No currentUser, redirecting to /login");
      router.replace('/login');
    } else {
      console.log("[HomePage] CurrentUser found, redirecting to /dashboard");
      router.replace('/dashboard');
    }
  }, [isAuthInitialized, authState, setAuthState, router]);

  // Show a loader while we determine the redirect target.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p>Cargando aplicación...</p>
    </div>
  );
}
