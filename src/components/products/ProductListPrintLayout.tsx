
// src/components/products/ProductListPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Product, AppSettings, BusinessSettings } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductBarcode from './ProductBarcode';

interface ProductListPrintLayoutProps {
  products: Product[];
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const ProductListPrintLayout: React.FC<ProductListPrintLayoutProps> = ({
  products,
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
            <h2 className="text-xl font-semibold mb-1">Reporte de Catálogo de Productos</h2>
            <p className="text-xs text-gray-500">Generado: {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
      </header>
      
      <div className="space-y-4 text-xs">
          {products.length === 0 ? (
              <div className="p-2 text-center text-gray-500">No hay productos en el catálogo.</div>
          ) : (
              products.map((product) => (
                  <div key={product.id} className="py-2 border-b last:border-b-0 break-inside-avoid-page">
                      <div className="flex justify-between items-center">
                          <div className="flex-1">
                              <p className="font-bold text-base">{product.name}</p>
                              <p className="text-gray-600">{product.category}</p>
                              <div className="mt-1 space-y-0.5">
                                <div className="flex justify-between"><span>P. Venta:</span> <span className="font-semibold">{appSettings.currencySymbol}{(typeof product.price === 'number' && isFinite(product.price) ? product.price : 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between"><span>P. Costo:</span> <span className="font-semibold">{appSettings.currencySymbol}{(typeof product.costPrice === 'number' && isFinite(product.costPrice) ? product.costPrice : 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between"><span>Stock:</span> <span className="font-semibold">{product.stock} {product.unitOfMeasure || 'unid.'}</span></div>
                              </div>
                          </div>
                          <div className="w-1/3 flex flex-col items-center justify-center pl-4">
                              {product.id && (
                                <ProductBarcode 
                                    productId={product.id}
                                    printMode={true}
                                    barcodeWidth={1}
                                    barcodeHeight={30}
                                    barcodeFontSize={10} 
                                    barcodeTextMargin={1}
                                    barcodeMargin={2}
                                />
                              )}
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Productos</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default ProductListPrintLayout;
