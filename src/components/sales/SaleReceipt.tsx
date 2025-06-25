
// src/components/sales/SaleReceipt.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, SaleItem, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SaleReceiptProps {
  sale: Sale;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const SaleReceipt: React.FC<SaleReceiptProps> = ({ sale, appSettings, businessSettings }) => {
  const { currencySymbol } = appSettings;

  const getMaskedCardNumber = (cardNumber?: string): string => {
    if (!cardNumber) return 'N/A';
    const visibleDigits = 4;
    const maskedPart = cardNumber.slice(0, -visibleDigits).replace(/[0-9]/g, 'X');
    const lastDigits = cardNumber.slice(-visibleDigits);
    
    let formattedMasked = "";
    const originalFormatted = cardNumber.replace(/[^0-9-]/g, ""); 
    let digitIndex = 0;
    for(let i = 0; i < originalFormatted.length; i++) {
        if (originalFormatted[i] === '-') {
            formattedMasked += '-';
        } else {
            if (digitIndex < (originalFormatted.replace(/-/g,"").length - visibleDigits) ) {
                formattedMasked += 'X';
            } else {
                formattedMasked += lastDigits[digitIndex - (originalFormatted.replace(/-/g,"").length - visibleDigits)];
            }
            digitIndex++;
        }
    }
    return formattedMasked.length > 19 ? formattedMasked.substring(0,19) : formattedMasked;
  };


  return (
    <div className="p-1 bg-white text-black text-xs w-full font-mono">
      <div className="text-center mb-2">
        {businessSettings.logoUrl && (
          <div className="relative w-16 h-16 mx-auto mb-1">
            <Image 
              src={businessSettings.logoUrl} 
              alt={`${businessSettings.businessName || 'Logo'} logo`} 
              layout="fill" 
              objectFit="contain" 
              data-ai-hint="business logo receipt"
            />
          </div>
        )}
        <h1 className="text-base font-bold uppercase">{businessSettings.businessName || 'Local Sales Hub'}</h1>
        {businessSettings.address && <p className="text-xs">{businessSettings.address}</p>}
        {businessSettings.phone && <p className="text-xs">Tel: {businessSettings.phone}</p>}
        {businessSettings.taxId && <p className="text-xs">ID Fiscal: {businessSettings.taxId}</p>}
        <p className="text-sm mt-1">{sale.paymentMethod === 'invoice' ? 'FACTURA' : 'RECIBO DE VENTA'}</p>
      </div>

      <div className="mb-2">
        <p>ID Venta: {sale.id.substring(0, 12)}...</p>
        <p>Fecha: {format(new Date(sale.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}</p>
        {sale.customerName && <p>Cliente (General): {sale.customerName}</p>}
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="grid grid-cols-12 gap-1 font-semibold mb-1">
        <div className="col-span-1 text-left">Cant.</div>
        <div className="col-span-6 text-left">Producto</div>
        <div className="col-span-2 text-right">P.Unit</div>
        <div className="col-span-3 text-right">Total</div>
      </div>

      {sale.items.map((item: SaleItem) => (
        <div key={item.productId} className="grid grid-cols-12 gap-1 py-0.5">
          <div className="col-span-1 text-left">{item.quantity}</div>
          <div className="col-span-6 text-left truncate" title={item.productName}>{item.productName}</div>
          <div className="col-span-2 text-right">{currencySymbol}{item.unitPrice.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="col-span-3 text-right">{currencySymbol}{item.totalPrice.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      ))}

      <hr className="border-dashed border-black my-2" />

      <div className="space-y-0.5 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{currencySymbol}{sale.subTotal.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {sale.discount && sale.discount > 0 && (
          <div className="flex justify-between">
            <span>Descuento:</span>
            <span>-{currencySymbol}{sale.discount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL:</span>
          <span>{currencySymbol}{sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="text-sm">
        <p className="font-semibold">Detalles del Pago:</p>
        <p>Método: {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transferencia' : 'Factura'}</p>
        {sale.paymentMethod === 'cash' && sale.paymentDetails && (
          <>
            <p>Recibido: {currencySymbol}{(sale.paymentDetails as CashPaymentDetails).amountReceived.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            {(sale.paymentDetails as CashPaymentDetails).changeGiven !== undefined && (
              <p>Cambio: {currencySymbol}{(sale.paymentDetails as CashPaymentDetails).changeGiven.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            )}
            {(sale.paymentDetails as CashPaymentDetails).tip && (sale.paymentDetails as CashPaymentDetails).tip! > 0 && (
              <p>Propina: {currencySymbol}{(sale.paymentDetails as CashPaymentDetails).tip!.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            )}
          </>
        )}
        {sale.paymentMethod === 'transfer' && sale.paymentDetails && (
          <>
            {(sale.paymentDetails as TransferPaymentDetails).customerName && (
                <p>Nombre Cliente (Transfer): {(sale.paymentDetails as TransferPaymentDetails).customerName}</p>
            )}
            {(sale.paymentDetails as TransferPaymentDetails).personalId && (
                <p>ID Personal: {(sale.paymentDetails as TransferPaymentDetails).personalId}</p>
            )}
            {(sale.paymentDetails as TransferPaymentDetails).mobileNumber && (
                <p>Móvil: {(sale.paymentDetails as TransferPaymentDetails).mobileNumber}</p>
            )}
            {(sale.paymentDetails as TransferPaymentDetails).cardNumber && (
                <p>Tarjeta: {getMaskedCardNumber((sale.paymentDetails as TransferPaymentDetails).cardNumber)}</p>
            )}
            {(sale.paymentDetails as TransferPaymentDetails).reference && (
              <p>Referencia: {(sale.paymentDetails as TransferPaymentDetails).reference}</p>
            )}
          </>
        )}
        {sale.paymentMethod === 'invoice' && sale.paymentDetails && (
            <>
                <p>Estado: <span className="font-bold">{(sale.paymentDetails as InvoicePaymentDetails).status.toUpperCase()}</span></p>
                <p>Fecha Vencimiento: {format(parseISO((sale.paymentDetails as InvoicePaymentDetails).dueDate), 'dd MMM yyyy', {locale: es})}</p>
            </>
        )}
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="text-center mt-3">
        <p>¡Gracias por su compra!</p>
        {businessSettings.website && <p className="text-xs mt-1">{businessSettings.website}</p>}
        <p className="text-xs mt-1">{businessSettings.businessName || 'Local Sales Hub'}</p>
        <p className="text-xs mt-1">&copy; {new Date().getFullYear()} Ing. Alexis Acosta Fonfrias. Diseño y Programación.</p>
      </div>
    </div>
  );
};

export default SaleReceipt;
