
// src/components/accounts-receivable/AccountsReceivableReportPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, InvoicePaymentDetails, InvoiceStatus } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccountsReceivableReportPrintLayoutProps {
  invoices: (Sale & { paymentDetails: InvoicePaymentDetails })[];
  summary: {
    totalPending: number;
    totalOverdue: number;
    totalPaid: number;
  };
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
  reportPeriodDescription: string;
}

const AccountsReceivableReportPrintLayout: React.FC<AccountsReceivableReportPrintLayoutProps> = ({
  invoices,
  summary,
  appSettings,
  businessSettings,
  reportPeriodDescription,
}) => {
  const getStatusText = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'overdue': return 'Vencida';
      case 'pending': return 'Pendiente';
      default: return status || 'N/A';
    }
  };

  const safeFormatDate = (dateString: string) => {
      try {
        if (!dateString || !isValid(parseISO(dateString))) return 'Fecha Inválida';
        return format(parseISO(dateString), 'dd MMM yyyy', { locale: es });
      } catch {
        return 'Fecha Inválida';
      }
  }

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
            <h2 className="text-xl font-semibold mb-1">Reporte de Cuentas por Cobrar</h2>
            <p className="text-gray-600">{reportPeriodDescription || ''}</p>
            <p className="text-xs text-gray-500">Generado: {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </header>

      <section className="mb-6 break-inside-avoid-page">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Resumen General</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Pendiente de Cobro:</span> <span className="font-bold">{appSettings.currencySymbol}{(summary.totalPending || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Total Vencido:</span> <span className="font-bold">{appSettings.currencySymbol}{(summary.totalOverdue || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Total Cobrado (Histórico):</span> <span className="font-bold">{appSettings.currencySymbol}{(summary.totalPaid || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></div>
        </div>
      </section>

      <section>
         <h3 className="text-lg font-semibold border-b pb-1 mb-2">Detalle de Facturas</h3>
         <div className="space-y-3 text-xs">
            {invoices.length === 0 ? (
                <div className="p-2 text-center text-gray-500">No hay facturas que coincidan con los filtros aplicados.</div>
            ) : (
                invoices.map((invoice) => (
                    <div key={invoice.id} className="py-2 border-b last:border-b-0 break-inside-avoid-page">
                      <div className="flex justify-between font-bold">
                        <span>Factura #{invoice.id ? invoice.id.substring(0, 8) : 'N/A'}</span>
                        <span>{getStatusText(invoice.paymentDetails.status)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Cliente:</span>
                        <span>{invoice.customerName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>F. Emisión:</span>
                        <span>{safeFormatDate(invoice.timestamp)}</span>
                      </div>
                       <div className="flex justify-between text-gray-600">
                        <span>F. Vencimiento:</span>
                        <span>{safeFormatDate(invoice.paymentDetails.dueDate)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Monto:</span>
                        <span className="font-semibold">{appSettings.currencySymbol}{(invoice.totalAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                ))
            )}
        </div>
      </section>
      
      <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Cuentas por Cobrar</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default AccountsReceivableReportPrintLayout;
