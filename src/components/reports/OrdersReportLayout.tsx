
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
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Pedidos Totales:</span> <span className="font-bold">{summary.totalOrders}</span></div>
          <div className="flex justify-between"><span>Valor Total Pedidos:</span> <span className="font-bold">{appSettings.currencySymbol}{summary.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Completados:</span> <span className="font-bold">{summary.completedOrders}</span></div>
          <div className="flex justify-between"><span>Cancelados:</span> <span className="font-bold">{summary.cancelledOrders}</span></div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Detalle de Pedidos</h3>
        <div className="w-full text-xs space-y-3">
            {orders.length === 0 ? (
                <div className="p-2 text-center text-gray-500">No hay pedidos para mostrar.</div>
            ) : (
                orders.map((order) => (
                <div key={order.id} className="py-2 border-b last:border-b-0 break-inside-avoid-page">
                    <div className="flex justify-between font-bold">
                      <span>Pedido #{order.orderNumber}</span>
                      <span>{ORDER_STATUS_MAP[order.status]}</span>
                    </div>
                     <div className="flex justify-between text-gray-600">
                      <span>Fecha:</span>
                      <span>{formatDateSafe(order.timestampDate)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Cliente:</span>
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Monto:</span>
                      <span className="font-semibold">{appSettings.currencySymbol}{order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                ))
            )}
            {/* Footer */}
            {orders.length > 0 && (
            <div className="mt-2 flex justify-between font-bold text-sm bg-gray-100 p-2 rounded-md">
                <span>Valor Total de Pedidos Listados:</span>
                <span>{appSettings.currencySymbol}{summary.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
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
