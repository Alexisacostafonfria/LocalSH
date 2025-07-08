// src/app/(main)/migration-plan/page.tsx
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Database, ChevronsRight, Key, Rows, Link2, History } from 'lucide-react';

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
          <CardTitle>1. Esquema de la Base de Datos MySQL</CardTitle>
          <CardDescription>
            A continuación se define la estructura de las tablas necesarias para almacenar los datos de la aplicación.
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
                <TableRow><TableCell>`price`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Precio de venta.</TableCell></TableRow>
                <TableRow><TableCell>`cost_price`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Precio de costo.</TableCell></TableRow>
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
                <TableRow><TableCell>`sub_total`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Subtotal antes de descuentos y cargos.</TableCell></TableRow>
                <TableRow><TableCell>`discount`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Monto del descuento aplicado.</TableCell></TableRow>
                <TableRow><TableCell>`fees`</TableCell><TableCell><Badge variant="outline">JSON</Badge></TableCell><TableCell>JSON con cargos adicionales (ej: fee por factura).</TableCell></TableRow>
                <TableRow><TableCell>`total_amount`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Monto total final.</TableCell></TableRow>
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
                <TableRow><TableCell>`unit_price`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Precio unitario al momento de la venta.</TableCell></TableRow>
                <TableRow><TableCell>`total_price`</TableCell><TableCell><Badge variant="outline">DECIMAL(10, 2)</Badge></TableCell><TableCell>Precio total del item (cantidad * precio unitario).</TableCell></TableRow>
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
                <li><strong className="font-semibold">`orders`</strong>: Para almacenar los pedidos, con FK a `customers` y `users`.</li>
                <li><strong className="font-semibold">`order_items`</strong>: Detalle de los productos en cada pedido, con FK a `orders` y `products`.</li>
                <li><strong className="font-semibold">`invoice_payments`</strong>: Para registrar los pagos a facturas, con FK a `sales`. Debe incluir una columna `tip` (DECIMAL(10,2)).</li>
                <li><strong className="font-semibold">`daily_closures`</strong>: Para los cierres de caja diarios.</li>
                <li><strong className="font-semibold">`users`</strong>: Para la gestión de usuarios y roles.</li>
                <li><strong className="font-semibold">`app_settings`</strong> y <strong className="font-semibold">`business_settings`</strong>: Tablas para almacenar la configuración de la aplicación y del negocio (o una tabla `settings` con pares clave-valor).</li>
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
                    <p className="text-sm text-muted-foreground">Crear la base de datos MySQL y ejecutar los scripts SQL para crear todas las tablas definidas en el esquema anterior.</p>
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
                      <br/>- Inserte los datos transformados en las nuevas tablas MySQL en el orden correcto para respetar las claves foráneas (customers, users, products, sales, sale_items, etc.).
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
