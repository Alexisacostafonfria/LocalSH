
// src/components/accounting/MonthlyClosureReportPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { AppSettings, BusinessSettings, MonthlyClosureReport } from '@/types';
import { format, set } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthlyClosureReportPrintLayoutProps {
  report: MonthlyClosureReport;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const MonthlyClosureReportPrintLayout: React.FC<MonthlyClosureReportPrintLayoutProps> = ({
  report,
  appSettings,
  businessSettings,
}) => {
  const reportDate = set(new Date(), { year: report.year, month: report.month - 1 });

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
            <h2 className="text-xl font-semibold mb-1">Estado de Resultados Mensual</h2>
            <p className="text-gray-600">Periodo: {format(reportDate, "MMMM yyyy", { locale: es })}</p>
            <p className="text-xs text-gray-500">Generado: {format(new Date(report.generationDate), "dd MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Resumen Financiero del Mes</h3>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-1">
                <span>Ingresos Totales por Ventas</span>
                <span className="font-mono">{appSettings.currencySymbol}{report.totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
                <span>(-) Costo de Bienes Vendidos (COGS)</span>
                <span className="font-mono">{appSettings.currencySymbol}{report.totalCogs.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-base bg-gray-100 p-2 mt-2 rounded">
                <span>(=) Ganancia Bruta</span>
                <span className="font-mono">{appSettings.currencySymbol}{report.grossProfit.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</span>
            </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2">Otras Métricas del Mes</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="font-medium">Total Transacciones:</div>
          <div className="font-mono text-right">{report.totalTransactions}</div>
          
          <div className="font-medium">Total Propinas (Efectivo):</div>
          <div className="font-mono text-right">{appSettings.currencySymbol}{report.totalTips.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</div>
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte Mensual</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default MonthlyClosureReportPrintLayout;
