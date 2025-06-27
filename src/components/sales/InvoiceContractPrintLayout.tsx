
// src/components/sales/InvoiceContractPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, InvoicePaymentDetails, Customer } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvoiceContractPrintLayoutProps {
  sale: Sale;
  customer: Customer | undefined;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
}

const InvoiceContractPrintLayout: React.FC<InvoiceContractPrintLayoutProps> = ({ sale, customer, appSettings, businessSettings }) => {
  const { currencySymbol } = appSettings;
  const invoiceDetails = sale.paymentDetails as InvoicePaymentDetails;

  return (
    <div className="p-8 bg-white text-black text-xs font-serif leading-relaxed">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider">CONTRATO DE APERTURA DE CRÉDITO Y FACTURACIÓN</h1>
        <p className="text-sm">Contrato No: {sale.id.substring(0, 8)}</p>
      </header>

      <section className="mb-6 text-xs">
        <p className="mb-2">
          En la ciudad de {businessSettings.address.split(',').slice(1).join(',').trim() || '[Ciudad]'}, a los {format(new Date(sale.timestamp), "d 'días del mes de' MMMM 'de' yyyy", { locale: es })},
          se celebra el presente Contrato de Apertura de Crédito que suscriben, por una parte:
        </p>
        <div className="grid grid-cols-2 gap-8 mb-4">
          <div className="border p-3">
            <h2 className="font-bold text-sm mb-1">EL PROVEEDOR:</h2>
            <p><strong>Razón Social:</strong> {businessSettings.businessName}</p>
            <p><strong>ID Fiscal:</strong> {businessSettings.taxId || 'N/A'}</p>
            <p><strong>Dirección:</strong> {businessSettings.address}</p>
            <p><strong>Teléfono:</strong> {businessSettings.phone}</p>
            <p><strong>Email:</strong> {businessSettings.email}</p>
          </div>
          <div className="border p-3">
            <h2 className="font-bold text-sm mb-1">EL CLIENTE:</h2>
            <p><strong>Nombre/Razón Social:</strong> {sale.customerName || 'N/A'}</p>
            <p><strong>ID Fiscal/Personal:</strong> {customer?.personalId || 'N/A'}</p>
            <p><strong>Dirección:</strong> {'[Dirección del Cliente]'.padEnd(50, '.')}</p>
            <p><strong>Teléfono:</strong> {customer?.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
          </div>
        </div>
        <p>Ambas partes, reconociéndose mutuamente la capacidad legal necesaria para este acto, convienen en las siguientes cláusulas:</p>
      </section>

      <section className="mb-6 text-xs space-y-2">
        <h2 className="font-bold text-sm border-b pb-1 mb-2">CLÁUSULAS</h2>
        <p><strong>PRIMERA - OBJETO:</strong> EL PROVEEDOR otorga a EL CLIENTE una línea de crédito para la adquisición de los productos y/o servicios ofrecidos por EL PROVEEDOR. El presente contrato se inicia con la compra detallada a continuación.</p>
        <p><strong>SEGUNDA - COMPRA INICIAL:</strong> EL CLIENTE adquiere en este acto los siguientes productos bajo la modalidad de pago por factura:</p>
        
        <table className="w-full border-collapse text-xs my-2">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border p-1 text-left font-semibold">Producto</th>
                    <th className="border p-1 text-right font-semibold">Cantidad</th>
                    <th className="border p-1 text-right font-semibold">P. Unitario</th>
                    <th className="border p-1 text-right font-semibold">Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map(item => (
                    <tr key={item.productId}>
                        <td className="border p-1">{item.productName}</td>
                        <td className="border p-1 text-right">{item.quantity}</td>
                        <td className="border p-1 text-right">{currencySymbol}{item.unitPrice.toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                        <td className="border p-1 text-right">{currencySymbol}{item.totalPrice.toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                    </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                    <td colSpan={3} className="border p-1 text-right">TOTAL FACTURA INICIAL:</td>
                    <td className="border p-1 text-right">{currencySymbol}{sale.totalAmount.toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                </tr>
            </tbody>
        </table>

        <p><strong>TERCERA - CONDICIONES DE PAGO:</strong> EL CLIENTE se compromete a pagar el monto total de cada factura emitida por EL PROVEEDOR en un plazo no mayor a <strong>QUINCE (15) DÍAS HÁBILES</strong> a partir de la fecha de emisión de la misma. La fecha de vencimiento de la presente factura es el <strong>{format(parseISO(invoiceDetails.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</p>
        <p><strong>CUARTA - MORA:</strong> En caso de incumplimiento en el pago en la fecha estipulada, EL CLIENTE incurrirá en mora automática sin necesidad de requerimiento judicial o extrajudicial. Esto podrá generar intereses moratorios a la tasa máxima legal permitida y la suspensión de la línea de crédito.</p>
        <p><strong>QUINTA - VIGENCIA Y JURISDICCIÓN:</strong> El presente contrato tiene una vigencia indefinida y podrá ser rescindido por cualquiera de las partes con una notificación previa de 30 días. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de {businessSettings.address.split(',').slice(1).join(',').trim() || '[Ciudad]'}.</p>
      </section>

      <section className="mt-20">
        <p className="mb-10 text-xs">Leído y aprobado el contenido del presente contrato, ambas partes lo firman en señal de conformidad en el lugar y fecha indicados al inicio.</p>
        <div className="grid grid-cols-2 gap-16 text-center">
            <div>
                <div className="border-t border-black pt-2 w-full">
                    <p className="font-bold">{businessSettings.businessName}</p>
                    <p className="text-xs">(EL PROVEEDOR)</p>
                </div>
            </div>
            <div>
                <div className="border-t border-black pt-2 w-full">
                    <p className="font-bold">{sale.customerName}</p>
                    <p className="text-xs">(EL CLIENTE)</p>
                </div>
            </div>
        </div>
      </section>

      <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} {businessSettings.businessName} | Generado por Local Sales Hub</p>
      </footer>
    </div>
  );
};

export default InvoiceContractPrintLayout;
