
// src/components/layout/AppShell.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PanelLeft, Package, ShoppingCart, Archive, BarChartBig, TrendingUp, Settings as SettingsIcon, Menu, X, Briefcase,
  DollarSign, Users, FileText, Layers, Lightbulb, Wrench, BookOpenCheck, LogOut, Loader2, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { AuthState, DEFAULT_AUTH_STATE, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  pathname: string;
  onClick?: () => void;
  disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, pathname, onClick, disabled }) => (
  <Link href={disabled ? "#" : href} legacyBehavior passHref>
    <a
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        pathname === href && !disabled && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground"
      )}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
    >
      <Icon className="h-5 w-5" />
      {label}
    </a>
  </Link>
);

const baseNavItems = [
  { href: "/dashboard", icon: Layers, label: "Dashboard" },
  { href: "/products", icon: Package, label: "Catálogo" },
  { href: "/sales", icon: ShoppingCart, label: "Ventas" },
  { href: "/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/inventory", icon: Archive, label: "Inventario" },
  { href: "/reports", icon: BarChartBig, label: "Reportes" },
  { href: "/forecast", icon: TrendingUp, label: "Pronósticos" },
  { href: "/accounting", icon: BookOpenCheck, label: "Contabilidad" },
  { href: "/accounts-receivable", icon: FileText, label: "Cuentas por Cobrar" },
];

const adminNavItems = [
  { href: "/users", icon: Users, label: "Usuarios" },
  { href: "/settings", icon: Wrench, label: "Configuración" },
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [authState, setAuthState, isAuthInitialized] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  useEffect(() => {
    // Wait until the auth state has been loaded from localStorage.
    if (!isAuthInitialized) {
      return;
    }

    // Once state is loaded, perform the authentication check.
    // If there is no user, redirect to login, unless we are already on the login page.
    if (!authState.currentUser && pathname !== '/login') {
      console.log("[AppShell] No currentUser, redirecting to /login from pathname:", pathname);
      router.replace('/login');
    }
  }, [isAuthInitialized, authState.currentUser, pathname, router]);


  const closeMobileSheet = () => setMobileSheetOpen(false);

  const handleLogout = () => {
    setAuthState(prev => ({ ...prev, currentUser: null })); 
    closeMobileSheet();
    router.push('/login'); // Redirect to login after clearing currentUser
  };
  
  const currentUser = authState.currentUser;
  const isAdmin = currentUser?.role === 'admin';

  const visibleNavItems = [
    ...baseNavItems,
    ...adminNavItems.map(item => ({...item, disabled: !isAdmin}))
  ];

  // Show a global loader while we check auth status, but only for protected pages.
  // The login page can be rendered immediately.
  if (!isAuthInitialized && pathname !== '/login') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Verificando sesión...</p>
      </div>
    );
  }
  
  // If after initialization there is still no user, the effect above will have triggered a redirect.
  // We return null here to prevent a flash of the protected content.
  if (!currentUser && pathname !== '/login') {
    return null;
  }
  
  const sidebarContent = (
    <ScrollArea className="h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg" onClick={closeMobileSheet}>
            <Briefcase className="h-7 w-7 text-primary" />
            <span className="">Local Sales Hub</span>
          </Link>
        </div>
        <div className="flex-1 py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {visibleNavItems.map(item => (
              <NavItem key={item.href} {...item} pathname={pathname} onClick={closeMobileSheet} />
            ))}
          </nav>
        </div>
        {currentUser && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-left h-auto py-2 px-3">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.name.charAt(0).toUpperCase()}`} alt={currentUser.name} data-ai-hint="user avatar"/>
                    <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-sidebar-foreground truncate" title={currentUser.name}>{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser.role === 'admin' ? 'Administrador' : 'Cajero'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 bg-popover text-popover-foreground">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem>Perfil (Próximamente)</DropdownMenuItem> */}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        {sidebarContent}
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6 lg:hidden">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Alternar menú de navegación</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-sidebar text-sidebar-foreground border-sidebar-border w-[280px]">
              {sidebarContent}
            </SheetContent>
          </Sheet>
           <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="lg:hidden">Local Sales Hub</span>
          </Link>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
        <footer className="py-4 px-4 md:px-6 lg:px-8 text-center text-xs text-muted-foreground border-t border-border">
          <p>&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
        </footer>
      </div>
    </div>
  );
}
