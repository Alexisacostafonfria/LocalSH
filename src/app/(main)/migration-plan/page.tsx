
// src/app/(main)/migration-plan/page.tsx
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Database, ChevronsRight, Key, Rows, Link2, History, Code2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const sqlScript = `
-- Script de Generación de Tablas para Local Sales Hub (MySQL 8.0+)
-- Arquitectura basada en claves primarias INT AUTO_INCREMENT para máxima compatibilidad y rendimiento.
-- --------------------------------------------------------------------------------------

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'cashier') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  cost_price DECIMAL(15, 2) DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  unit_of_measure VARCHAR(50),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_name (name),
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: customers
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  personal_id VARCHAR(50) UNIQUE,
  card_number VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  order_number INT NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY fk_orders_customer_id (customer_id),
  CONSTRAINT orders_fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  KEY fk_order_items_order_id (order_id),
  KEY fk_order_items_product_id (product_id),
  CONSTRAINT order_items_fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sales
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  operational_date DATE NOT NULL,
  origin ENUM('pos', 'order') NOT NULL,
  order_id INT,
  customer_id INT,
  customer_name VARCHAR(255),
  user_id INT NOT NULL,
  sub_total DECIMAL(15, 2) NOT NULL,
  discount DECIMAL(15, 2) DEFAULT 0.00,
  fees JSON,
  total_amount DECIMAL(15, 2) NOT NULL,
  payment_method ENUM('cash', 'transfer', 'invoice') NOT NULL,
  payment_details JSON NOT NULL,
  INDEX idx_sales_operational_date (operational_date),
  KEY fk_sales_order_id (order_id),
  KEY fk_sales_customer_id (customer_id),
  KEY fk_sales_user_id (user_id),
  CONSTRAINT sales_fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT sales_fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT sales_fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  KEY fk_sale_items_sale_id (sale_id),
  KEY fk_sale_items_product_id (product_id),
  CONSTRAINT sale_items_fk_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT sale_items_fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: invoice_payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  invoice_sale_id INT NOT NULL,
  payment_timestamp DATETIME NOT NULL,
  operational_date DATE NOT NULL,
  amount_paid DECIMAL(15, 2) NOT NULL,
  method ENUM('cash', 'transfer') NOT NULL,
  reference VARCHAR(255),
  tip DECIMAL(15, 2) DEFAULT 0.00,
  KEY fk_invoice_payments_invoice_sale_id (invoice_sale_id),
  CONSTRAINT invoice_payments_fk_sale FOREIGN KEY (invoice_sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: daily_closures
CREATE TABLE IF NOT EXISTS daily_closures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  closure_date DATE NOT NULL UNIQUE,
  expected_cash DECIMAL(15, 2) NOT NULL,
  counted_cash DECIMAL(15, 2) NOT NULL,
  cash_difference DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  total_revenue DECIMAL(15, 2) NOT NULL,
  total_cogs DECIMAL(15, 2) NOT NULL,
  gross_profit DECIMAL(15, 2) NOT NULL,
  total_transactions INT NOT NULL,
  cash_sales_amount DECIMAL(15, 2) NOT NULL,
  transfer_sales_amount DECIMAL(15, 2) NOT NULL,
  total_tips DECIMAL(15, 2) NOT NULL,
  invoice_payments_cash DECIMAL(15, 2) NOT NULL,
  invoice_payments_transfer DECIMAL(15, 2) NOT NULL,
  counted_cash_breakdown JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: monthly_closures
CREATE TABLE IF NOT EXISTS monthly_closures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    generation_date DATETIME NOT NULL,
    total_revenue DECIMAL(15, 2) NOT NULL,
    total_cogs DECIMAL(15, 2) NOT NULL,
    gross_profit DECIMAL(15, 2) NOT NULL,
    total_transactions INT NOT NULL,
    total_tips DECIMAL(15, 2) NOT NULL,
    UNIQUE KEY uk_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  user_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  description TEXT NOT NULL,
  INDEX idx_audit_log_timestamp (timestamp),
  KEY fk_audit_log_user_id (user_id),
  CONSTRAINT audit_log_fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: settings (Key-Value para configuraciones)
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(255) PRIMARY KEY,
  setting_value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;


export default function MigrationPlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plan de Migración a MySQL"
        description="Detalles técnicos y pasos para migrar los datos de la aplicación desde LocalStorage a una base de datos MySQL."
      />

      <Alert variant="warning">
        <Database className="h-5 w-5" />
        <AlertTitle>Visión General del Plan (Arquitectura Actualizada)</AlertTitle>
        <AlertDescription>
          Este documento describe el plan para migrar el almacenamiento a una base de datos MySQL. La arquitectura ha sido actualizada para usar claves primarias numéricas (INT AUTO_INCREMENT) en lugar de texto (UUIDs). Este cambio resuelve definitivamente los problemas de compatibilidad (Error 3780) y mejora el rendimiento general. El plan de acción y el script SQL a continuación reflejan esta nueva arquitectura robusta.
        </AlertDescription>
      </Alert>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Code2 />Script SQL de Creación de Tablas</CardTitle>
          <CardDescription>
            Utilice este script para crear toda la estructura de la base de datos en MySQL. Esta versión utiliza claves primarias numéricas para máxima compatibilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72 w-full rounded-md border bg-muted">
            <pre className="p-4 text-xs font-mono"><code>{sqlScript.trim()}</code></pre>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Esquema de la Base de Datos MySQL</CardTitle>
          <CardDescription>
            A continuación se define la estructura de las tablas. El script de generación se encuentra en la sección superior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Products Table */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla: `products`</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Columna</TableHead>
                  <TableHead>Tipo de Dato</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">INT AUTO_INCREMENT</Badge></TableCell><TableCell>Clave primaria numérica.</TableCell></TableRow>
                 <TableRow><TableCell>`uuid`</TableCell><TableCell><Badge variant="outline">VARCHAR(36)</Badge></TableCell><TableCell>ID único universal (de la app original), para referencias externas.</TableCell></TableRow>
                <TableRow><TableCell>`name`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Nombre del producto.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

           {/* Sales Table */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla: `sales`</h3>
            <Table>
               <TableHeader><TableRow><TableHead>Columna</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">INT AUTO_INCREMENT</Badge></TableCell><TableCell>Clave primaria numérica.</TableCell></TableRow>
                <TableRow><TableCell>`uuid`</TableCell><TableCell><Badge variant="outline">VARCHAR(36)</Badge></TableCell><TableCell>ID único universal (de la app original).</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`customer_id`</TableCell><TableCell><Badge variant="outline">INT</Badge></TableCell><TableCell>FK a `customers.id`. Nulo para consumidor final.</TableCell></TableRow>
                 <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`user_id`</TableCell><TableCell><Badge variant="outline">INT</Badge></TableCell><TableCell>FK a `users.id`.</TableCell></TableRow>
                 <TableRow><TableCell>`payment_details`</TableCell><TableCell><Badge variant="outline">JSON</Badge></TableCell><TableCell>JSON con detalles específicos del pago.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

           {/* Otros Modelos (resumido) */}
          <div>
             <h3 className="font-semibold text-lg mb-2">Otras Tablas Requeridas</h3>
             <p className="text-sm text-muted-foreground">El script completo crea todas las tablas necesarias, incluyendo `customers`, `orders`, `sale_items`, `invoice_payments`, `daily_closures`, `monthly_closures`, `audit_log` y `settings`, todas siguiendo el patrón de claves primarias numéricas.</p>
          </div>

        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>2. Plan de Acción para la Migración</CardTitle>
          <CardDescription>
            Pasos recomendados para ejecutar la migración de datos de forma segura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">1</Badge>
                <div>
                    <h4 className="font-semibold">Configuración de la Base de Datos</h4>
                    <p className="text-sm text-muted-foreground">Crear la base de datos MySQL y ejecutar el script SQL proporcionado en la sección anterior para crear toda la estructura de tablas.</p>
                </div>
            </div>
            <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">2</Badge>
                <div>
                    <h4 className="font-semibold">Desarrollo de Script de Migración</h4>
                    <p className="text-sm text-muted-foreground">Crear un script (Node.js/Python) que:
                      <br/>- Exporte los datos actuales de la aplicación usando la función de "Copia de Seguridad".
                      <br/>- Lea el archivo JSON exportado.
                      <br/>- Inserte los datos en las nuevas tablas, guardando los `uuid` de la aplicación y obteniendo los nuevos `id` numéricos generados por la base de datos.
                      <br/>- Construya un mapa de correspondencia entre los `uuid` antiguos y los `id` nuevos (ej: `{'uuid-producto-abc': 1, 'uuid-producto-xyz': 2}`).
                      <br/>- Utilice este mapa para insertar correctamente los datos en las tablas relacionadas (ej: `sale_items`), usando los nuevos `id` numéricos como claves foráneas.
                    </p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">3</Badge>
                <div>
                    <h4 className="font-semibold">Refactorización de la API de Datos (Backend)</h4>
                    <p className="text-sm text-muted-foreground">
                        Reemplazar los hooks `useLocalStorageState` con llamadas a una nueva API (ej: Next.js API Routes).
                        <br/>- Las operaciones de creación (CREATE) ahora insertarán datos y deberán devolver el nuevo `id` numérico generado por la base de datos.
                        <br/>- Las operaciones de lectura (READ), actualización (UPDATE) y eliminación (DELETE) usarán los `id` numéricos para las consultas (`WHERE id = ...`).
                    </p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">4</Badge>
                <div>
                    <h4 className="font-semibold">Pruebas Exhaustivas</h4>
                    <p className="text-sm text-muted-foreground">Realizar pruebas completas en un entorno de desarrollo para verificar que la migración de datos fue exitosa y que la aplicación funciona correctamente con la nueva base de datos.</p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">5</Badge>
                <div>
                    <h4 className="font-semibold">Despliegue</h4>
                    <p className="text-sm text-muted-foreground">Poner la aplicación en modo de mantenimiento, ejecutar el script de migración en el entorno de producción y desplegar la nueva versión del código de la aplicación. Finalmente, desactivar el modo de mantenimiento.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
