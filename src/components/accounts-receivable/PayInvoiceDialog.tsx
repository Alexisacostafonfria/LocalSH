
// src/components/accounts-receivable/PayInvoiceDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSettings, Sale, InvoicePaymentRecord, InvoicePaymentDetails } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, DollarSign } from 'lucide-react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


interface PayInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Sale;
  onConfirm: (updatedInvoice: Sale, paymentRecord: InvoicePaymentRecord) => void;
  appSettings: AppSettings;
}

export default function PayInvoiceDialog({ isOpen, onClose, invoice, onConfirm, appSettings }: PayInvoiceDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [reference, setReference] = useState('');
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);

  const { toast } = useToast();

  const isDayEffectivelyOpen = accountingSettings.isDayOpen && !!accountingSettings.currentOperationalDate;

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('cash');
      setReference('');
    }
  }, [isOpen]);

  const handleConfirmPayment = () => {
    if (!isDayEffectivelyOpen) {
        toast({
            title: "Día Operativo Cerrado",
            description: "No se puede registrar el pago. Debe iniciar un nuevo día operativo en Contabilidad.",
            variant: "destructive"
        });
        return;
    }

    const todayISO = new Date().toISOString();

    const updatedPaymentDetails: InvoicePaymentDetails = {
      ...(invoice.paymentDetails as InvoicePaymentDetails),
      status: 'paid',
      paidDate: todayISO,
      paidAmount: invoice.totalAmount,
      paidMethod: paymentMethod,
    };
    
    const updatedInvoice: Sale = {
      ...invoice,
      paymentDetails: updatedPaymentDetails,
    };

    const paymentRecord: InvoicePaymentRecord = {
        id: crypto.randomUUID(),
        invoiceSaleId: invoice.id,
        paymentTimestamp: todayISO,
        operationalDate: accountingSettings.currentOperationalDate!,
        amountPaid: invoice.totalAmount,
        method: paymentMethod,
        reference: paymentMethod === 'transfer' ? reference : undefined,
    };
    
    onConfirm(updatedInvoice, paymentRecord);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Registrar Pago de Factura</DialogTitle>
          <DialogDescription>
            Confirmar el pago para la factura #{invoice.id.substring(0,8)} del cliente {invoice.customerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-3xl font-bold text-right text-primary">
              Monto a Pagar: {appSettings.currencySymbol}{invoice.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
          <Button onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700 text-white" disabled={!isDayEffectivelyOpen}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
