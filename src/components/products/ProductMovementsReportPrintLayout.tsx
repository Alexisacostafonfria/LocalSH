
// src/components/products/ProductMovementsReportPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import type { BusinessSettings } from '@/types'; // Removed AppSettings
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ProductMovement {
  productId: string;
  productName: string;
  quantitySold: number;
  remainingStock: number;
}

interface ProductMovementsReportPrintLayoutProps {
  movements: ProductMovement[];
  operationalDateDisplay: string;
  businessSettings: BusinessSettings;
}

const ProductMovementsReportPrintLayout: React.FC<ProductMovementsReportPrintLayoutProps> = ({
  movements,
  operationalDateDisplay,
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
            <h2 className="text-xl font-semibold mb-1">Reporte de Movimientos de Productos</h2>
            <p className="text-gray-600">Día Operativo: {operationalDateDisplay}</p>
            <p className="text-xs text-gray-500">Generado: {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </header>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left font-semibold">ID Producto</th>
            <th className="border p-2 text-left font-semibold">Nombre del Producto</th>
            <th className="border p-2 text-right font-semibold">Cant. Vendida Hoy</th>
            <th className="border p-2 text-right font-semibold">Stock Restante</th>
          </tr>
        </thead>
        <tbody>
          {movements.length === 0 ? (
            <tr>
              <td colSpan={4} className="border p-2 text-center text-gray-500">
                No se registraron movimientos de productos para este día.
              </td>
            </tr>
          ) : (
            movements.map((movement) => (
              <tr key={movement.productId} className="break-inside-avoid-page">
                <td className="border p-2 align-top">{movement.productId.substring(0,16)}...</td>
                <td className="border p-2 align-top">{movement.productName}</td>
                <td className="border p-2 align-top text-right">{movement.quantitySold}</td>
                <td className="border p-2 align-top text-right">{movement.remainingStock}</td>
              </tr>
            ))
          )}
        </tbody>
       {movements.length > 0 && (
        <tfoot className="bg-gray-100 font-semibold">
            <tr>
                <td colSpan={2} className="border p-2 text-right">Total Unidades Vendidas:</td>
                <td className="border p-2 text-right">
                    {movements.reduce((sum, item) => sum + item.quantitySold, 0)}
                </td>
                <td className="border p-2"></td>
            </tr>
        </tfoot>
        )}
      </table>
      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Movimientos de Productos</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default ProductMovementsReportPrintLayout;
