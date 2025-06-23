// src/app/login/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { AuthState, User, DEFAULT_AUTH_STATE, DEFAULT_USERS_STATE } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, Loader2, Users as UsersIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authState, setAuthState, isAuthInitialized] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!isAuthInitialized) {
      return; // Wait for localStorage to be read
    }

    if (authState.currentUser) {
      console.log("[LoginPage] currentUser already set, redirecting to /dashboard.");
      router.replace('/dashboard');
      return;
    }

    // Initialize default users if none exist
    if (!authState.users || authState.users.length === 0) {
      console.log("[LoginPage] No users found in authState, initializing with default admin.");
      const defaultUsers = [...DEFAULT_USERS_STATE];
      setAvailableUsers(defaultUsers);
      setAuthState(prev => ({ ...prev, users: defaultUsers, currentUser: null }));
    } else {
      setAvailableUsers(authState.users);
    }
  }, [isAuthInitialized, authState.currentUser, authState.users, setAuthState, router]);

  const handleLogin = (user: User) => {
    setAuthState(prev => ({ ...prev, currentUser: user }));
    router.push('/dashboard');
  };

  if (!isAuthInitialized || authState.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Cargando o redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Briefcase className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Iniciar Sesión</CardTitle>
          <CardDescription>Selecciona tu perfil para continuar en Local Sales Hub.</CardDescription>
        </CardHeader>
        <CardContent>
          {availableUsers.length === 0 ? (
            <div className="text-center py-6">
              <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Inicializando usuarios...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  className="w-full h-16 justify-start text-left p-4 hover:bg-accent/80"
                  onClick={() => handleLogin(user)}
                >
                  <Avatar className="h-10 w-10 mr-4">
                     <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0).toUpperCase()}`} alt={user.name} data-ai-hint="user avatar placeholder"/>
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-base">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role === 'admin' ? 'Administrador' : 'Cajero'}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
       <footer className="py-8 px-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
        </footer>
    </div>
  );
}
