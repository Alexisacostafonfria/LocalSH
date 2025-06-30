// src/components/products/ProductMovementsReportPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import type { BusinessSettings, ProductMovement } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const totalSold = movements.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalAdded = movements.reduce((sum, item) => sum + item.quantityAdded, 0);

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

      <div className="space-y-3 text-xs">
          {movements.length === 0 ? (
              <div className="p-2 text-center text-gray-500">No se registraron movimientos de productos para este día.</div>
          ) : (
              movements.map((movement) => (
                  <div key={movement.productId} className="py-2 border-b last:border-b-0 break-inside-avoid-page">
                      <p className="font-bold">{movement.productName}</p>
                      <p className="text-gray-500 text-xs">ID: {movement.productId.substring(0,16)}...</p>
                      <div className="grid grid-cols-2 gap-x-4 mt-1">
                          <div className="text-red-600">
                              <div className="flex justify-between">
                                  <span>Salidas (Vendido):</span>
                                  <span className="font-semibold">{movement.quantitySold}</span>
                              </div>
                          </div>
                          <div className="text-green-600">
                               <div className="flex justify-between">
                                  <span>Entradas (Ajuste):</span>
                                  <span className="font-semibold">{movement.quantityAdded}</span>
                              </div>
                          </div>
                      </div>
                       <div className="flex justify-between mt-1 pt-1 border-t border-dashed">
                          <span>Stock Final:</span>
                          <span className="font-semibold">{movement.remainingStock}</span>
                      </div>
                  </div>
              ))
          )}
          {movements.length > 0 && (
          <div className="mt-4 space-y-1 bg-gray-100 p-2 rounded-md font-semibold text-sm">
              <div className="flex justify-between text-red-700">
                  <span>Total Unidades Vendidas:</span>
                  <span>{totalSold}</span>
              </div>
              <div className="flex justify-between text-green-700">
                  <span>Total Unidades Añadidas:</span>
                  <span>{totalAdded}</span>
              </div>
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
