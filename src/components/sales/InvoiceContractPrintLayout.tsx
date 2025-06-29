
// src/components/sales/InvoiceContractPrintLayout.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Sale, AppSettings, BusinessSettings, InvoicePaymentDetails, Customer, SaleItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvoiceContractPrintLayoutProps {
  sale: Sale;
  customer: Customer | undefined;
  appSettings: AppSettings;
  businessSettings: BusinessSettings;
  previousInvoices?: Sale[];
}

const InvoiceContractPrintLayout: React.FC<InvoiceContractPrintLayoutProps> = ({ sale, customer, appSettings, businessSettings, previousInvoices }) => {
  const { currencySymbol, invoicePaymentFeePercentage, latePaymentFeePercentage } = appSettings;
  const invoiceDetails = sale.paymentDetails as InvoicePaymentDetails;
  
  const hasPreviousDebt = previousInvoices && previousInvoices.length > 0;
  const totalPreviousDebt = hasPreviousDebt ? previousInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) : 0;
  const totalConsolidatedDebt = totalPreviousDebt + sale.totalAmount;

  return (
    <div className="p-8 bg-white text-black text-xs font-serif leading-relaxed">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          {hasPreviousDebt ? "CONTRATO DE RENEGOCIACIÓN Y CONSOLIDACIÓN DE DEUDA" : "CONTRATO DE APERTURA DE CRÉDITO Y FACTURACIÓN"}
        </h1>
        <p className="text-sm">Contrato No: {sale.id.substring(0, 8)}</p>
      </header>

      <section className="mb-6 text-xs">
        <p className="mb-2">
          En la ciudad de {businessSettings.address.split(',').slice(1).join(',').trim() || '[Ciudad]'}, a los {format(new Date(sale.timestamp), "d 'días del mes de' MMMM 'de' yyyy", { locale: es })},
          se celebra el presente Contrato que suscriben, por una parte:
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
        <p><strong>PRIMERA - OBJETO:</strong> EL PROVEEDOR y EL CLIENTE acuerdan {hasPreviousDebt ? "renegociar y consolidar la deuda existente" : "establecer una línea de crédito"}, la cual se documenta mediante las facturas detalladas en el presente contrato.</p>
        
        {hasPreviousDebt && (
            <div className="my-4">
                <h3 className="font-bold text-sm">DETALLE DE DEUDA ANTERIOR</h3>
                <div className="w-full text-xs my-1 border rounded-md">
                    <div className="grid grid-cols-3 gap-1 font-bold bg-gray-100 p-1 border-b">
                        <div className="col-span-1">Factura Nº</div>
                        <div className="col-span-1">Fecha Emisión</div>
                        <div className="col-span-1 text-right">Monto Original</div>
                    </div>
                    {previousInvoices.map(inv => (
                        <div key={inv.id} className="grid grid-cols-3 gap-1 p-1 border-b last:border-b-0">
                            <div className="col-span-1">{inv.id.substring(0, 8)}</div>
                            <div className="col-span-1">{format(parseISO(inv.timestamp), 'dd/MM/yyyy')}</div>
                            <div className="col-span-1 text-right">{currencySymbol}{inv.totalAmount.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
                        </div>
                    ))}
                    <div className="grid grid-cols-3 gap-1 font-bold bg-gray-100 p-1 border-t">
                        <div className="col-span-2 text-right">TOTAL DEUDA ANTERIOR:</div>
                        <div className="col-span-1 text-right">{currencySymbol}{totalPreviousDebt.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            </div>
        )}

        <h3 className="font-bold text-sm">DETALLE DE NUEVA COMPRA (Factura Nº {sale.id.substring(0,8)})</h3>
        <div className="w-full text-xs my-1 border rounded-md">
            <div className="grid grid-cols-10 gap-1 font-bold bg-gray-100 p-1 border-b">
                <div className="col-span-5">Producto</div>
                <div className="col-span-1 text-right">Cant.</div>
                <div className="col-span-2 text-right">P. Unitario</div>
                <div className="col-span-2 text-right">Total</div>
            </div>
            {sale.items.map((item:SaleItem) => (
                <div key={item.productId} className="grid grid-cols-10 gap-1 p-1 border-b last:border-b-0">
                    <div className="col-span-5">{item.productName}</div>
                    <div className="col-span-1 text-right">{item.quantity}</div>
                    <div className="col-span-2 text-right">{currencySymbol}{item.unitPrice.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
                    <div className="col-span-2 text-right">{currencySymbol}{item.totalPrice.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
                </div>
            ))}
            <div className="grid grid-cols-10 gap-1 p-1 border-t bg-gray-50">
                <div className="col-span-8 text-right">Subtotal Nueva Compra:</div>
                <div className="col-span-2 text-right">{currencySymbol}{sale.subTotal.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
            </div>
            {sale.fees && sale.fees.map((fee, index) => (
                <div key={index} className="grid grid-cols-10 gap-1 p-1 border-b bg-gray-50">
                    <div className="col-span-8 text-right">{fee.description} ({invoicePaymentFeePercentage}%):</div>
                    <div className="col-span-2 text-right">{currencySymbol}{fee.amount.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
                </div>
            ))}
            <div className="grid grid-cols-10 gap-1 font-bold p-1 border-t bg-gray-100">
                <div className="col-span-8 text-right">TOTAL NUEVA COMPRA (Factura Nº {sale.id.substring(0,8)}):</div>
                <div className="col-span-2 text-right">{currencySymbol}{sale.totalAmount.toLocaleString('es-ES', {minimumFractionDigits: 2})}</div>
            </div>
        </div>

        <div className="flex justify-end mt-4">
            <div className="w-1/2 bg-yellow-100 border-2 border-yellow-400 p-2">
                <div className="flex justify-between font-bold">
                    <span>NUEVO TOTAL CONSOLIDADO:</span>
                    <span>{currencySymbol}{totalConsolidatedDebt.toLocaleString('es-ES', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        </div>

        <p className="mt-4"><strong>SEGUNDA - CONDICIONES DE PAGO:</strong> EL CLIENTE se compromete a pagar el monto total consolidado de esta factura en un plazo no mayor a <strong>QUINCE (15) DÍAS HÁBILES</strong> a partir de la fecha de emisión de la misma. La fecha de vencimiento para el pago total es el <strong>{format(parseISO(invoiceDetails.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</p>
        <p><strong>TERCERA - CARGOS Y MORA:</strong> Se aplica un cargo por servicio de facturación del <strong>{invoicePaymentFeePercentage}%</strong> sobre el subtotal de cada nueva compra a crédito, ya incluido en el total. En caso de incumplimiento en el pago en la fecha estipulada, EL CLIENTE incurrirá en mora automática, generando un interés moratorio del <strong>{latePaymentFeePercentage}%</strong> mensual sobre el saldo deudor y la suspensión inmediata de la línea de crédito.</p>
        <p><strong>CUARTA - VIGENCIA Y JURISDICCIÓN:</strong> El presente contrato tiene una vigencia indefinida y podrá ser rescindido por cualquiera de las partes con una notificación previa de 30 días. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de {businessSettings.address.split(',').slice(1).join(',').trim() || '[Ciudad]'}.</p>
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
