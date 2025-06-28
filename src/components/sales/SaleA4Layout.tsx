
// src/components/sales/SaleA4Layout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, SaleItem, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SaleA4LayoutProps {
  sale: Sale;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const SaleA4Layout: React.FC<SaleA4LayoutProps> = ({ sale, appSettings, businessSettings }) => {
  const { currencySymbol } = appSettings;
  const isInvoice = sale.paymentMethod === 'invoice';
  const documentTitle = isInvoice ? 'FACTURA' : 'COMPROBANTE DE VENTA';

  return (
    <div className="p-8 bg-white text-black text-sm font-sans">
      <header className="flex justify-between items-start mb-8 pb-4 border-b border-gray-300">
        <div>
          {businessSettings.logoUrl && (
            <div className="relative w-24 h-24 mb-2">
              <Image src={businessSettings.logoUrl} alt="Logo" layout="fill" objectFit="contain" data-ai-hint="business logo invoice" />
            </div>
          )}
          <h1 className="text-xl font-bold">{businessSettings.businessName}</h1>
          <p>{businessSettings.address}</p>
          <p>Tel: {businessSettings.phone} | Email: {businessSettings.email}</p>
          {businessSettings.taxId && <p>ID Fiscal: {businessSettings.taxId}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold uppercase">{documentTitle}</h2>
          <p><strong>Nº:</strong> {sale.id.substring(0, 12)}</p>
          <p><strong>Fecha:</strong> {format(parseISO(sale.timestamp), 'dd MMMM yyyy, HH:mm', { locale: es })}</p>
        </div>
      </header>

      <section className="mb-8">
        <h3 className="font-bold border-b mb-2 pb-1">Cliente</h3>
        <p>{sale.customerName || 'Consumidor Final'}</p>
        {isInvoice && (
            <p><strong>ID Cliente:</strong> {sale.customerId || 'N/A'}</p>
        )}
      </section>

      <section className="mb-8">
        <h3 className="font-bold border-b mb-2 pb-1">Items</h3>
        <div className="w-full text-xs space-y-2">
            {/* Header */}
            <div className="flex font-bold text-gray-500">
                <div className="w-6/12">Producto</div>
                <div className="w-2/12 text-right">Cantidad</div>
                <div className="w-2/12 text-right">P. Unitario</div>
                <div className="w-2/12 text-right">Total</div>
            </div>
             <hr className="border-gray-300"/>
            {/* Body */}
            {sale.items.map((item: SaleItem) => (
            <div key={item.productId} className="flex py-1 border-b border-dashed">
                <div className="w-6/12">{item.productName}</div>
                <div className="w-2/12 text-right">{item.quantity}</div>
                <div className="w-2/12 text-right">{currencySymbol}{item.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                <div className="w-2/12 text-right font-semibold">{currencySymbol}{item.totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            </div>
            ))}
        </div>
      </section>
      
      <section className="flex justify-end mb-8">
        <div className="w-1/2">
            <h3 className="font-bold border-b mb-2 pb-1">Resumen</h3>
            <div className="w-full text-sm space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{sale.subTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                </div>
                {sale.discount && sale.discount > 0 && (
                    <div className="flex justify-between">
                        <span>Descuento:</span>
                        <span>-{currencySymbol}{sale.discount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                )}
                {sale.fees && sale.fees.map((fee, index) => (
                  <div key={index} className="flex justify-between">
                      <span>{fee.description}:</span>
                      <span>{currencySymbol}{fee.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-black">
                    <span>TOTAL:</span>
                    <span>{currencySymbol}{sale.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="font-bold border-b mb-2 pb-1">Detalles de Pago</h3>
        <p><strong>Método de Pago:</strong> {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transferencia' : 'Factura'}</p>
        {sale.paymentMethod === 'invoice' && (
            <>
                <p><strong>Estado:</strong> <span className="font-bold">{(sale.paymentDetails as InvoicePaymentDetails).status.toUpperCase()}</span></p>
                <p><strong>Fecha de Vencimiento:</strong> {format(parseISO((sale.paymentDetails as InvoicePaymentDetails).dueDate), 'dd MMMM yyyy', { locale: es })}</p>
            </>
        )}
         {sale.paymentMethod === 'cash' && sale.paymentDetails && (
          <>
            <p><strong>Recibido:</strong> {currencySymbol}{(sale.paymentDetails as CashPaymentDetails).amountReceived.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
            <p><strong>Cambio:</strong> {currencySymbol}{(sale.paymentDetails as CashPaymentDetails).changeGiven.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </>
        )}
      </section>

      <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
        <p>Gracias por su compra.</p>
        <p className="mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </footer>
    </div>
  );
};

export default SaleA4Layout;
