
// src/app/(main)/users/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, UserRole, AuthState, DEFAULT_USERS_STATE, DEFAULT_AUTH_STATE, DEFAULT_ADMIN_USER_ID } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const initialNewUserFormState = { username: '', name: '', role: 'cashier' as UserRole };

export default function UsersPage() {
  const [authState, setAuthState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [newUserForm, setNewUserForm] = useState(initialNewUserFormState);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      let currentUsers = authState.users;
      let currentLoggedInUser = authState.currentUser;

      if (!currentUsers || currentUsers.length === 0) {
        currentUsers = [...DEFAULT_USERS_STATE]; // Initialize with default admin
      }
      
      if (!currentLoggedInUser && currentUsers.some(u => u.id === DEFAULT_ADMIN_USER_ID)) {
        currentLoggedInUser = currentUsers.find(u => u.id === DEFAULT_ADMIN_USER_ID) || null;
      }
      
      setUsers(currentUsers);
      setCurrentUser(currentLoggedInUser);

      // Persist if changes were made during initialization
      if (JSON.stringify(authState.users) !== JSON.stringify(currentUsers) || 
          JSON.stringify(authState.currentUser) !== JSON.stringify(currentLoggedInUser)) {
        setAuthState(prev => ({ ...prev, users: currentUsers, currentUser: currentLoggedInUser }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, authState.users, authState.currentUser]); // Only depend on initial authState parts for this effect.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setNewUserForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRoleChange = (value: UserRole) => {
    if (editingUser) {
      setEditingUser(prev => prev ? { ...prev, role: value } : null);
    } else {
      setNewUserForm(prev => ({ ...prev, role: value }));
    }
  };

  const handleAddOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formToProcess = editingUser ? { username: editingUser.username, name: editingUser.name, role: editingUser.role } : newUserForm;

    if (!formToProcess.username.trim() || !formToProcess.name.trim()) {
      toast({ title: "Error", description: "Nombre de usuario y nombre son requeridos.", variant: "destructive" });
      return;
    }

    if (!editingUser && users.some(u => u.username.toLowerCase() === formToProcess.username.toLowerCase())) {
      toast({ title: "Error", description: "El nombre de usuario ya existe.", variant: "destructive" });
      return;
    }

    let updatedUsers;
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...editingUser, name: formToProcess.name, role: formToProcess.role } : u);
      toast({ title: "Usuario Actualizado", description: `"${formToProcess.name}" actualizado.` });
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        username: formToProcess.username.trim(),
        name: formToProcess.name.trim(),
        role: formToProcess.role,
      };
      updatedUsers = [...users, newUser];
      toast({ title: "Usuario Creado", description: `"${newUser.name}" añadido.` });
    }
    setUsers(updatedUsers);
    setAuthState(prev => ({ ...prev, users: updatedUsers }));
    setNewUserForm(initialNewUserFormState);
    setEditingUser(null);
  };
  
  const openEditForm = (user: User) => {
    setEditingUser({...user});
    setNewUserForm(initialNewUserFormState); // Clear add form
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
        toast({title: "Error", description: "No puedes eliminarte a ti mismo.", variant: "destructive"});
        setUserToDelete(null);
        return;
    }
     if (userToDelete.id === DEFAULT_ADMIN_USER_ID && users.filter(u => u.role === 'admin').length <= 1) {
      toast({ title: "Error", description: "No se puede eliminar al único administrador.", variant: "destructive" });
      setUserToDelete(null);
      return;
    }

    const updatedUsers = users.filter(u => u.id !== userToDelete.id);
    setUsers(updatedUsers);
    setAuthState(prev => ({ ...prev, users: updatedUsers }));
    toast({ title: "Usuario Eliminado", description: `"${userToDelete.name}" ha sido eliminado.` });
    setUserToDelete(null);
  };


  if (!isMounted) {
    return <div className="flex justify-center items-center h-full"><Users className="h-12 w-12 animate-pulse" /> Cargando...</div>;
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestión de Usuarios" description="Añade, edita o elimina usuarios del sistema y asigna roles." />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddOrUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  name="username"
                  value={editingUser ? editingUser.username : newUserForm.username}
                  onChange={handleInputChange}
                  disabled={!!editingUser} // Username cannot be changed after creation
                  required
                />
                 {editingUser && <p className="text-xs text-muted-foreground mt-1">El nombre de usuario no se puede cambiar.</p>}
              </div>
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={editingUser ? editingUser.name : newUserForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={editingUser ? editingUser.role : newUserForm.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="cashier">Cajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
                {editingUser && (
                    <Button type="button" variant="outline" onClick={() => { setEditingUser(null); setNewUserForm(initialNewUserFormState);}}>Cancelar Edición</Button>
                )}
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" /> {editingUser ? "Guardar Cambios" : "Añadir Usuario"}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Lista de Usuarios</CardTitle>
          <CardDescription>Usuarios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground">No hay usuarios registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre de Usuario</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-500/20 text-red-700' : 'bg-blue-500/20 text-blue-700'}`}>
                            {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditForm(user)} title="Editar Usuario">
                            <Edit2 className="h-4 w-4"/>
                        </Button>
                       <AlertDialogTrigger asChild>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setUserToDelete(user)} 
                            title="Eliminar Usuario"
                            disabled={user.id === currentUser?.id || (user.id === DEFAULT_ADMIN_USER_ID && users.filter(u => u.role === 'admin').length <= 1)}
                          >
                           <Trash2 className="h-4 w-4 text-destructive" />
                         </Button>
                       </AlertDialogTrigger>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
       <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => {if(!isOpen) setUserToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario "{userToDelete?.name}" ({userToDelete?.username}) será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
