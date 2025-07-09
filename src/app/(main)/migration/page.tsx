
// src/app/(main)/migration/page.tsx
"use client";

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ChevronsRight, AlertTriangle, ListChecks } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function MigrationPage() {
  
  const handleMigrateStep = (step: string) => {
    alert(`La funcionalidad para migrar "${step}" aún no está implementada.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asistente de Migración de Datos"
        description="Guía paso a paso para transferir los datos desde el almacenamiento local a la base de datos MySQL."
      />

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>¡Proceso Delicado!</AlertTitle>
        <AlertDescription>
          Este es un proceso técnico de un solo uso. Asegúrese de tener una copia de seguridad de sus datos antes de comenzar. Siga los pasos en orden.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">1</span>
              <span>Configurar Conexión</span>
            </CardTitle>
            <CardDescription>
              Asegúrese de que el backend tenga las credenciales para conectarse a su base de datos MySQL. (Paso manual)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este paso se realiza fuera de la aplicación, configurando las variables de entorno en su servidor.
            </p>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">2</span>
              <span>Migrar Datos Base</span>
            </CardTitle>
            <CardDescription>
              Transfiere las entidades principales que no tienen dependencias: Usuarios, Clientes y Productos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => handleMigrateStep('Usuarios, Clientes, Productos')} className="w-full" variant="outline">
              <ChevronsRight className="mr-2 h-4 w-4" /> Migrar Datos Base
            </Button>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">3</span>
              <span>Migrar Transacciones</span>
            </CardTitle>
            <CardDescription>
              Transfiere Pedidos y Ventas, vinculándolos con los datos base ya migrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => handleMigrateStep('Pedidos y Ventas')} className="w-full" variant="outline">
              <ChevronsRight className="mr-2 h-4 w-4" /> Migrar Transacciones
            </Button>
          </CardContent>
        </Card>
        
        {/* Step 4 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">4</span>
              <span>Migrar Registros</span>
            </CardTitle>
            <CardDescription>
              Transfiere el resto de los datos: Pagos de facturas, Cierres y el Historial de Actividad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handleMigrateStep('Pagos, Cierres, Historial')} className="w-full" variant="outline">
              <ChevronsRight className="mr-2 h-4 w-4" /> Migrar Registros
            </Button>
          </CardContent>
        </Card>

        {/* Step 5 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">5</span>
              <span>Verificación Final</span>
            </CardTitle>
            <CardDescription>
              Una vez migrado todo, verifique la integridad de los datos en su base de datos MySQL. (Paso manual)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use una herramienta como MySQL Workbench o DBeaver para confirmar que los datos se transfirieron correctamente.
            </p>
          </CardContent>
        </Card>
      </div>

       <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              <span>Siguientes Pasos (Post-Migración)</span>
            </CardTitle>
            <CardDescription>
              Una vez que los datos estén en la base de datos, el siguiente gran paso será refactorizar la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. <strong>Crear API Endpoints:</strong> Desarrollar la capa de API en Next.js para que la aplicación pueda comunicarse con la base de datos MySQL.</p>
            <p>2. <strong>Refactorizar Componentes:</strong> Reemplazar todos los hooks `useLocalStorageState` con llamadas a la nueva API para leer y escribir datos.</p>
            <p>3. <strong>Despliegue:</strong> Poner en producción la nueva versión de la aplicación que opera 100% con la base de datos.</p>
          </CardContent>
        </Card>
    </div>
  );
}
