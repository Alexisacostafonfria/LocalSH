
// src/app/(main)/customers/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search, Edit2, Trash2, User, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Customer, AuthState, DEFAULT_AUTH_STATE } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useLocalStorageState from '@/hooks/useLocalStorageState';

interface CustomerFormData extends Omit<Customer, 'id'> {
  id?: string;
}

const initialCustomerFormState: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  personalId: '',
  cardNumber: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(initialCustomerFormState);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { toast } = useToast();
  const isAdmin = authState.currentUser?.role === 'admin';

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener clientes.' }));
        throw new Error(errorData.message);
      }
      const data: Customer[] = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setFetchError(error instanceof Error ? error.message : 'No se pudieron cargar los clientes desde la base de datos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (editingCustomer) {
      setCustomerForm({
        id: editingCustomer.id,
        name: editingCustomer.name,
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        address: editingCustomer.address || '',
        personalId: editingCustomer.personalId || '',
        cardNumber: editingCustomer.cardNumber || '',
      });
    } else {
      setCustomerForm(initialCustomerFormState);
    }
  }, [editingCustomer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    let formattedValue = "";
    for (let i = 0; i < rawValue.length; i++) {
      if (i > 0 && i % 4 === 0 && i < 16) { 
        formattedValue += "-";
      }
      if (formattedValue.length < 19) { 
        formattedValue += rawValue[i];
      } else {
        break;
      }
    }
    setCustomerForm(prev => ({ ...prev, cardNumber: formattedValue.slice(0,19) }));
  };

  const handleSubmit = async () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para realizar esta acción.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    if (!customerForm.name) {
      toast({ title: "Error de Validación", description: "El nombre del cliente es obligatorio.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    const payload: Customer = {
      id: editingCustomer?.id || crypto.randomUUID(),
      name: customerForm.name,
      phone: customerForm.phone || undefined,
      email: customerForm.email || undefined,
      address: customerForm.address || undefined,
      personalId: customerForm.personalId || undefined,
      cardNumber: customerForm.cardNumber || undefined,
    };
    
    try {
        const apiUrl = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
        const method = editingCustomer ? 'PUT' : 'POST';
        
        const response = await fetch(apiUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el cliente.');
        }

        toast({
            title: editingCustomer ? "Cliente Actualizado" : "Cliente Creado",
            description: `"${payload.name}" ha sido guardado en la base de datos.`,
        });

        fetchCustomers();
        setIsDialogOpen(false);
    } catch (error) {
        console.error("Error saving customer:", error);
        toast({ title: "Error al Guardar", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const openAddDialog = () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para añadir clientes.", variant: "destructive" });
      return;
    }
    setEditingCustomer(null);
    setCustomerForm(initialCustomerFormState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para editar clientes.", variant: "destructive" });
      return;
    }
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
     if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para eliminar clientes.", variant: "destructive" });
      return;
    }
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin || !customerToDelete) return;
    
    try {
        const response = await fetch(`/api/customers/${customerToDelete.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el cliente.');
        }

        toast({ title: "Cliente Eliminado", description: `"${customerToDelete.name}" ha sido eliminado.`, variant: "default" });
        fetchCustomers();
    } catch (error) {
        console.error("Error deleting customer:", error);
        toast({ title: "Error al Eliminar", description: (error as Error).message, variant: "destructive" });
    } finally {
        setCustomerToDelete(null);
        setIsDeleteDialogOpen(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTermLower) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTermLower)) ||
        (customer.address && customer.address.toLowerCase().includes(searchTermLower)) ||
        (customer.personalId && customer.personalId.toLowerCase().includes(searchTermLower))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader title="Gestión de Clientes" description="Administra la información de tus clientes.">
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Cliente
        </Button>
      </PageHeader>

      {fetchError && (<Alert variant="destructive"><AlertTriangle className="h-5 w-5" /><AlertTitle>Error de Conexión</AlertTitle><AlertDescription>{fetchError} <br/>Asegúrate de haber creado la tabla `customers` en tu base de datos y de haber añadido la columna `address`.</AlertDescription></Alert>)}

      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar por nombre, teléfono, dirección, ID..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div></CardContent></Card>

      <Card className="flex-1 flex flex-col min-h-0"><CardContent className="flex-1 overflow-y-auto p-4">
        {isLoading ? ( <div className="text-center py-10"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Cargando clientes...</p></div>
        ) : filteredCustomers.length === 0 && !fetchError ? (
            <div className="text-center py-10 text-muted-foreground"><User className="mx-auto h-12 w-12 mb-4" /><p className="text-lg">No se encontraron clientes.</p><p>Añade tu primer cliente para empezar.</p></div>
        ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="hidden lg:table-cell">Dirección</TableHead>
                <TableHead className="hidden lg:table-cell">ID Personal</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow></TableHeader>
              <TableBody>{filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={customer.name}>{customer.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{customer.phone || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[250px] truncate" title={customer.address}>{customer.address || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{customer.personalId || 'N/A'}</TableCell>
                    {isAdmin && (<TableCell className="text-right"><div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)} title="Editar"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(customer)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div></TableCell>)}
                  </TableRow>
              ))}</TableBody>
            </Table></div>
        )}
      </CardContent></Card>
      
      {isAdmin && isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader><DialogTitle className="font-headline">{editingCustomer ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle><DialogDescription>{editingCustomer ? 'Actualiza los detalles del cliente.' : 'Completa la información del nuevo cliente.'}</DialogDescription></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="md:col-span-2"><Label htmlFor="name">Nombre Completo *</Label><Input id="name" name="name" value={customerForm.name} onChange={handleInputChange} /></div>
              <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" name="phone" value={customerForm.phone} onChange={handleInputChange} /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={customerForm.email} onChange={handleInputChange} /></div>
              <div className="md:col-span-2"><Label htmlFor="address">Dirección Personal</Label><Input id="address" name="address" value={customerForm.address} onChange={handleInputChange} /></div>
              <div className="md:col-span-2"><Label htmlFor="personalId">ID Personal (DNI, CUIT, etc.)</Label><Input id="personalId" name="personalId" value={customerForm.personalId} onChange={handleInputChange} /></div>
              <div className="md:col-span-2"><Label htmlFor="cardNumber">Nro. Tarjeta (16 dígitos)</Label><Input id="cardNumber" name="cardNumber" value={customerForm.cardNumber} onChange={handleCardNumberChange} maxLength={19}/></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Guardando...' : (editingCustomer ? 'Guardar Cambios' : 'Añadir Cliente')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="font-headline">¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente a "{customerToDelete?.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
