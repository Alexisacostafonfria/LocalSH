// src/app/(main)/migration-plan/page.tsx
"use client";

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Database, AlertTriangle } from 'lucide-react';
import { AuthState, DEFAULT_AUTH_STATE } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-muted p-4 rounded-md text-xs text-muted-foreground overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const MigrationStep = ({ step, title, children }: { step: number, title: string, children: React.ReactNode }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{step}</div>
            <div className="w-px h-full bg-border"></div>
        </div>
        <div className="pb-8 flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <div className="text-sm text-muted-foreground space-y-2">
                {children}
            </div>
        </div>
    </div>
);


export default function MigrationPlanPage() {
  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);
  const isAdmin = authState.currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Solo los administradores pueden ver el plan de migración.</p>
      </div>
    );
  }

  const productTableSQL = `CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(50),
    description TEXT,
    image_url VARCHAR(2048),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plan de Migración a Base de Datos"
        description="Documentación técnica sobre la migración de datos del almacenamiento local a MySQL."
      />
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" />Estado del Módulo de Productos</CardTitle>
          <CardDescription>
            El módulo de "Catálogo de Productos" ha sido completamente migrado y ahora opera 100% contra la base de datos MySQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>La carga inicial de productos proviene de la base de datos.</li>
                <li>La creación, edición y eliminación de productos actualizan la base de datos en tiempo real.</li>
                <li>El almacenamiento de imágenes está configurado y las rutas se guardan en la base de datos.</li>
                <li>Se ha eliminado la dependencia de `localStorage` para este módulo.</li>
            </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-6 w-6 text-primary"/>Esquema de la Base de Datos</CardTitle>
          <CardDescription>
            Definición de la tabla de productos en MySQL. Este es el esquema actual en uso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock>{productTableSQL}</CodeBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan de Acción (Estrategia de Migración)</CardTitle>
          <CardDescription>
            Esta es la estrategia que se siguió para el módulo de Productos y que sirve como modelo para migrar los módulos restantes (Ventas, Clientes, Pedidos, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative">
                <MigrationStep step={1} title="Crear el Esquema de la Base de Datos">
                    <p>Definir y crear la tabla necesaria en la base de datos MySQL. Para productos, se usó el esquema mostrado arriba.</p>
                </MigrationStep>
                <MigrationStep step={2} title="Implementar API de Backend">
                    <p>Crear los endpoints de la API en Next.js (ej: `/api/products`) que manejen las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para una entidad.</p>
                    <p>Estos endpoints se comunican con la base de datos a través de un servicio (ej: `productService.ts`).</p>
                </MigrationStep>
                 <MigrationStep step={3} title="Manejo de Archivos (Imágenes)">
                    <p>Crear un endpoint de API (`/api/upload`) para manejar la subida de archivos.</p>
                    <p>Guardar los archivos en una carpeta pública del servidor (`/public/uploads/...`) y almacenar la URL resultante en la base de datos.</p>
                </MigrationStep>
                <MigrationStep step={4} title="Refactorizar el Frontend">
                    <p>Modificar la página del módulo (ej: `products/page.tsx`) para que deje de usar `useLocalStorageState`.</p>
                    <p>Reemplazarlo con llamadas a la API de backend para obtener y modificar los datos. Utilizar `useState` y `useEffect` para manejar el estado de carga y los datos recibidos.</p>
                </MigrationStep>
                 <MigrationStep step={5} title="Proceso de Migración de Datos (Paso Manual)">
                    <p>Para migrar los datos existentes del `localStorage` de un usuario a la base de datos, se necesitará una herramienta o script único. Este podría ser una página especial en "Configuración" que lea los datos del `localStorage` y los envíe a la API para su inserción masiva en la base de datos.</p>
                    <p><strong>Este paso aún no se ha implementado</strong> y será necesario para mover los datos de ventas, clientes, etc., de los sistemas existentes a la nueva base de datos.</p>
                </MigrationStep>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}