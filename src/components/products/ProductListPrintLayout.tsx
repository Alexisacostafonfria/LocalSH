
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
      
      <div className="w-full text-xs">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 font-semibold bg-gray-100 p-2 border-b">
              <div className="col-span-3">Nombre</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-1 text-right">P. Venta</div>
              <div className="col-span-1 text-right">P. Costo</div>
              <div className="col-span-1 text-right">Stock</div>
              <div className="col-span-1">U. Med.</div>
              <div className="col-span-3 text-center">Código de Barras</div>
          </div>
          {/* Body */}
          <div className="border-l border-r border-b">
              {products.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">No hay productos en el catálogo.</div>
              ) : (
                  products.map((product) => (
                      <div key={product.id} className="grid grid-cols-12 gap-2 p-2 items-center border-b last:border-b-0 break-inside-avoid-page">
                          <div className="col-span-3 align-top">{product.name}</div>
                          <div className="col-span-2 align-top">{product.category}</div>
                          <div className="col-span-1 align-top text-right">
                              {appSettings.currencySymbol}
                              {(typeof product.price === 'number' && isFinite(product.price) ? product.price : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="col-span-1 align-top text-right">
                              {appSettings.currencySymbol}
                              {(typeof product.costPrice === 'number' && isFinite(product.costPrice) ? product.costPrice : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="col-span-1 align-top text-right">{product.stock}</div>
                          <div className="col-span-1 align-top">{product.unitOfMeasure || 'N/A'}</div>
                          <div className="col-span-3 align-middle text-center">
                              {product.id && (
                              <div style={{ display: 'inline-block', minWidth: '120px', padding: '2px 0' }}>
                                  <ProductBarcode 
                                      productId={product.id}
                                      printMode={true}
                                      barcodeWidth={1.5}
                                      barcodeHeight={40}
                                      barcodeFontSize={14} 
                                      barcodeTextMargin={3}
                                      barcodeMargin={4}
                                  />
                              </div>
                              )}
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
        <p>Fin del Reporte de Productos</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default ProductListPrintLayout;
