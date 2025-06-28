
// src/components/accounting/DailyClosureReportPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { AppSettings, BusinessSettings, DailyClosureReport } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


interface DailyClosureReportPrintLayoutProps {
  dailySummary: DailyClosureReport;
  operationalDateDisplay: string;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const DailyClosureReportPrintLayout: React.FC<DailyClosureReportPrintLayoutProps> = ({
  dailySummary,
  operationalDateDisplay,
  appSettings,
  businessSettings,
}) => {
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
            <h2 className="text-xl font-semibold mb-1">Reporte de Cierre Diario y Arqueo</h2>
            <p className="text-gray-600">Día Operativo: {operationalDateDisplay}</p>
            <p className="text-xs text-gray-500">Generado: {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Resumen del Día ({operationalDateDisplay})</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span>Ingresos Totales (Ventas):</span> <span>{appSettings.currencySymbol}{dailySummary.totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Costo de Bienes Vendidos:</span> <span>{appSettings.currencySymbol}{dailySummary.totalCogs.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Ganancia Bruta:</span> <span>{appSettings.currencySymbol}{dailySummary.grossProfit.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between pt-2"><span>Total Transacciones:</span> <span>{dailySummary.totalTransactions}</span></div>
          <div className="flex justify-between"><span>Ventas en Efectivo:</span> <span>{appSettings.currencySymbol}{dailySummary.cashSalesAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Ventas por Transferencia:</span> <span>{appSettings.currencySymbol}{dailySummary.transferSalesAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
          {appSettings.allowTips && (<div className="flex justify-between"><span>Total Propinas (Efectivo):</span> <span>{appSettings.currencySymbol}{dailySummary.totalTips.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>)}
          <div className="flex justify-between pt-2 border-t"><span>Cobranza Facturas (Efectivo):</span> <span>{appSettings.currencySymbol}{dailySummary.invoicePaymentsInCash.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>Cobranza Facturas (Transfer):</span> <span>{appSettings.currencySymbol}{dailySummary.invoicePaymentsInTransfer.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Arqueo de Caja</h3>
        <div className="flex justify-between text-xs font-semibold"><span>Efectivo Esperado en Caja:</span> <span>{appSettings.currencySymbol}{dailySummary.expectedCashInBox.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
        
        <h4 className="text-sm font-semibold mt-3 mb-1">Detalle del Efectivo Contado:</h4>
        {dailySummary.countedCashBreakdown.length > 0 ? (
          <div className="space-y-1 text-xs border-t border-b py-2 my-2">
            <div className="flex justify-between font-semibold mb-1">
              <span>Denominación</span>
              <span className="text-right w-1/4">Cantidad</span>
              <span className="text-right w-1/4">Valor Total</span>
            </div>
            {dailySummary.countedCashBreakdown.sort((a, b) => b.denomination - a.denomination).map(item => (
              <div key={item.denomination} className="flex justify-between">
                <span>{appSettings.currencySymbol}{item.denomination.toLocaleString('es-ES')}</span>
                <span className="text-right w-1/4">{item.count}</span>
                <span className="text-right w-1/4">{appSettings.currencySymbol}{item.totalValue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 my-2">No se ingresó desglose de efectivo contado.</p>
        )}
        
        <div className="space-y-1 text-xs mt-2">
            <div className="flex justify-between"><span>Total Contado en Caja:</span> <span className="font-semibold">{appSettings.currencySymbol}{dailySummary.totalCountedCash.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span></div>
            <div className={`flex justify-between font-semibold ${dailySummary.cashDifference === 0 ? '' : dailySummary.cashDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Diferencia:</span> 
                <span>
                    {appSettings.currencySymbol}{dailySummary.cashDifference.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}
                    {dailySummary.cashDifference > 0 && " (Sobrante)"}
                    {dailySummary.cashDifference < 0 && " (Faltante)"}
                    {dailySummary.cashDifference === 0 && " (Cuadre Exacto)"}
                </span>
            </div>
        </div>
      </section>

      {dailySummary.closureNotes && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold border-b pb-1 mb-2">Notas Adicionales del Cierre</h3>
          <p className="text-xs whitespace-pre-wrap">{dailySummary.closureNotes}</p>
        </section>
      )}

      <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Cierre Diario y Arqueo</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default DailyClosureReportPrintLayout;
