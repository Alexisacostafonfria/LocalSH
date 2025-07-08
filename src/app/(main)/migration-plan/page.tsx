
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
-- Script de Generación de Tablas para Local Sales Hub
-- Base de Datos: MySQL 8.0+
-- -----------------------------------------------------

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  username VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  role ENUM('admin', 'cashier') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  category VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  cost_price DECIMAL(15, 2) DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  unit_of_measure VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  image_url TEXT COLLATE utf8mb4_unicode_ci,
  description TEXT COLLATE utf8mb4_unicode_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_products_name (name),
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  phone VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  email VARCHAR(255) COLLATE utf8mb4_unicode_ci,
  personal_id VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  card_number VARCHAR(255) COLLATE utf8mb4_unicode_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (personal_id),
  INDEX idx_customers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  order_number INT NOT NULL AUTO_INCREMENT,
  timestamp DATETIME NOT NULL,
  customer_id VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  customer_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  customer_phone VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  total_amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL,
  notes TEXT COLLATE utf8mb4_unicode_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (order_number),
  KEY fk_orders_customer_id (customer_id),
  CONSTRAINT orders_ibfk_1 FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT,
  order_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  product_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  product_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY fk_order_items_order_id (order_id),
  KEY fk_order_items_product_id (product_id),
  CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sales
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  timestamp DATETIME NOT NULL,
  operational_date DATE NOT NULL,
  origin ENUM('pos', 'order') NOT NULL,
  order_id VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  customer_id VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  customer_name VARCHAR(255) COLLATE utf8mb4_unicode_ci,
  user_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  sub_total DECIMAL(15, 2) NOT NULL,
  discount DECIMAL(15, 2) DEFAULT 0.00,
  fees JSON,
  total_amount DECIMAL(15, 2) NOT NULL,
  payment_method ENUM('cash', 'transfer', 'invoice') NOT NULL,
  payment_details JSON NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_sales_operational_date (operational_date),
  KEY fk_sales_order_id (order_id),
  KEY fk_sales_customer_id (customer_id),
  KEY fk_sales_user_id (user_id),
  CONSTRAINT sales_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT sales_ibfk_2 FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT sales_ibfk_3 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT,
  sale_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  product_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  product_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY fk_sale_items_sale_id (sale_id),
  KEY fk_sale_items_product_id (product_id),
  CONSTRAINT sale_items_ibfk_1 FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT sale_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: invoice_payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  invoice_sale_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  payment_timestamp DATETIME NOT NULL,
  operational_date DATE NOT NULL,
  amount_paid DECIMAL(15, 2) NOT NULL,
  method ENUM('cash', 'transfer') NOT NULL,
  reference VARCHAR(255) COLLATE utf8mb4_unicode_ci,
  tip DECIMAL(15, 2) DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY fk_invoice_payments_invoice_sale_id (invoice_sale_id),
  CONSTRAINT invoice_payments_ibfk_1 FOREIGN KEY (invoice_sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: daily_closures
CREATE TABLE IF NOT EXISTS daily_closures (
  id INT AUTO_INCREMENT,
  closure_date DATE NOT NULL,
  expected_cash DECIMAL(15, 2) NOT NULL,
  counted_cash DECIMAL(15, 2) NOT NULL,
  cash_difference DECIMAL(15, 2) NOT NULL,
  notes TEXT COLLATE utf8mb4_unicode_ci,
  total_revenue DECIMAL(15, 2) NOT NULL,
  total_cogs DECIMAL(15, 2) NOT NULL,
  gross_profit DECIMAL(15, 2) NOT NULL,
  total_transactions INT NOT NULL,
  cash_sales_amount DECIMAL(15, 2) NOT NULL,
  transfer_sales_amount DECIMAL(15, 2) NOT NULL,
  total_tips DECIMAL(15, 2) NOT NULL,
  invoice_payments_cash DECIMAL(15, 2) NOT NULL,
  invoice_payments_transfer DECIMAL(15, 2) NOT NULL,
  counted_cash_breakdown JSON,
  PRIMARY KEY (id),
  UNIQUE KEY (closure_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: monthly_closures
CREATE TABLE IF NOT EXISTS monthly_closures (
    id INT AUTO_INCREMENT,
    year INT NOT NULL,
    month INT NOT NULL,
    generation_date DATETIME NOT NULL,
    total_revenue DECIMAL(15, 2) NOT NULL,
    total_cogs DECIMAL(15, 2) NOT NULL,
    gross_profit DECIMAL(15, 2) NOT NULL,
    total_transactions INT NOT NULL,
    total_tips DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  timestamp DATETIME NOT NULL,
  user_id VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  username VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  action_type VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  entity_type VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  entity_id VARCHAR(255) COLLATE utf8mb4_unicode_ci,
  description TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_audit_log_timestamp (timestamp),
  KEY fk_audit_log_user_id (user_id),
  CONSTRAINT audit_log_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: settings (Key-Value para configuraciones)
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  setting_value TEXT COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ¡No olvide insertar los datos de configuración inicial (appSettings y businessSettings) en la tabla 'settings'!
-- Ejemplo: INSERT INTO settings (setting_key, setting_value) VALUES ('appSettings', '{"lowStockThreshold":10, ...}');
`;


const MigrationPlanPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plan de Migración a MySQL"
        description="Detalles técnicos y pasos para migrar los datos de la aplicación desde LocalStorage a una base de datos MySQL."
      />

      <Alert variant="warning">
        <Database className="h-5 w-5" />
        <AlertTitle>Visión General del Plan</AlertTitle>
        <AlertDescription>
          Este documento describe el plan para migrar el almacenamiento de datos de la aplicación, actualmente basado en LocalStorage, a una base de datos relacional MySQL. El objetivo es mejorar la escalabilidad, la integridad de los datos y el rendimiento general del sistema. La migración se realizará en varias fases, comenzando por el diseño del esquema de la base de datos, seguido por el desarrollo de scripts de migración y la actualización del código de la aplicación para interactuar con la nueva base de datos a través de una API.
        </AlertDescription>
      </Alert>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Code2 />Script SQL de Creación de Tablas</CardTitle>
          <CardDescription>
            Utilice este script para crear toda la estructura de la base de datos en MySQL.
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
            A continuación se define la estructura de las tablas necesarias para almacenar los datos de la aplicación. El script de generación se encuentra en la sección superior.
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
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Clave primaria (UUID generado por la app).</TableCell></TableRow>
                <TableRow><TableCell>`name`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Nombre del producto.</TableCell></TableRow>
                <TableRow><TableCell>`category`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Categoría del producto.</TableCell></TableRow>
                <TableRow><TableCell>`price`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Precio de venta.</TableCell></TableRow>
                <TableRow><TableCell>`cost_price`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Precio de costo.</TableCell></TableRow>
                <TableRow><TableCell>`stock`</TableCell><TableCell><Badge variant="outline">INT</Badge></TableCell><TableCell>Cantidad en inventario.</TableCell></TableRow>
                <TableRow><TableCell>`unit_of_measure`</TableCell><TableCell><Badge variant="outline">VARCHAR(50)</Badge></TableCell><TableCell>Unidad de medida (ej: kg, lt, unid.).</TableCell></TableRow>
                <TableRow><TableCell>`image_url`</TableCell><TableCell><Badge variant="outline">TEXT</Badge></TableCell><TableCell>URL de la imagen del producto (podría ser un enlace a un servicio de almacenamiento como Cloud Storage).</TableCell></TableRow>
                <TableRow><TableCell>`description`</TableCell><TableCell><Badge variant="outline">TEXT</Badge></TableCell><TableCell>Descripción larga del producto.</TableCell></TableRow>
                <TableRow><TableCell>`created_at`</TableCell><TableCell><Badge variant="outline">TIMESTAMP</Badge></TableCell><TableCell>Fecha de creación del registro.</TableCell></TableRow>
                <TableRow><TableCell>`updated_at`</TableCell><TableCell><Badge variant="outline">TIMESTAMP</Badge></TableCell><TableCell>Fecha de última actualización.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Customers Table */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla: `customers`</h3>
             <Table>
              <TableHeader><TableRow><TableHead>Columna</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Clave primaria (UUID).</TableCell></TableRow>
                <TableRow><TableCell>`name`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Nombre del cliente.</TableCell></TableRow>
                <TableRow><TableCell>`phone`</TableCell><TableCell><Badge variant="outline">VARCHAR(50)</Badge></TableCell><TableCell>Número de teléfono.</TableCell></TableRow>
                <TableRow><TableCell>`email`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Correo electrónico.</TableCell></TableRow>
                <TableRow><TableCell>`personal_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(50)</Badge></TableCell><TableCell>ID personal (DNI, RIF, etc.).</TableCell></TableRow>
                <TableRow><TableCell>`card_number`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Número de tarjeta (encriptado).</TableCell></TableRow>
                <TableRow><TableCell>`created_at`</TableCell><TableCell><Badge variant="outline">TIMESTAMP</Badge></TableCell><TableCell>Fecha de creación.</TableCell></TableRow>
                <TableRow><TableCell>`updated_at`</TableCell><TableCell><Badge variant="outline">TIMESTAMP</Badge></TableCell><TableCell>Fecha de actualización.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Sales Table */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla: `sales`</h3>
            <Table>
               <TableHeader><TableRow><TableHead>Columna</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Clave primaria (UUID).</TableCell></TableRow>
                <TableRow><TableCell>`timestamp`</TableCell><TableCell><Badge variant="outline">DATETIME</Badge></TableCell><TableCell>Fecha y hora de la venta.</TableCell></TableRow>
                <TableRow><TableCell>`operational_date`</TableCell><TableCell><Badge variant="outline">DATE</Badge></TableCell><TableCell>Día operativo contable.</TableCell></TableRow>
                <TableRow><TableCell>`origin`</TableCell><TableCell><Badge variant="outline">ENUM('pos', 'order')</Badge></TableCell><TableCell>Origen de la venta.</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`order_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>FK a `orders.id` (si `origin` es `order`).</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`customer_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>FK a `customers.id`. Puede ser nulo.</TableCell></TableRow>
                <TableRow><TableCell>`customer_name`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Nombre del cliente (denormalizado).</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`user_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>FK a `users.id`.</TableCell></TableRow>
                <TableRow><TableCell>`sub_total`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Subtotal antes de descuentos y cargos.</TableCell></TableRow>
                <TableRow><TableCell>`discount`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Monto del descuento aplicado.</TableCell></TableRow>
                <TableRow><TableCell>`fees`</TableCell><TableCell><Badge variant="outline">JSON</Badge></TableCell><TableCell>JSON con cargos adicionales (ej: fee por factura).</TableCell></TableRow>
                <TableRow><TableCell>`total_amount`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Monto total final.</TableCell></TableRow>
                <TableRow><TableCell>`payment_method`</TableCell><TableCell><Badge variant="outline">ENUM('cash', 'transfer', 'invoice')</Badge></TableCell><TableCell>Método de pago.</TableCell></TableRow>
                <TableRow><TableCell>`payment_details`</TableCell><TableCell><Badge variant="outline">JSON</Badge></TableCell><TableCell>JSON con detalles específicos del pago.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

           {/* Sale Items Table */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Tabla: `sale_items`</h3>
            <Table>
               <TableHeader><TableRow><TableHead>Columna</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">INT AUTO_INCREMENT</Badge></TableCell><TableCell>Clave primaria.</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`sale_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>FK a `sales.id`.</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`product_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>FK a `products.id`.</TableCell></TableRow>
                <TableRow><TableCell>`product_name`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Nombre del producto (denormalizado).</TableCell></TableRow>
                <TableRow><TableCell>`quantity`</TableCell><TableCell><Badge variant="outline">INT</Badge></TableCell><TableCell>Cantidad vendida.</TableCell></TableRow>
                <TableRow><TableCell>`unit_price`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Precio unitario al momento de la venta.</TableCell></TableRow>
                <TableRow><TableCell>`total_price`</TableCell><TableCell><Badge variant="outline">DECIMAL(15, 2)</Badge></TableCell><TableCell>Precio total del item (cantidad * precio unitario).</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
          
           {/* Audit Log Table */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><History className="h-5 w-5" /> Tabla: `audit_log`</h3>
            <Table>
               <TableHeader><TableRow><TableHead>Columna</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell><Key className="inline h-4 w-4 mr-2 text-primary" />`id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Clave primaria (UUID).</TableCell></TableRow>
                <TableRow><TableCell>`timestamp`</TableCell><TableCell><Badge variant="outline">DATETIME</Badge></TableCell><TableCell>Fecha y hora del evento.</TableCell></TableRow>
                <TableRow><TableCell><Link2 className="inline h-4 w-4 mr-2 text-gray-500" />`user_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>FK a `users.id`.</TableCell></TableRow>
                <TableRow><TableCell>`username`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>Nombre del usuario (denormalizado).</TableCell></TableRow>
                <TableRow><TableCell>`action_type`</TableCell><TableCell><Badge variant="outline">VARCHAR(50)</Badge></TableCell><TableCell>Tipo de acción (ej: 'PRODUCT_CREATED').</TableCell></TableRow>
                <TableRow><TableCell>`entity_type`</TableCell><TableCell><Badge variant="outline">VARCHAR(50)</Badge></TableCell><TableCell>Tipo de entidad afectada (ej: 'Product').</TableCell></TableRow>
                <TableRow><TableCell>`entity_id`</TableCell><TableCell><Badge variant="outline">VARCHAR(255)</Badge></TableCell><TableCell>ID de la entidad afectada.</TableCell></TableRow>
                <TableRow><TableCell>`description`</TableCell><TableCell><Badge variant="outline">TEXT</Badge></TableCell><TableCell>Descripción detallada de la acción.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

           {/* Otros Modelos (resumido) */}
          <div>
             <h3 className="font-semibold text-lg mb-2">Otras Tablas Requeridas</h3>
             <p className="text-sm text-muted-foreground">Adicionalmente, se requerirán las siguientes tablas, siguiendo una estructura similar a las ya detalladas:</p>
             <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><strong className="font-semibold">`orders`</strong> y <strong className="font-semibold">`order_items`</strong>: Para almacenar los pedidos.</li>
                <li><strong className="font-semibold">`invoice_payments`</strong>: Para registrar los pagos a facturas, con FK a `sales`. Debe incluir una columna `tip` (DECIMAL(15,2)).</li>
                <li><strong className="font-semibold">`daily_closures`</strong> y <strong className="font-semibold">`monthly_closures`</strong>: Para los cierres de caja.</li>
                <li><strong className="font-semibold">`users`</strong>: Para la gestión de usuarios y roles.</li>
                <li><strong className="font-semibold">`settings`</strong>: Tabla Key-Value para almacenar la configuración de la aplicación y del negocio.</li>
             </ul>
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
                    <p className="text-sm text-muted-foreground">Crear la base de datos MySQL y ejecutar el script SQL proporcionado en la sección anterior para crear todas las tablas.</p>
                </div>
            </div>
            <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">2</Badge>
                <div>
                    <h4 className="font-semibold">Desarrollo de Script de Migración</h4>
                    <p className="text-sm text-muted-foreground">Crear un script (Node.js/Python) que:
                      <br/>- Exporte los datos actuales de la aplicación usando la función de "Copia de Seguridad".
                      <br/>- Lea el archivo JSON exportado.
                      <br/>- Transforme los datos para que coincidan con el esquema SQL (ej: aplanar `paymentDetails`, dividir `saleItems`).
                      <br/>- Inserte los datos transformados en las nuevas tablas MySQL en el orden correcto para respetar las claves foráneas (users, customers, products, sales, sale_items, etc.).
                    </p>
                </div>
            </div>
             <div className="flex items-start gap-4 p-3 border rounded-lg">
                <Badge variant="default" className="text-lg font-bold px-3 py-1">3</Badge>
                <div>
                    <h4 className="font-semibold">Refactorización de la API de Datos (Backend)</h4>
                    <p className="text-sm text-muted-foreground">Reemplazar los hooks `useLocalStorageState` con llamadas a una nueva API (que se podría construir con Next.js API Routes, Express, o similar). Esta API se encargará de todas las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) interactuando con la base de datos MySQL.</p>
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
};

export default MigrationPlanPage;
