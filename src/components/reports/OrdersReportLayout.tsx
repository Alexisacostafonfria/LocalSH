
// src/components/reports/OrdersReportLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Order, AppSettings, BusinessSettings, ORDER_STATUS_MAP } from '@/types';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrdersReportLayoutProps {
  reportTitle: string;
  periodDescription: string;
  orders: (Order & { timestampDate: Date })[]; // Updated type
  summary: {
    totalOrders: number;
    totalValue: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
  };
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const OrdersReportLayout: React.FC<OrdersReportLayoutProps> = ({
  reportTitle,
  periodDescription,
  orders,
  summary,
  appSettings,
  businessSettings,
}) => {
  const formatDateSafe = (date: Date) => {
    return isValid(date) ? format(date, "dd MMM yy, HH:mm", { locale: es }) : "Fecha Inválida";
  };

  return (
    <div className="p-4 bg-white text-black text-sm font-sans">
      <header className="mb-6 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            {businessSettings.logoUrl && (
              <div className="relative w-20 h-20 mb-2">
                <Image
                  src={businessSettings.logoUrl}
                  alt={`${businessSettings.businessName || 'Logo'} logo`}
                  layout="fill"
                  objectFit="contain"
                  data-ai-hint="business logo small"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{businessSettings.businessName || 'Local Sales Hub'}</h1>
            <p className="text-gray-600">{businessSettings.address || ''}</p>
            <p className="text-gray-600">{businessSettings.phone || ''} {businessSettings.email ? `| ${businessSettings.email}` : ''}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold mb-1">{reportTitle}</h2>
            <p className="text-gray-600">{periodDescription}</p>
            <p className="text-xs text-gray-500">Generado: {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </header>

      <section className="mb-6 break-inside-avoid-page">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Resumen de Pedidos</h3>
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-100 p-2 rounded-md">
            <p className="font-semibold">Pedidos Totales</p>
            <p className="text-lg font-bold">{summary.totalOrders}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-md">
            <p className="font-semibold">Valor Total Pedidos</p>
            <p className="text-lg font-bold">{appSettings.currencySymbol}{summary.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-md">
            <p className="font-semibold">Completados</p>
            <p className="text-lg font-bold">{summary.completedOrders}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-md">
            <p className="font-semibold">Cancelados</p>
            <p className="text-lg font-bold">{summary.cancelledOrders}</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Detalle de Pedidos</h3>
        <div className="w-full text-xs">
            {/* Header */}
            <div className="grid grid-cols-5 gap-2 font-semibold bg-gray-100 p-2 border-b">
                <div className="col-span-1">Pedido #</div>
                <div className="col-span-1">Fecha</div>
                <div className="col-span-1">Cliente</div>
                <div className="col-span-1 text-right">Monto</div>
                <div className="col-span-1">Estado</div>
            </div>
            {/* Body */}
            <div className="border-l border-r border-b">
                {orders.length === 0 ? (
                    <div className="p-2 text-center text-gray-500">No hay pedidos para mostrar.</div>
                ) : (
                    orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-5 gap-2 p-2 border-b last:border-b-0 break-inside-avoid-page">
                        <div className="align-top">{order.orderNumber}</div>
                        <div className="align-top">{formatDateSafe(order.timestampDate)}</div>
                        <div className="align-top">{order.customerName}</div>
                        <div className="align-top text-right">{appSettings.currencySymbol}{order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                        <div className="align-top">{ORDER_STATUS_MAP[order.status]}</div>
                    </div>
                    ))
                )}
            </div>
            {/* Footer */}
            {orders.length > 0 && (
            <div className="mt-2 grid grid-cols-5 gap-2 font-semibold bg-gray-100 p-2 border-t">
                <div className="col-span-3 text-right">Valor Total Pedidos:</div>
                <div className="text-right">{appSettings.currencySymbol}{summary.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                <div></div>
            </div>
            )}
        </div>
      </section>

      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Pedidos</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default OrdersReportLayout;
