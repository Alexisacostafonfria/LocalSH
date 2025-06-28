
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

      <div className="w-full text-xs">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 font-semibold bg-gray-100 p-2 border-b">
              <div className="col-span-4">ID Producto</div>
              <div className="col-span-4">Nombre del Producto</div>
              <div className="col-span-2 text-right">Cant. Vendida Hoy</div>
              <div className="col-span-2 text-right">Stock Restante</div>
          </div>
          {/* Body */}
          <div className="border-l border-r border-b">
              {movements.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">No se registraron movimientos de productos para este día.</div>
              ) : (
                  movements.map((movement) => (
                      <div key={movement.productId} className="grid grid-cols-12 gap-4 p-2 border-b last:border-b-0 break-inside-avoid-page">
                          <div className="col-span-4 align-top">{movement.productId.substring(0,16)}...</div>
                          <div className="col-span-4 align-top">{movement.productName}</div>
                          <div className="col-span-2 align-top text-right">{movement.quantitySold}</div>
                          <div className="col-span-2 align-top text-right">{movement.remainingStock}</div>
                      </div>
                  ))
              )}
          </div>
          {/* Footer */}
          {movements.length > 0 && (
          <div className="grid grid-cols-12 gap-4 font-semibold bg-gray-100 p-2 border-t mt-2">
              <div className="col-span-8 text-right">Total Unidades Vendidas:</div>
              <div className="col-span-2 text-right">
                  {movements.reduce((sum, item) => sum + item.quantitySold, 0)}
              </div>
              <div className="col-span-2"></div>
          </div>
          )}
      </div>

      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Movimientos de Productos</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default ProductMovementsReportPrintLayout;
