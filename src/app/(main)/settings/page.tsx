
// src/app/(main)/settings/page.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AppSettings, DEFAULT_APP_SETTINGS, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, BackupData, AuthState, DEFAULT_AUTH_STATE, DEFAULT_USERS_STATE, DEFAULT_ADMIN_USER_ID, Order, InvoicePaymentRecord } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, AlertTriangle, Building, Image as ImageIcon, Trash2, Users, Printer } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const appSettingsSchema = z.object({
  lowStockThreshold: z.coerce.number().min(0, "Debe ser 0 o mayor"),
  currencySymbol: z.string().min(1, "Símbolo es requerido").max(5, "Máximo 5 caracteres"),
  allowTips: z.boolean(),
  invoicePaymentFeePercentage: z.coerce.number().min(0, "Debe ser 0 o mayor").max(100, "No puede exceder 100"),
  latePaymentFeePercentage: z.coerce.number().min(0, "Debe ser 0 o mayor").max(100, "No puede exceder 100"),
  autoPrintOrderTicket: z.boolean(),
});

const businessSettingsSchema = z.object({
  businessName: z.string().min(1, "Nombre del negocio es requerido."),
  address: z.string().min(1, "Dirección es requerida."),
  phone: z.string().min(1, "Teléfono es requerido."),
  email: z.string().email("Email inválido.").min(1, "Email es requerido."),
  taxId: z.string().optional(),
  website: z.string().url("URL de sitio web inválida.").optional().or(z.literal('')),
  logoUrl: z.string().optional(),
});


const LOCAL_STORAGE_KEYS = {
  products: 'products',
  sales: 'sales',
  customers: 'customers',
  orders: 'orders',
  invoicePayments: 'invoicePayments',
  appSettings: 'appSettings',
  accountingSettings: 'accountingSettings',
  businessSettings: 'businessSettings',
  authData: 'authData',
};

const MAX_LOGO_SIZE_MB = 1; // 1MB limit for logo

export default function SettingsPage() {
  const [appSettings, setAppSettingsState] = useLocalStorageState<AppSettings>(LOCAL_STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS);
  const [businessSettings, setBusinessSettingsState] = useLocalStorageState<BusinessSettings>(LOCAL_STORAGE_KEYS.businessSettings, DEFAULT_BUSINESS_SETTINGS);
  const [authState, setAuthState] = useLocalStorageState<AuthState>(LOCAL_STORAGE_KEYS.authData, DEFAULT_AUTH_STATE);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize AuthState if needed
  useEffect(() => {
    if (isMounted) {
      let currentUsers = authState.users;
      let currentLoggedInUser = authState.currentUser;

      if (!currentUsers || currentUsers.length === 0) {
        currentUsers = [...DEFAULT_USERS_STATE];
      }
      
      if (!currentLoggedInUser && currentUsers.some(u => u.id === DEFAULT_ADMIN_USER_ID)) {
        currentLoggedInUser = currentUsers.find(u => u.id === DEFAULT_ADMIN_USER_ID) || null;
      }
      
      if (JSON.stringify(authState.users) !== JSON.stringify(currentUsers) || 
          JSON.stringify(authState.currentUser) !== JSON.stringify(currentLoggedInUser)) {
        setAuthState(prev => ({ ...prev, users: currentUsers, currentUser: currentLoggedInUser }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, authState.users, authState.currentUser]);


  const { 
    control: appControl, 
    handleSubmit: handleAppSubmit, 
    reset: resetAppForm, 
    formState: { errors: appErrors, isDirty: isAppFormDirty } 
  } = useForm<AppSettings>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: appSettings,
  });

  const { 
    control: businessControl, 
    handleSubmit: handleBusinessSubmit, 
    reset: resetBusinessForm, 
    setValue: setBusinessFormValue,
    watch: watchBusinessForm,
    formState: { errors: businessErrors, isDirty: isBusinessFormDirty } 
  } = useForm<BusinessSettings>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: businessSettings,
  });

  const currentLogoUrl = watchBusinessForm("logoUrl");

  useEffect(() => {
    resetAppForm(appSettings); 
  }, [appSettings, resetAppForm]);

  useEffect(() => {
    resetBusinessForm(businessSettings);
    setLogoPreview(businessSettings.logoUrl || null);
  }, [businessSettings, resetBusinessForm]);

  useEffect(() => {
    if (currentLogoUrl !== undefined) { // Check if it's explicitly set (even to empty string)
        setLogoPreview(currentLogoUrl || null);
    }
  }, [currentLogoUrl]);


  const onAppSubmit = (data: AppSettings) => {
    setAppSettingsState(data);
    toast({
      title: "Configuración Guardada",
      description: "Tus preferencias generales han sido actualizadas.",
    });
  };

  const onBusinessSubmit = (data: BusinessSettings) => {
    setBusinessSettingsState(data);
    toast({
      title: "Información del Negocio Guardada",
      description: "Los datos de tu negocio han sido actualizados.",
    });
  };
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
        toast({
          title: "Logo Demasiado Grande",
          description: `Por favor, selecciona una imagen de menos de ${MAX_LOGO_SIZE_MB}MB.`,
          variant: "destructive",
        });
        if (logoInputRef.current) logoInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setBusinessFormValue("logoUrl", dataUrl, { shouldDirty: true });
        // setLogoPreview(dataUrl); // Preview is handled by watching form value
      };
      reader.onerror = () => {
        toast({
          title: "Error al Cargar Logo",
          description: "Hubo un problema al procesar el logo. Inténtalo de nuevo.",
          variant: "destructive",
        });
        if (logoInputRef.current) logoInputRef.current.value = "";
      }
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setBusinessFormValue("logoUrl", "", { shouldDirty: true });
    // setLogoPreview(null); // Preview is handled by watching form value
    if (logoInputRef.current) logoInputRef.current.value = "";
  };


  const handleExportData = () => {
    try {
      const backupData: Omit<BackupData, 'backupTimestamp'> & { backupTimestamp: string } = {
        products: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.products) || '[]'),
        sales: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.sales) || '[]'),
        customers: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.customers) || '[]'),
        orders: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.orders) || '[]'),
        invoicePayments: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.invoicePayments) || '[]'),
        appSettings: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.appSettings) || JSON.stringify(DEFAULT_APP_SETTINGS)),
        accountingSettings: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.accountingSettings) || JSON.stringify(DEFAULT_ACCOUNTING_SETTINGS)),
        businessSettings: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.businessSettings) || JSON.stringify(DEFAULT_BUSINESS_SETTINGS)),
        authData: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.authData) || JSON.stringify(DEFAULT_AUTH_STATE)),
        backupTimestamp: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `local-sales-hub-backup-${formattedDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      toast({
        title: "Exportación Exitosa",
        description: "Los datos de la aplicación han sido exportados.",
      });
    } catch (error) {
      console.error("Error al exportar datos:", error);
      toast({
        title: "Error de Exportación",
        description: "No se pudieron exportar los datos. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "No se seleccionó archivo", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const parsedData = JSON.parse(jsonString) as BackupData;

        // More robust check
        const requiredKeys: Array<keyof BackupData> = [
            'products', 'sales', 'customers', 'orders', 'appSettings', 
            'accountingSettings', 'businessSettings', 'authData', 'backupTimestamp'
        ];
        
        for (const key of requiredKeys) {
            if (!(key in parsedData)) {
                // Check for invoicePayments separately for backward compatibility
                if (key === 'invoicePayments' && !('invoicePayments' in parsedData)) {
                    continue; // It's ok if old backups don't have this
                }
                throw new Error(`El archivo de copia de seguridad es inválido o le falta la clave: "${key}".`);
            }
        }
        
        (window as any).__pendingRestoreData = parsedData;
        document.getElementById('restore-confirm-trigger')?.click();

      } catch (error) {
        console.error("Error al restaurar datos:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
        toast({
          title: "Error de Restauración",
          description: `No se pudieron restaurar los datos: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    const parsedData = (window as any).__pendingRestoreData as BackupData | undefined;
    if (!parsedData) {
       toast({ title: "Error Interno", description: "No se encontraron datos para restaurar.", variant: "destructive" });
       return;
    }

    try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.products, JSON.stringify(parsedData.products || []));
        localStorage.setItem(LOCAL_STORAGE_KEYS.sales, JSON.stringify(parsedData.sales || []));
        localStorage.setItem(LOCAL_STORAGE_KEYS.customers, JSON.stringify(parsedData.customers || []));
        localStorage.setItem(LOCAL_STORAGE_KEYS.orders, JSON.stringify(parsedData.orders || []));
        localStorage.setItem(LOCAL_STORAGE_KEYS.invoicePayments, JSON.stringify(parsedData.invoicePayments || [])); // Restore new data
        localStorage.setItem(LOCAL_STORAGE_KEYS.appSettings, JSON.stringify(parsedData.appSettings || DEFAULT_APP_SETTINGS));
        localStorage.setItem(LOCAL_STORAGE_KEYS.accountingSettings, JSON.stringify(parsedData.accountingSettings || DEFAULT_ACCOUNTING_SETTINGS));
        localStorage.setItem(LOCAL_STORAGE_KEYS.businessSettings, JSON.stringify(parsedData.businessSettings || DEFAULT_BUSINESS_SETTINGS));
        localStorage.setItem(LOCAL_STORAGE_KEYS.authData, JSON.stringify(parsedData.authData || DEFAULT_AUTH_STATE));


        toast({
            title: "Restauración Exitosa",
            description: "Los datos han sido restaurados. La aplicación se recargará.",
        });
        
        delete (window as any).__pendingRestoreData;
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error("Error al aplicar la restauración de datos:", error);
        toast({
          title: "Error al Aplicar Restauración",
          description: "No se pudieron guardar los datos restaurados. Revisa la consola.",
          variant: "destructive",
        });
    }
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-full"><Users className="h-12 w-12 animate-pulse" /> Cargando...</div>;
  }

  if (authState.currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">No tienes permiso para acceder a la Configuración.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Configuración de la Aplicación" description="Personaliza las opciones y preferencias de Local Sales Hub." />

      <form onSubmit={handleAppSubmit(onAppSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Preferencias Generales</CardTitle>
            <CardDescription>Ajusta los parámetros básicos de funcionamiento de la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <Label htmlFor="lowStockThreshold">Umbral de Bajo Stock</Label>
                <Controller
                  name="lowStockThreshold"
                  control={appControl}
                  render={({ field }) => (
                    <Input id="lowStockThreshold" type="number" {...field} />
                  )}
                />
                {appErrors.lowStockThreshold && <p className="text-sm text-destructive mt-1">{appErrors.lowStockThreshold.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Cantidad mínima antes de que un producto se considere con bajo stock.</p>
              </div>

              <div>
                <Label htmlFor="currencySymbol">Símbolo de Moneda</Label>
                <Controller
                  name="currencySymbol"
                  control={appControl}
                  render={({ field }) => (
                    <Input id="currencySymbol" {...field} />
                  )}
                />
                {appErrors.currencySymbol && <p className="text-sm text-destructive mt-1">{appErrors.currencySymbol.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Ej: $, €, Bs.</p>
              </div>

              <div>
                <Label htmlFor="invoicePaymentFeePercentage">% Cargo por Factura</Label>
                <Controller
                  name="invoicePaymentFeePercentage"
                  control={appControl}
                  render={({ field }) => (
                    <Input id="invoicePaymentFeePercentage" type="number" {...field} placeholder="Ej: 5" />
                  )}
                />
                {appErrors.invoicePaymentFeePercentage && <p className="text-sm text-destructive mt-1">{appErrors.invoicePaymentFeePercentage.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Porcentaje de recargo por ventas a crédito.</p>
              </div>

              <div>
                <Label htmlFor="latePaymentFeePercentage">% por Mora</Label>
                <Controller
                  name="latePaymentFeePercentage"
                  control={appControl}
                  render={({ field }) => (
                    <Input id="latePaymentFeePercentage" type="number" {...field} placeholder="Ej: 10" />
                  )}
                />
                {appErrors.latePaymentFeePercentage && <p className="text-sm text-destructive mt-1">{appErrors.latePaymentFeePercentage.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">Penalización porcentual por pagos atrasados.</p>
              </div>

            </div>
            
            <div className="flex items-center space-x-2 pt-2">
                <Controller
                    name="allowTips"
                    control={appControl}
                    render={({ field }) => (
                        <Switch
                        id="allowTips"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="allowTips">Permitir Propinas</Label>
            </div>
            {appErrors.allowTips && <p className="text-sm text-destructive mt-1">{appErrors.allowTips.message}</p>}
            <p className="text-xs text-muted-foreground -mt-5 ml-12">Habilita la opción de añadir propinas en ventas en efectivo.</p>
          </CardContent>
          <CardContent className="pt-0"> 
            <div className="flex justify-end">
              <Button type="submit" disabled={!isAppFormDirty} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" /> Guardar Preferencias
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

       <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Printer className="h-6 w-6 text-primary"/>Impresión Automática</CardTitle>
            <CardDescription>Configura la impresión automática para diferentes transacciones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <form onSubmit={handleAppSubmit(onAppSubmit)} className="space-y-4">
                 <div className="flex items-center space-x-2 pt-2">
                    <Controller
                        name="autoPrintOrderTicket"
                        control={appControl}
                        render={({ field }) => (
                            <Switch
                                id="autoPrintOrderTicket"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="autoPrintOrderTicket">Imprimir Ticket de Pedido Automáticamente</Label>
                </div>
                {appErrors.autoPrintOrderTicket && <p className="text-sm text-destructive mt-1">{appErrors.autoPrintOrderTicket.message}</p>}
                <p className="text-xs text-muted-foreground ml-12">
                  Si está activado, se enviará a imprimir un ticket de preparación cada vez que un pedido se marque como "En Preparación".
                </p>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!isAppFormDirty} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Save className="mr-2 h-4 w-4" /> Guardar Config. Impresión
                  </Button>
                </div>
            </form>
        </CardContent>
      </Card>


      <form onSubmit={handleBusinessSubmit(onBusinessSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Building className="h-6 w-6 text-primary"/>Información del Negocio</CardTitle>
            <CardDescription>Configura los datos de tu empresa que se usarán en la aplicación. Esto incluye el logo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessName">Nombre del Negocio</Label>
                <Controller name="businessName" control={businessControl} render={({ field }) => <Input id="businessName" {...field} />} />
                {businessErrors.businessName && <p className="text-sm text-destructive mt-1">{businessErrors.businessName.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Controller name="phone" control={businessControl} render={({ field }) => <Input id="phone" type="tel" {...field} />} />
                {businessErrors.phone && <p className="text-sm text-destructive mt-1">{businessErrors.phone.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="address">Dirección Completa</Label>
              <Controller name="address" control={businessControl} render={({ field }) => <Input id="address" {...field} />} />
              {businessErrors.address && <p className="text-sm text-destructive mt-1">{businessErrors.address.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Controller name="email" control={businessControl} render={({ field }) => <Input id="email" type="email" {...field} />} />
                {businessErrors.email && <p className="text-sm text-destructive mt-1">{businessErrors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="taxId">ID Fiscal (Ej: RIF, CUIT - Opcional)</Label>
                <Controller name="taxId" control={businessControl} render={({ field }) => <Input id="taxId" {...field} />} />
                {businessErrors.taxId && <p className="text-sm text-destructive mt-1">{businessErrors.taxId.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="website">Sitio Web (Opcional)</Label>
              <Controller name="website" control={businessControl} render={({ field }) => <Input id="website" type="url" placeholder="https://www.ejemplo.com" {...field} />} />
              {businessErrors.website && <p className="text-sm text-destructive mt-1">{businessErrors.website.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoUrlInput">Logo del Negocio</Label>
              <Input
                id="logoUrlInput"
                name="logoUrlInputName" 
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={handleLogoChange}
                className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                ref={logoInputRef}
              />
              <p className="text-xs text-muted-foreground">Tamaño máximo: {MAX_LOGO_SIZE_MB}MB. Formatos: PNG, JPG, WebP, SVG.</p>
              {logoPreview ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Vista Previa del Logo:</p>
                  <div className="relative w-40 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    <Image src={logoPreview} alt="Vista previa del logo" layout="fill" objectFit="contain" data-ai-hint="business logo preview"/>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Logo
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-muted-foreground/50 rounded-md p-4 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/70 mb-2" />
                    <p className="text-xs text-muted-foreground">Sube un logo para tu negocio.</p>
                </div>
              )}
               {businessErrors.logoUrl && <p className="text-sm text-destructive mt-1">{businessErrors.logoUrl.message}</p>}
            </div>

          </CardContent>
          <CardContent className="pt-0">
            <div className="flex justify-end">
              <Button type="submit" disabled={!isBusinessFormDirty} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" /> Guardar Datos del Negocio
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Copia de Seguridad y Restauración</CardTitle>
          <CardDescription>
            Guarda una copia de todos tus datos (productos, ventas, clientes, pedidos, pagos de facturas, configuración, etc.) o restaura desde un archivo previo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Exportar Datos</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Crea un archivo JSON con todos los datos de tu aplicación. Guarda este archivo en un lugar seguro.
            </p>
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Exportar Copia de Seguridad
            </Button>
          </div>
          <hr className="my-6" />
          <div>
            <h3 className="text-lg font-medium mb-2">Restaurar Datos</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Selecciona un archivo de copia de seguridad JSON para restaurar los datos de la aplicación.
            </p>
            <p className="text-xs text-destructive mb-3 flex items-center gap-1">
              <AlertTriangle size={14} /> ¡Atención! Esto sobrescribirá todos los datos actuales.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button id="restore-confirm-trigger" style={{ display: 'none' }}>Confirmar</button>
              </AlertDialogTrigger>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Seleccionar Archivo y Restaurar
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-headline">Confirmar Restauración</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres restaurar los datos desde el archivo seleccionado? 
                    Todos los datos actuales (productos, ventas, clientes, pedidos, configuración, usuarios, etc.) serán reemplazados. 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { if (fileInputRef.current) fileInputRef.current.value = ""; delete (window as any).__pendingRestoreData; }}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmRestore} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Sí, restaurar y sobrescribir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleRestoreData}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
