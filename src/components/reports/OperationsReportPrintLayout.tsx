
"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, CashPaymentDetails, InvoicePaymentDetails } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface OperationsReportPrintLayoutProps {
  reportTitle: string;
  periodDescription: string;
  operations: Sale[];
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const OperationsReportPrintLayout: React.FC<OperationsReportPrintLayoutProps> = ({
  reportTitle,
  periodDescription,
  operations,
  appSettings,
  businessSettings,
}) => {
  
  const formatDateSafe = (dateString: string | undefined | null, dateFormat: string = "dd MMM yy") => {
    if (!dateString) return "N/A";
    try {
      const parsed = parseISO(dateString);
      if (isValid(parsed)) {
        return format(parsed, dateFormat, { locale: es });
      }
      return "Fecha Inválida";
    } catch (e) {
      return "Fecha Inválida";
    }
  };

  const totalRevenue = operations.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const numberOfTransactions = operations.length;
  const totalFees = operations.reduce((sum, sale) => sum + (sale.fees || []).reduce((feeSum, fee) => feeSum + fee.amount, 0), 0);
  
  const totalCashSales = operations
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTransferSales = operations
    .filter(sale => sale.paymentMethod === 'transfer')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalInvoiceSales = operations
    .filter(sale => sale.paymentMethod === 'invoice')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  const totalTipsCollected = appSettings.allowTips 
    ? operations.reduce((sum, sale) => {
        if (sale.paymentMethod === 'cash' && sale.paymentDetails) {
          const tip = (sale.paymentDetails as CashPaymentDetails).tip;
          return sum + (typeof tip === 'number' && isFinite(tip) ? tip : 0);
        }
        return sum;
      }, 0)
    : 0;

  const totalPosSales = operations.filter(s => s.origin === 'pos').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalOrderSales = operations.filter(s => s.origin === 'order').reduce((sum, s) => sum + s.totalAmount, 0);


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

      <div className="w-full text-xs">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 font-semibold bg-gray-100 p-2 border-b">
              <div className="col-span-1">ID Venta</div>
              <div className="col-span-1">Fecha Venta</div>
              <div className="col-span-1">Origen</div>
              <div className="col-span-2">Cliente</div>
              <div className="col-span-1 text-center">Items</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1">Método Pago</div>
          </div>
          {/* Body */}
          <div className="border-l border-r border-b">
              {operations.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">No hay operaciones para mostrar en este periodo.</div>
              ) : (
                  operations.map((sale) => (
                      <div key={sale.id} className="grid grid-cols-8 gap-2 p-2 border-b last:border-b-0 break-inside-avoid-page">
                          <div className="col-span-1 align-top">{sale.id.substring(0, 8)}...</div>
                          <div className="col-span-1 align-top">{formatDateSafe(sale.timestamp, "dd MMM yy, HH:mm")}</div>
                          <div className="col-span-1 align-top">{sale.origin === 'pos' ? 'POS' : 'Pedido'}</div>
                          <div className="col-span-2 align-top">{sale.customerName || 'N/A'}</div>
                          <div className="col-span-1 align-top text-center">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                          <div className="col-span-1 align-top text-right">
                              {appSettings.currencySymbol}
                              {sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="col-span-1 align-top">
                            {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                            {sale.paymentMethod === 'invoice' && ` (${(sale.paymentDetails as InvoicePaymentDetails).status})`}
                          </div>
                      </div>
                  ))
              )}
          </div>
          {/* Footer */}
          {operations.length > 0 && (
            <div className="mt-4 space-y-1 bg-gray-100 p-2 rounded-md">
                <div className="flex justify-between font-semibold">
                  <span>Ingresos Totales:</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cargos por Servicio:</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalFees.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Transacciones:</span>
                  <span>{numberOfTransactions}</span>
                </div>
                <div className="flex justify-between pt-2 mt-1 border-t">
                  <span>Total Ventas Directas (POS):</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalPosSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Ventas por Pedidos:</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalOrderSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 mt-1 border-t">
                  <span>Total Ventas Efectivo:</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalCashSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Ventas Transferencia:</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalTransferSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Ventas a Crédito (Factura):</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalInvoiceSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {appSettings.allowTips && (
                  <div className="flex justify-between">
                    <span>Total Propinas Recaudadas (Efectivo):</span>
                    <span>
                      {appSettings.currencySymbol}
                      {totalTipsCollected.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
            </div>
          )}
      </div>
      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default OperationsReportPrintLayout;
