
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
  
  const formatDateSafe = (dateString: string | undefined | null, dateFormat: string = "dd MMM yy, HH:mm") => {
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

      <div className="w-full text-xs space-y-3">
          {operations.length === 0 ? (
              <div className="p-2 text-center text-gray-500">No hay operaciones para mostrar en este periodo.</div>
          ) : (
              operations.map((sale) => (
                  <div key={sale.id} className="py-2 border-b last:border-b-0 break-inside-avoid-page">
                      <div className="flex justify-between font-bold">
                        <span>Venta #{sale.id.substring(0, 8)}</span>
                        <span>{appSettings.currencySymbol}{sale.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                      </div>
                       <div className="flex justify-between text-gray-600">
                        <span>Fecha:</span>
                        <span>{formatDateSafe(sale.timestamp)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Cliente:</span>
                        <span>{sale.customerName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Items:</span>
                        <span>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Origen:</span>
                        <span>{sale.origin === 'pos' ? 'POS' : 'Pedido'}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Pago:</span>
                        <span>
                          {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                          {sale.paymentMethod === 'invoice' && ` (${(sale.paymentDetails as InvoicePaymentDetails).status})`}
                        </span>
                      </div>
                  </div>
              ))
          )}
          {/* Footer Summary */}
          {operations.length > 0 && (
            <div className="mt-4 space-y-1 bg-gray-100 p-2 rounded-md font-semibold">
                <div className="flex justify-between">
                  <span>Ingresos Totales:</span>
                  <span>
                    {appSettings.currencySymbol}
                    {totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Transacciones:</span>
                  <span>{numberOfTransactions}</span>
                </div>
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
