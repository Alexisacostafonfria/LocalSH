
// src/components/accounts-receivable/PayInvoiceDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSettings, Sale, InvoicePaymentRecord, InvoicePaymentDetails, AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, DollarSign, AlertTriangle, Coins } from 'lucide-react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PayInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Sale;
  onConfirm: (updatedInvoice: Sale, paymentRecord: InvoicePaymentRecord) => void;
  appSettings: AppSettings;
}

const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

export default function PayInvoiceDialog({ isOpen, onClose, invoice, onConfirm, appSettings }: PayInvoiceDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [reference, setReference] = useState('');
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);

  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [cashBreakdownInputs, setCashBreakdownInputs] = useState<Record<string, string>>({});
  const [isCashBreakdownPopoverOpen, setIsCashBreakdownPopoverOpen] = useState(false);

  const { toast } = useToast();
  const isDayEffectivelyOpen = accountingSettings.isDayOpen && !!accountingSettings.currentOperationalDate;
  
  const invoiceTotal = useMemo(() => {
      return typeof invoice.totalAmount === 'number' && isFinite(invoice.totalAmount) ? invoice.totalAmount : 0;
  }, [invoice.totalAmount]);

  const changeGiven = useMemo(() => {
    const received = typeof amountReceived === 'number' && isFinite(amountReceived) ? amountReceived : 0;
    return Math.max(0, received - invoiceTotal);
  }, [amountReceived, invoiceTotal]);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('cash');
      setReference('');
      setAmountReceived(0);
      setCashBreakdownInputs({});
    } else {
      // Pre-fill amount received with invoice total for convenience
      setAmountReceived(invoiceTotal);
    }
  }, [isOpen, invoiceTotal]);
  
  const hasActiveBreakdown = Object.values(cashBreakdownInputs).some(val => val && parseInt(val) > 0);

  const handleCashBreakdownChange = (denominationKey: string, countStr: string) => {
    const newBreakdownInputs = { ...cashBreakdownInputs, [denominationKey]: countStr };
    setCashBreakdownInputs(newBreakdownInputs);

    const newAmountReceived = Object.entries(newBreakdownInputs).reduce((sum, [den, count]) => {
      const val = parseInt(count);
      const denVal = parseInt(den);
      if (!isNaN(val) && val > 0 && !isNaN(denVal)) {
        return sum + (val * denVal);
      }
      return sum;
    }, 0);
    setAmountReceived(newAmountReceived);
  };
  
  const handleAmountReceivedChange = (amountStr: string) => {
    setCashBreakdownInputs({});
    const parsedAmount = parseFloat(amountStr);
    setAmountReceived(isFinite(parsedAmount) ? parsedAmount : 0);
  };

  const handleConfirmPayment = () => {
    if (!isDayEffectivelyOpen) {
        toast({
            title: "Día Operativo Cerrado",
            description: "No se puede registrar el pago. Debe iniciar un nuevo día operativo en Contabilidad.",
            variant: "destructive"
        });
        return;
    }

    if (paymentMethod === 'cash' && amountReceived < invoiceTotal) {
        toast({ title: "Pago Insuficiente", description: "El monto recibido es menor al total de la factura.", variant: "destructive"});
        return;
    }

    const todayISO = new Date().toISOString();
    const updatedPaymentDetails: InvoicePaymentDetails = {
      ...(invoice.paymentDetails as InvoicePaymentDetails),
      status: 'paid',
      paidDate: todayISO,
      paidAmount: invoiceTotal,
      paidMethod: paymentMethod,
    };
    
    const updatedInvoice: Sale = { ...invoice, paymentDetails: updatedPaymentDetails };
    const paymentRecord: InvoicePaymentRecord = {
        id: crypto.randomUUID(),
        invoiceSaleId: invoice.id,
        paymentTimestamp: todayISO,
        operationalDate: accountingSettings.currentOperationalDate!,
        amountPaid: invoiceTotal,
        method: paymentMethod,
        reference: paymentMethod === 'transfer' ? reference : undefined,
    };
    
    onConfirm(updatedInvoice, paymentRecord);
  };

  const isConfirmDisabled = !isDayEffectivelyOpen || (paymentMethod === 'cash' && amountReceived < invoiceTotal);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Registrar Pago de Factura</DialogTitle>
          <DialogDescription>
            Confirmar el pago para la factura #{invoice.id ? invoice.id.substring(0,8) : 'N/A'} del cliente {invoice.customerName || 'N/A'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-3xl font-bold text-right text-primary">
              Monto a Pagar: {appSettings.currencySymbol}{invoiceTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Método de Pago Recibido</Label>
            <Select value={paymentMethod} onValueChange={(v: 'cash' | 'transfer') => setPaymentMethod(v)}>
              <SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'cash' && (
            <div className="border p-3 rounded-md space-y-3 bg-muted/30">
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="amountReceived">Monto Recibido</Label>
                  <Input id="amountReceived" type="number" placeholder="0.00" value={amountReceived || ''} onChange={e => handleAmountReceivedChange(e.target.value)} disabled={hasActiveBreakdown} />
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
                            <Input id={`breakdown-${den}`} type="number" min="0" value={cashBreakdownInputs[String(den)] || ''} onChange={e => handleCashBreakdownChange(String(den), e.target.value)} />
                          </div>
                        ))}
                      </div>
                       <Button onClick={() => setIsCashBreakdownPopoverOpen(false)} size="sm">Aplicar</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="text-lg font-semibold text-orange-500 pt-2">
                  Cambio a entregar: {appSettings.currencySymbol}{changeGiven.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
             <div className="border p-3 rounded-md space-y-3 bg-muted/30">
                <Label htmlFor="reference">Referencia de Pago (Opcional)</Label>
                <Input id="reference" value={reference} onChange={e => setReference(e.target.value)} />
            </div>
          )}

          {!isDayEffectivelyOpen && (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4"/>
                  <AlertTitle>Día Operativo No Abierto</AlertTitle>
                  <AlertDescription>
                    Para registrar este pago y que se refleje en la contabilidad, primero debe iniciar un nuevo día operativo.
                  </AlertDescription>
              </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700 text-white" disabled={isConfirmDisabled}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
