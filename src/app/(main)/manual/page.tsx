// src/app/(main)/manual/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, AlertTriangle } from 'lucide-react';

const ManualSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="break-inside-avoid-page mb-8">
        <h2 className="text-xl font-bold font-headline border-b-2 border-primary pb-2 mb-4">{title}</h2>
        <div className="space-y-4 text-base leading-relaxed">
            {children}
        </div>
    </div>
);

export default function ManualPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Manual de Usuario" description="Guía completa para la operatividad de Local Sales Hub.">
                <Button onClick={handlePrint} className="no-print">
                    <Printer className="mr-2 h-5 w-5" /> Imprimir Manual (o Guardar como PDF)
                </Button>
            </PageHeader>
            
            {isClient && ReactDOM.createPortal(
                <div id="printableManualArea" className="bg-white text-black p-8">
                    <div className="text-center mb-8">
                         <h1 className="text-4xl font-bold font-headline mb-2">Manual de Operatividad</h1>
                         <p className="text-lg text-gray-600">Local Sales Hub</p>
                         <p className="text-xs text-gray-500">Documento generado el: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <ManualSection title="1. Introducción">
                        <p>Bienvenido a Local Sales Hub. Este manual proporciona una guía detallada sobre cómo utilizar cada módulo de la aplicación para gestionar eficientemente las operaciones de su negocio. La aplicación está diseñada para ser intuitiva, pero esta guía le ayudará a sacar el máximo provecho de todas sus funcionalidades.</p>
                    </ManualSection>

                    <ManualSection title="2. Módulos Principales">
                        <h3 className="text-lg font-bold">2.1. Dashboard</h3>
                        <p>El Dashboard es la pantalla principal y su centro de operaciones. Aquí encontrará un resumen rápido de las métricas clave de su negocio, como ventas del día, productos con bajo stock y pedidos activos. También proporciona accesos directos a las funciones más comunes como "Registrar Venta" o "Añadir Producto".</p>
                        
                        <h3 className="text-lg font-bold mt-6">2.2. Catálogo de Productos</h3>
                        <p>Este módulo le permite gestionar todos los productos de su negocio.</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li><strong>Añadir Producto:</strong> Use el botón flotante (+) para abrir el formulario y añadir un nuevo producto con detalles como nombre, categoría, precio, costo, stock inicial e imagen.</li>
                            <li><strong>Editar/Eliminar:</strong> En la vista de cuadrícula o lista, cada producto tiene botones para editar sus detalles o eliminarlo permanentemente.</li>
                            <li><strong>Búsqueda y Filtro:</strong> Utilice la barra de búsqueda para encontrar productos por nombre, categoría o ID. Puede filtrar por categoría para refinar los resultados.</li>
                            <li><strong>Reportes:</strong> Puede imprimir un listado completo del catálogo o un reporte de movimientos (entradas y salidas) del día operativo actual.</li>
                        </ul>

                         <h3 className="text-lg font-bold mt-6">2.3. Ventas</h3>
                        <p>El módulo de ventas es un asistente de 4 pasos para registrar transacciones de forma rápida y segura.</p>
                        <ol className="list-decimal list-inside ml-4 space-y-2">
                            <li><strong>Paso 1 - Productos:</strong> Añada productos al carrito escaneando su código de barras o seleccionándolos manualmente de la lista.</li>
                            <li><strong>Paso 2 - Cliente:</strong> Seleccione un cliente existente o ingrese los datos para un cliente anónimo. Puede añadir un cliente nuevo al sistema desde aquí para futuras transacciones.</li>
                            <li><strong>Paso 3 - Confirmación:</strong> Revise el resumen de la compra con el cliente para asegurar que todo es correcto antes de proceder al pago.</li>
                            <li><strong>Paso 4 - Pago:</strong> Seleccione el método de pago (Efectivo, Transferencia, Factura) y complete los detalles. Para pagos en efectivo, puede usar el desglose de monedas y billetes para calcular el cambio automáticamente.</li>
                        </ol>

                        <h3 className="text-lg font-bold mt-6">2.4. Pedidos</h3>
                        <p>Gestione los pedidos para llevar o por encargo.</p>
                         <ul className="list-disc list-inside ml-4 space-y-2">
                            <li><strong>Crear Pedido:</strong> Use el botón "Crear Pedido" para abrir un formulario similar al de ventas, donde añade productos y datos del cliente.</li>
                            <li><strong>Gestión de Estados:</strong> Los pedidos avanzan por estados: "Pendiente" -> "En Preparación" -> "Listo para Retirar". Use los botones en cada tarjeta de pedido para cambiar su estado.</li>
                             <li><strong>Completar Pedido:</strong> Al registrar el pago de un pedido "Listo para Retirar", la venta se crea automáticamente en el sistema y se descuenta el stock. El sistema valida que haya stock suficiente respetando el orden de los pedidos.</li>
                        </ul>
                        
                        <h3 className="text-lg font-bold mt-6">2.5. Inventario</h3>
                        <p>Aquí puede monitorear los niveles de stock de todos sus productos.</p>
                         <ul className="list-disc list-inside ml-4 space-y-2">
                            <li><strong>Visualización Rápida:</strong> Vea el stock actual, el valor total del inventario y reciba alertas de productos con bajo stock o agotados.</li>
                            <li><strong>Ajustar Stock (Admin):</strong> Los administradores pueden usar el botón "Ajustar Stock" para registrar la entrada de nueva mercancía, actualizando los niveles de inventario. Esta acción queda registrada en el historial.</li>
                        </ul>
                    </ManualSection>

                    <ManualSection title="3. Módulos Financieros y Administrativos">
                        <h3 className="text-lg font-bold">3.1. Reportes</h3>
                        <p>Analice el rendimiento de su negocio. El módulo de reportes ofrece KPIs (Indicadores Clave de Rendimiento) como ventas totales, ganancia, costos, y más, basados en el rango de fechas que seleccione. También puede ver gráficos de ventas y un listado detallado de todas las operaciones.</p>

                        <h3 className="text-lg font-bold mt-6">3.2. Contabilidad</h3>
                        <p>Este es el corazón financiero de la aplicación.</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                           <li><strong>Día Operativo:</strong> Debe "Iniciar Nuevo Día Operativo" para poder registrar ventas y pagos. La fecha debe ser posterior al último cierre.</li>
                           <li><strong>Cierre Diario:</strong> Al final del día, realice el "Arqueo de Caja" contando el efectivo físico. El sistema le mostrará el efectivo esperado, el contado y la diferencia (sobrante o faltante). Al confirmar el cierre, el día operativo finaliza.</li>
                           <li><strong>Historial:</strong> Consulte el historial de todos los cierres diarios y mensuales realizados.</li>
                        </ul>
                        
                        <h3 className="text-lg font-bold mt-6">3.3. Cuentas por Cobrar</h3>
                        <p>Gestione todas las ventas a crédito (facturas).</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                           <li><strong>Listado de Facturas:</strong> Vea todas las facturas pendientes, vencidas y pagadas. Use los filtros para encontrar rápidamente lo que necesita.</li>
                           <li><strong>Registrar Pago:</strong> Cuando un cliente pague una factura, use el botón "Registrar Pago" para registrar el ingreso, que se reflejará en el cierre de caja del día operativo actual.</li>
                        </ul>
                    </ManualSection>

                     <ManualSection title="4. Módulos de Administración (Solo Admins)">
                        <h3 className="text-lg font-bold">4.1. Usuarios</h3>
                        <p>Gestione quién tiene acceso al sistema. Puede crear nuevos usuarios con rol de "Cajero" o "Administrador", editar sus nombres y roles, o eliminarlos.</p>

                        <h3 className="text-lg font-bold mt-6">4.2. Historial de Actividad</h3>
                        <p>Audite cada operación importante realizada en el sistema. Este registro muestra qué usuario realizó la acción, cuándo y una descripción detallada. Es una herramienta poderosa para el control y la seguridad.</p>

                        <h3 className="text-lg font-bold mt-6">4.3. Configuración</h3>
                        <p>Personalice la aplicación a las necesidades de su negocio.</p>
                         <ul className="list-disc list-inside ml-4 space-y-2">
                           <li><strong>Preferencias:</strong> Ajuste parámetros como el símbolo de moneda, umbral de bajo stock, y si se permiten propinas.</li>
                           <li><strong>Información del Negocio:</strong> Configure el nombre, dirección y logo de su empresa, que aparecerán en recibos y reportes.</li>
                           <li><strong>Copia de Seguridad:</strong> Exporte todos los datos de la aplicación a un archivo JSON seguro. Restaure desde un archivo en caso de ser necesario. <strong>¡Realice copias de seguridad regularmente!</strong></li>
                        </ul>
                         <h3 className="text-lg font-bold mt-6">4.4. Plan de Migración</h3>
                        <p>Esta sección es de carácter técnico. Contiene el esquema de base de datos y el plan de acción detallado para migrar los datos de la aplicación desde el almacenamiento local del navegador a una base de datos MySQL, un paso crucial para el escalado futuro del negocio.</p>
                    </ManualSection>

                    <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
                        <p>Fin del Manual de Usuario.</p>
                    </footer>
                </div>,
                document.body
            )}
        </div>
    );
}
