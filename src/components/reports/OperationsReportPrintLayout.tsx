

"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, CashPaymentDetails } from '@/types';
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
  const totalCashSales = operations
    .filter(sale => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTransferSales = operations
    .filter(sale => sale.paymentMethod === 'transfer')
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

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left font-semibold">ID Venta</th>
            <th className="border p-2 text-left font-semibold">Fecha Venta</th>
            <th className="border p-2 text-left font-semibold">Origen</th>
            <th className="border p-2 text-left font-semibold">Cliente</th>
            <th className="border p-2 text-center font-semibold">Items</th>
            <th className="border p-2 text-right font-semibold">Total</th>
            <th className="border p-2 text-left font-semibold">Método Pago</th>
          </tr>
        </thead>
        <tbody>
          {operations.length === 0 ? (
            <tr>
              <td colSpan={7} className="border p-2 text-center text-gray-500">
                No hay operaciones para mostrar en este periodo.
              </td>
            </tr>
          ) : (
            operations.map((sale) => (
              <tr key={sale.id} className="break-inside-avoid-page">
                <td className="border p-2 align-top">{sale.id.substring(0, 8)}...</td>
                <td className="border p-2 align-top">{formatDateSafe(sale.timestamp, "dd MMM yy, HH:mm")}</td>
                <td className="border p-2 align-top">{sale.origin === 'pos' ? 'POS' : 'Pedido'}</td>
                <td className="border p-2 align-top">{sale.customerName || 'N/A'}</td>
                <td className="border p-2 align-top text-center">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="border p-2 align-top text-right">
                  {appSettings.currencySymbol}
                  {sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border p-2 align-top">
                  {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {operations.length > 0 && (
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td colSpan={5} className="border p-2 text-right">Ingresos Totales:</td>
              <td colSpan={2} className="border p-2 text-right">
                {appSettings.currencySymbol}
                {totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border p-2 text-right">Total Transacciones:</td>
              <td colSpan={2} className="border p-2 text-right">{numberOfTransactions}</td>
            </tr>
             <tr>
              <td colSpan={5} className="border p-2 text-right">Total Ventas Directas (POS):</td>
              <td colSpan={2} className="border p-2 text-right">
                {appSettings.currencySymbol}
                {totalPosSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border p-2 text-right">Total Ventas por Pedidos:</td>
              <td colSpan={2} className="border p-2 text-right">
                {appSettings.currencySymbol}
                {totalOrderSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border p-2 text-right">Total Ventas Efectivo:</td>
              <td colSpan={2} className="border p-2 text-right">
                {appSettings.currencySymbol}
                {totalCashSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border p-2 text-right">Total Ventas Transferencia:</td>
              <td colSpan={2} className="border p-2 text-right">
                {appSettings.currencySymbol}
                {totalTransferSales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            {appSettings.allowTips && (
              <tr>
                <td colSpan={5} className="border p-2 text-right">Total Propinas Recaudadas (Efectivo):</td>
                <td colSpan={2} className="border p-2 text-right">
                  {appSettings.currencySymbol}
                  {totalTipsCollected.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}
          </tfoot>
        )}
      </table>
      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default OperationsReportPrintLayout;
