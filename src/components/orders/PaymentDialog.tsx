
// src/components/orders/PaymentDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSettings, Order, PaymentDetails, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails, Customer } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Coins, CheckCircle2, AlertCircle, Calendar as CalendarIcon, FileText, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '../ui/calendar';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import useLocalStorageState from '@/hooks/useLocalStorageState';


interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onConfirm: (order: Order, paymentDetails: PaymentDetails) => void;
  appSettings: AppSettings;
}

const initialCashDetails: Omit<CashPaymentDetails, 'changeGiven'> = { amountReceived: 0, tip: 0, breakdown: {} };
const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

export default function PaymentDialog({ isOpen, onClose, order, onConfirm, appSettings }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'invoice'>('cash');
  const [cashDetails, setCashDetails] = useState(initialCashDetails);
  const [transferDetails, setTransferDetails] = useState<Omit<TransferPaymentDetails, 'customerName' | 'personalId' | 'mobileNumber' | 'cardNumber'>>({ reference: '' });
  const [invoiceDueDate, setInvoiceDueDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [customers] = useLocalStorageState<Customer[]>('customers', []);
  
  const [cashBreakdownInputs, setCashBreakdownInputs] = useState<Record<string, string>>({});
  const [isCashBreakdownPopoverOpen, setIsCashBreakdownPopoverOpen] = useState(false);
  
  const { toast } = useToast();

  const totalAmount = order.totalAmount;
  const changeGiven = Math.max(0, (cashDetails.amountReceived || 0) - totalAmount - (cashDetails.tip || 0));
  const customerDetails = useMemo(() => customers.find(c => c.id === order.customerId), [customers, order.customerId]);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('cash');
      setCashDetails(initialCashDetails);
      setTransferDetails({ reference: '' });
      setInvoiceDueDate(addDays(new Date(), 30));
      setCashBreakdownInputs({});
    } else {
      setTransferDetails(prev => ({
          ...prev,
          customerId: order.customerId,
      }))
    }
  }, [isOpen, order]);

  const handleCashBreakdownChange = (denominationKey: string, countStr: string) => {
    const newBreakdownInputs = { ...cashBreakdownInputs, [denominationKey]: countStr };
    setCashBreakdownInputs(newBreakdownInputs);
    
    const newAmountReceived = Object.entries(newBreakdownInputs).reduce((sum, [den, count]) => {
      const val = parseInt(count);
      return sum + (isNaN(val) ? 0 : val * parseInt(den));
    }, 0);
    setCashDetails(prev => ({ ...prev, amountReceived: newAmountReceived }));
  };

  const handleConfirmPayment = () => {
    let finalPaymentDetails: PaymentDetails;

    if (paymentMethod === 'cash') {
      const { amountReceived, tip } = cashDetails;
      if (amountReceived < totalAmount) {
        toast({ title: "Pago Insuficiente", description: "El monto recibido es menor al total del pedido.", variant: 'destructive' });
        return;
      }
      if (appSettings.allowTips && tip && tip > (amountReceived - totalAmount)) {
          toast({ title: "Propina Inválida", description: "La propina no puede ser mayor que el cambio disponible.", variant: 'destructive' });
          return;
      }
      finalPaymentDetails = { amountReceived, changeGiven: amountReceived - totalAmount - (tip || 0), tip: tip || 0, breakdown: cashBreakdownInputs };
    } else if (paymentMethod === 'transfer') {
      if (!customerDetails?.personalId || !customerDetails?.cardNumber || customerDetails.cardNumber.replace(/[^0-9]/g, "").length !== 16) {
        toast({ title: "Datos de Cliente Incompletos", description: "Para pago por transferencia, el cliente debe tener un ID Personal y un Nro. de Tarjeta (16 dígitos) válido guardado en su perfil.", variant: 'destructive' });
        return;
      }
      finalPaymentDetails = {
        reference: transferDetails.reference,
        customerName: order.customerName,
        personalId: customerDetails.personalId,
        mobileNumber: order.customerPhone,
        cardNumber: customerDetails.cardNumber,
        customerId: order.customerId
      };
    } else { // Invoice
        if (!order.customerId) {
            toast({ title: "Cliente Requerido", description: "Se debe seleccionar un cliente registrado para emitir una factura.", variant: 'destructive'});
            return;
        }
        if (!invoiceDueDate) {
            toast({ title: "Fecha de Vencimiento Requerida", description: "Por favor, seleccione una fecha de vencimiento para la factura.", variant: 'destructive' });
            return;
        }
        finalPaymentDetails = {
            invoiceNumber: order.id,
            dueDate: invoiceDueDate.toISOString(),
            status: 'pending',
        };
    }
    onConfirm(order, finalPaymentDetails);
  };
  
  const hasActiveBreakdown = Object.values(cashBreakdownInputs).some(val => val && parseInt(val) > 0);

  const finalizeButtonDisabled = 
    (paymentMethod === 'cash' && ((cashDetails.amountReceived || 0) < totalAmount || (appSettings.allowTips && (cashDetails.tip || 0) > ((cashDetails.amountReceived || 0) - totalAmount)))) ||
    (paymentMethod === 'invoice' && (!order.customerId || !invoiceDueDate));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Registrar Pago para Pedido #{order.orderNumber}</DialogTitle>
          <DialogDescription>Confirme el pago para completar la venta. Cliente: {order.customerName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-3xl font-bold text-right text-primary">
              Total: {appSettings.currencySymbol}{totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={(v: 'cash' | 'transfer' | 'invoice') => setPaymentMethod(v)}>
              <SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="invoice">Factura (Cuentas por Cobrar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'cash' && (
            <div className="border p-3 rounded-md space-y-3 bg-muted/30">
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="amountReceived">Monto Recibido</Label>
                  <Input id="amountReceived" type="number" placeholder="0.00" value={cashDetails.amountReceived || ''} onChange={e => setCashDetails({...cashDetails, amountReceived: parseFloat(e.target.value) || 0})} disabled={hasActiveBreakdown} />
                </div>
                <Popover open={isCashBreakdownPopoverOpen} onOpenChange={setIsCashBreakdownPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" title="Detallar efectivo"><Coins className="h-5 w-5" /></Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="grid gap-4">
                      <h4 className="font-medium">Desglose de Efectivo</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {denominations.map(den => (
                          <div key={den} className="space-y-1">
                            <Label htmlFor={`breakdown-${den}`} className="text-xs">{appSettings.currencySymbol}{den}</Label>
                            <Input id={`breakdown-${den}`} type="number" min="0" value={cashBreakdownInputs[den] || ''} onChange={e => handleCashBreakdownChange(String(den), e.target.value)} />
                          </div>
                        ))}
                      </div>
                       <Button onClick={() => setIsCashBreakdownPopoverOpen(false)} size="sm">Aplicar</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              {appSettings.allowTips && (cashDetails.amountReceived || 0) >= totalAmount && (
                <div>
                  <Label htmlFor="tip">Propina (del cambio)</Label>
                  <Input id="tip" type="number" placeholder="0.00" value={cashDetails.tip || ''} onChange={e => setCashDetails({...cashDetails, tip: parseFloat(e.target.value) || 0})} />
                </div>
              )}

              <div className="text-lg font-semibold text-orange-500 pt-2">
                  Cambio: {appSettings.currencySymbol}{changeGiven.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
          
          {paymentMethod === 'transfer' && (
             <div className="border p-3 rounded-md space-y-3 bg-muted/30">
                <Label htmlFor="reference">Referencia de Pago (Opcional)</Label>
                <Input id="reference" value={transferDetails.reference || ''} onChange={e => setTransferDetails({...transferDetails, reference: e.target.value})} />
                 {!customerDetails?.personalId || !customerDetails?.cardNumber || customerDetails.cardNumber.replace(/[^0-9]/g, "").length !== 16 ? (
                    <Alert variant="warning" className="text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Faltan Datos</AlertTitle>
                        <AlertDescription>
                        Para completar una transferencia, el cliente debe tener un ID Personal y Nro. de Tarjeta (16 dígitos) válidos en su perfil.
                        </AlertDescription>
                    </Alert>
                ) : null}
            </div>
          )}

          {paymentMethod === 'invoice' && (
            <div className="border p-3 rounded-md space-y-3 bg-muted/30">
                <FileText className="h-5 w-5 text-muted-foreground mb-2"/>
                <Label>Fecha de Vencimiento de la Factura</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !invoiceDueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceDueDate ? format(invoiceDueDate, "PPP", {locale: es}) : <span>Seleccionar fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={invoiceDueDate} onSelect={setInvoiceDueDate} initialFocus locale={es} disabled={(date) => date < new Date()} /></PopoverContent>
                </Popover>
                 {!order.customerId ? (
                    <Alert variant="destructive" className="text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Cliente Anónimo</AlertTitle>
                        <AlertDescription>
                        No se puede generar una factura para un cliente anónimo. Edite el pedido y asigne un cliente registrado.
                        </AlertDescription>
                    </Alert>
                ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700 text-white" disabled={finalizeButtonDisabled}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
