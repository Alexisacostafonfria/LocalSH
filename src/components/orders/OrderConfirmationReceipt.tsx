// src/components/orders/OrderConfirmationReceipt.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Order, AppSettings, BusinessSettings, SaleItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderConfirmationReceiptProps {
  order: Order;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const OrderConfirmationReceipt: React.FC<OrderConfirmationReceiptProps> = ({ order, appSettings, businessSettings }) => {
  const { currencySymbol } = appSettings;

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
        <p className="text-sm mt-1 font-bold">COMPROBANTE DE PEDIDO</p>
      </div>

      <div className="mb-2">
        <p className="font-bold text-lg">Pedido #{order.orderNumber}</p>
        <p>Fecha: {format(new Date(order.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}</p>
        <p>Cliente: {order.customerName}</p>
        {order.customerPhone && <p>Tel: {order.customerPhone}</p>}
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="grid grid-cols-12 gap-1 font-semibold mb-1">
        <div className="col-span-1 text-left">Cant</div>
        <div className="col-span-6 text-left">Producto</div>
        <div className="col-span-2 text-right">P.Unit</div>
        <div className="col-span-3 text-right">Total</div>
      </div>

      {order.items.map((item: SaleItem) => (
        <div key={item.productId} className="grid grid-cols-12 gap-1 py-0.5">
          <div className="col-span-1 text-left">{item.quantity}</div>
          <div className="col-span-6 text-left truncate" title={item.productName}>{item.productName}</div>
          <div className="col-span-2 text-right">{currencySymbol}{item.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="col-span-3 text-right">{currencySymbol}{item.totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
        </div>
      ))}

      <hr className="border-dashed border-black my-2" />

      <div className="space-y-0.5 text-sm">
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL DEL PEDIDO:</span>
          <span>{currencySymbol}{order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <hr className="border-dashed border-black my-2" />

      <div className="text-center mt-3 text-xs">
        <p className="font-bold">** ESTE NO ES UN RECIBO FISCAL **</p>
        <p>Este es un comprobante de su pedido. El recibo de pago final se entregará al momento de completar la transacción.</p>
        <p className="mt-2">¡Gracias por su preferencia!</p>
      </div>
    </div>
  );
};

export default OrderConfirmationReceipt;
